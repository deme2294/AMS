const validator = require('validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify for server-side HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string') return input;

    // 1. Remove any HTML tags and scripts via DOMPurify
    let sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: []
    });

    // 2. Strip javascript: URI schemes (handles mixed-case, e.g. "jaVasCript:")
    sanitized = sanitized.replace(/javascript\s*:/gi, '');

    // 3. Strip on* event handler patterns (e.g. oNcliCk=, onload=, onerror=)
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');

    // 4. Trim whitespace
    sanitized = sanitized.trim();

    // 5. Prevent common SQL injection patterns and escape special characters
    // While parameterized queries are used, this adds a layer of defense
    sanitized = sanitized.replace(/['";\/\\]/g, '\\$&');

    // 6. Convert multiple spaces to single space to prevent overflow issues
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
};

/**
 * Sanitize HTML content (for rich text editors)
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized HTML
 */
const sanitizeHTML = (html) => {
    if (typeof html !== 'string') return html;

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    });
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
    return validator.isEmail(email);
};

/**
 * Validate URL format
 * @param {string} url - URL string
 * @returns {boolean} - Is valid URL
 */
const isValidURL = (url) => {
    return validator.isURL(url, { require_protocol: true });
};

/**
 * Validate phone number (Ethiopian format)
 * @param {string} phone - Phone number
 * @returns {boolean} - Is valid phone
 */
const isValidPhone = (phone) => {
    // Ethiopian phone format: +251XXXXXXXXX or 09XXXXXXXX or 07XXXXXXXX
    const phoneRegex = /^(\+251|0)[79]\d{8}$/;
    return phoneRegex.test(phone);
};

/**
 * Sanitize URL to prevent javascript: or other malicious protocols
 * @param {string} url - Raw URL string
 * @returns {string} - Sanitized URL
 */
const sanitizeURL = (url) => {
    if (typeof url !== 'string') return url;

    // Use DOMPurify to sanitize the URL as an attribute value
    // This will strip javascript: etc.
    const sanitized = DOMPurify.sanitize(url, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        RETURN_TRUSTED_TYPE: false
    });

    // Strip leading javascript: if DOMPurify didn't (though it usually does)
    if (url.toLowerCase().trim().startsWith('javascript:')) {
        return '';
    }

    return sanitized;
};

/**
 * Sanitize object recursively
 * @param {object} obj - Object to sanitize
 * @param {array} htmlFields - Fields that should preserve HTML (with sanitization)
 * @param {array} urlFields - Fields that should be treated as URLs
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj, htmlFields = [], urlFields = []) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];

            if (typeof value === 'string') {
                if (urlFields.includes(key)) {
                    sanitized[key] = sanitizeURL(value);
                } else if (htmlFields.includes(key)) {
                    sanitized[key] = sanitizeHTML(value);
                } else {
                    sanitized[key] = sanitizeString(value);
                }
            } else if (typeof value === 'object' && value !== null) {
                // Recursively sanitize objects/arrays
                sanitized[key] = sanitizeObject(value, htmlFields, urlFields);
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
};

/**
 * Middleware to sanitize request body
 * @param {array} htmlFields - Fields that should preserve HTML
 * @param {array} urlFields - Fields that should be treated as URLs
 */
const sanitizeInput = (htmlFields = [], urlFields = []) => {
    return (req, res, next) => {
        if (req.body) {
            req.body = sanitizeObject(req.body, htmlFields, urlFields);
        }

        if (req.query) {
            req.query = sanitizeObject(req.query, [], []);
        }

        if (req.params) {
            req.params = sanitizeObject(req.params, [], []);
        }

        next();
    };
};

/**
 * Validate required fields
 * @param {array} requiredFields - Array of required field names
 */
const validateRequired = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];

        // console.log('Validating Required Fields:', requiredFields);
        // console.log('Request Body:', req.body);

        for (const field of requiredFields) {
            const value = req.body[field];
            // Check if undefined, null, or empty string (only if it's a string)
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            console.error(`Validation Failed: Missing fields [${missingFields.join(', ')}]`);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Validate field types
 * @param {object} fieldTypes - Object mapping field names to expected types
 * Example: { email: 'email', age: 'number', website: 'url' }
 */
const validateTypes = (fieldTypes) => {
    return (req, res, next) => {
        const errors = [];

        for (const [field, config] of Object.entries(fieldTypes)) {
            const value = req.body[field];
            if (!value) continue;

            // Handle both simple string types and config objects
            const type = typeof config === 'string' ? config : config.type;
            const maxLength = config.maxLength || 1000; // Default max 1000

            if (typeof value === 'string' && value.length > maxLength) {
                errors.push(`${field} exceeds maximum length of ${maxLength}`);
                continue;
            }

            switch (type) {
                case 'email':
                    if (!isValidEmail(value)) {
                        errors.push(`${field} must be a valid email address`);
                    }
                    break;
                case 'url':
                    if (!isValidURL(value)) {
                        errors.push(`${field} must be a valid URL`);
                    }
                    break;
                case 'phone':
                    if (!isValidPhone(value)) {
                        errors.push(`${field} must be a valid phone number`);
                    }
                    break;
                case 'number':
                    if (isNaN(value)) {
                        errors.push(`${field} must be a number`);
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                        errors.push(`${field} must be a boolean`);
                    }
                    break;
                case 'date':
                    if (!validator.isISO8601(value)) {
                        errors.push(`${field} must be a valid date`);
                    }
                    break;
                case 'name':
                    if (!/^[a-zA-Z\s.-]{1,100}$/.test(value)) {
                        errors.push(`${field} contains invalid characters (letters only)`);
                    }
                    break;
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        next();
    };
};

module.exports = {
    sanitizeString,
    sanitizeHTML,
    sanitizeObject,
    sanitizeInput,
    validateRequired,
    validateTypes,
    isValidEmail,
    isValidURL,
    isValidPhone
};

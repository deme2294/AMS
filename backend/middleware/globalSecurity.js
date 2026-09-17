const { sanitizeInput } = require('./inputValidation');

/**
 * Global security middleware to apply to all routes
 * This provides a baseline level of input sanitization
 */
const globalSecurity = () => {
    return (req, res, next) => {
        // Log suspicious activity
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /onerror=/i,
            /onload=/i,
            /onclick=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /eval\(/i,
            /expression\(/i,
            /vbscript:/i,
            /data:text\/html/i
        ];

        // Check all inputs for suspicious patterns
        const checkForSuspiciousContent = (obj, path = '') => {
            if (typeof obj === 'string') {
                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(obj)) {
                        console.warn(`[SECURITY] Suspicious pattern detected in ${path}: ${pattern}`);
                        console.warn(`[SECURITY] IP: ${req.ip}, User-Agent: ${req.get('user-agent')}`);
                        console.warn(`[SECURITY] Content: ${obj.substring(0, 100)}...`);
                    }
                }
            } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    checkForSuspiciousContent(obj[key], `${path}.${key}`);
                }
            }
        };

        // Check request body, query, and params
        if (req.body) checkForSuspiciousContent(req.body, 'body');
        if (req.query) checkForSuspiciousContent(req.query, 'query');
        if (req.params) checkForSuspiciousContent(req.params, 'params');

        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        next();
    };
};

/**
 * Rate limiting per IP for sensitive endpoints
 */
const rateLimitMap = new Map();

const advancedRateLimit = (maxRequests = 10, windowMs = 60000) => {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, []);
        }

        const requests = rateLimitMap.get(ip);

        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

        if (validRequests.length >= maxRequests) {
            console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        validRequests.push(now);
        rateLimitMap.set(ip, validRequests);

        next();
    };
};

/**
 * Clean up rate limit map periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, requests] of rateLimitMap.entries()) {
        const validRequests = requests.filter(timestamp => now - timestamp < 3600000); // 1 hour
        if (validRequests.length === 0) {
            rateLimitMap.delete(ip);
        } else {
            rateLimitMap.set(ip, validRequests);
        }
    }
}, 300000); // Clean up every 5 minutes

module.exports = {
    globalSecurity,
    advancedRateLimit
};

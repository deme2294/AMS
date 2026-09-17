const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fileType = require('file-type');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types (strict whitelist)
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
    // ❌ SVG explicitly excluded due to XSS risk
];

const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg'
];

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip'
];

// Allowed file extensions (strict whitelist)
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip'];

/**
 * Sanitize filename to prevent path traversal and XSS
 */
const sanitizeFilename = (filename) => {
    // Remove any path components
    filename = path.basename(filename);

    // Remove special characters and scripts
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Prevent double extensions (.jpg.exe)
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    return `${name}${ext}`.toLowerCase();
};

/**
 * Generate secure random filename
 */
const generateSecureFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
};

/**
 * Validate file type by checking both MIME type and magic bytes
 */
const validateFileType = async (filePath, declaredMimeType, allowedTypes) => {
    try {
        // 1. Magic Byte Validation
        const type = await fileType.fromFile(filePath);

        if (!type) {
            console.error('[UPLOAD] Could not determine file type from magic bytes');
            return false;
        }

        // Check if actual MIME type matches declared type
        if (type.mime !== declaredMimeType) {
            const isOffice = declaredMimeType.includes('officedocument') || declaredMimeType.includes('msword') || declaredMimeType.includes('ms-excel');
            const detectedAsZip = type.mime === 'application/zip';

            // Allow mismatches between image types (e.g. user uploads a .png but calls it a .jpg)
            const isImageMismatch = declaredMimeType.startsWith('image/') && type.mime.startsWith('image/');

            if (!(isOffice && detectedAsZip) && !isImageMismatch) {
                console.error(`[UPLOAD SECURITY] MIME type mismatch: declared=${declaredMimeType}, actual=${type.mime}`);
                return false;
            }
        }

        // Check if MIME type is in allowed list
        const isAllowed = allowedTypes.includes(type.mime) ||
            (type.mime === 'application/zip' && declaredMimeType.includes('officedocument'));

        if (!isAllowed) {
            console.error(`[UPLOAD SECURITY] File type not allowed: detected=${type.mime}, declared=${declaredMimeType}`);
            return false;
        }

        // 2. Deep Content Scan (Defense against Polyglots/Embedded Scripts)
        console.log(`[UPLOAD] Performing deep content scan on: ${filePath}`);

        // Read the FULL file buffer for comprehensive scanning
        // This stops scripts hidden at the end of large images
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('utf8'); // Full file content
        const lowerContent = content.toLowerCase();

        const maliciousPatterns = [
            '<?php',
            '<?=',
            '<script',
            'eval(',
            'base64_decode(',
            'shell_exec(',
            'system(',
            'passthru(',
            'javascript:',
            'data:text/html',
            'vbscript:',
            'onmouseover',
            'onerror',
            'onload',
            'onclick',
            'onfocus',
            'onblur',
            '<?xml',
            '<svg',
            '<!ENTITY',
            '<!DOCTYPE',
            'xlink:href',
            'fscommand'
        ];

        for (const pattern of maliciousPatterns) {
            if (lowerContent.includes(pattern.toLowerCase())) {
                // False positive check: common in binary images
                if (declaredMimeType.startsWith('image/')) {
                    // Check if the file is predominantly binary
                    // Legitimate images are binary, SVGs are plaintext
                    const isBinary = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(content.substring(0, 1000));

                    // Patterns that are RARELY in images but common in XSS
                    const highRiskPatterns = ['<script', 'javascript:', 'xlink:href', '<svg', 'onerror', 'onload'];

                    if (isBinary && !highRiskPatterns.some(p => pattern.toLowerCase().includes(p))) {
                        console.warn(`[UPLOAD SECURITY] Binary false positive likely for "${pattern}". Continuing...`);
                        continue;
                    }
                }

                console.error(`[UPLOAD SECURITY] Malicious pattern detected: ${pattern} in ${filePath}`);
                return false;
            }
        }

        console.log(`[UPLOAD] Deep scan passed for: ${filePath}`);
        return true;
    } catch (error) {
        console.error('[UPLOAD] File validation error:', error);
        return false;
    }
};

/**
 * Storage configuration with secure filename generation
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const secureFilename = generateSecureFilename(file.originalname);
        cb(null, secureFilename);
    }
});

/**
 * File filter for initial validation (before upload)
 */
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Sanitize original filename
    file.originalname = sanitizeFilename(file.originalname);

    // Check extension and MIME type
    const isAllowedImage = ALLOWED_IMAGE_EXTENSIONS.includes(ext) && ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isAllowedVideo = ALLOWED_VIDEO_EXTENSIONS.includes(ext) && ALLOWED_VIDEO_TYPES.includes(mimeType);
    const isAllowedDocument = ALLOWED_DOCUMENT_EXTENSIONS.includes(ext) && ALLOWED_DOCUMENT_TYPES.includes(mimeType);

    if (isAllowedImage || isAllowedVideo || isAllowedDocument) {
        cb(null, true);
    } else {
        const error = new Error('File type not supported. Please upload a valid image, video, or document.');
        error.status = 400;
        cb(error, false);
    }
};

/**
 * Main upload middleware
 */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Max 10 files per request
    },
    fileFilter: fileFilter
});

/**
 * Post-upload validation middleware (validates magic bytes)
 */
const validateUploadedFile = async (req, res, next) => {
    if (!req.file && !req.files) {
        return next();
    }

    let files = [];
    if (req.file) {
        files = [req.file];
    } else if (Array.isArray(req.files)) {
        files = req.files;
    } else if (typeof req.files === 'object') {
        // Flatten object of arrays (for upload.fields())
        files = Object.values(req.files).flat();
    }


    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];

    try {
        for (const file of files) {
            if (!file) continue;

            // Refine allowed types based on declared MIME type
            let specificsAllowed = allowedTypes;
            if (file.mimetype.startsWith('image/')) {
                specificsAllowed = ALLOWED_IMAGE_TYPES;
            } else if (file.mimetype.startsWith('video/')) {
                specificsAllowed = ALLOWED_VIDEO_TYPES;
            }

            const isValid = await validateFileType(file.path, file.mimetype, specificsAllowed);

            if (!isValid) {
                // Delete the uploaded file
                fs.unlinkSync(file.path);

                return res.status(400).json({
                    success: false,
                    message: 'File type not supported. Please upload a valid image, video, or document.'
                });
            }
        }

        next();
    } catch (error) {
        console.error('[UPLOAD] Validation error:', error);

        // Clean up uploaded files
        for (const file of files) {
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'File type not supported. Please upload a valid image, video, or document.'
        });
    }
};

/**
 * Create a configured uploader for a specific subfolder
 * @param {string} subfolder - Subfolder within uploads directory (e.g., 'partners-investors')
 * @returns {multer.Instance} Configured multer instance
 */
const createUploader = (subfolder = '') => {
    const destinationDir = subfolder ? path.join(uploadDir, subfolder) : uploadDir;

    // Ensure directory exists
    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destinationDir);
        },
        filename: (req, file, cb) => {
            const secureFilename = generateSecureFilename(file.originalname);
            cb(null, secureFilename);
        }
    });

    return multer({
        storage: storage,
        limits: {
            fileSize: 50 * 1024 * 1024, // Increased to 50MB for videos/large docs
            files: 10
        },
        fileFilter: fileFilter
    });
};

// Pre-configured uploaders for common use cases
module.exports.uploadCategoryImage = createUploader('service-categories');

module.exports = {
    upload,
    createUploader,
    validateUploadedFile,
    validateFileType,
    sanitizeFilename,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_DOCUMENT_TYPES,
    // Pre-configured uploaders
    uploadCategoryImage: createUploader('service-categories'),
    uploadServiceImage: createUploader('services')
};

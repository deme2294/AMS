// Image upload handler for ID card persons
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/id-photos');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const { createUploader, validateUploadedFile } = require('../middleware/uploadMiddleware');

// Initialize uploader for ID photos subdirectory
const uploader = createUploader('id-photos');

// Upload handler wrapper
exports.uploadPhoto = (req, res, next) => {
    // Use .any() for maximum flexibility with frontend field names
    const upload = uploader.any();

    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File is too large.' });
            }
            return res.status(400).json({ success: false, message: 'File upload failed.' });
        }

        // For .any(), req.file is not set, only req.files. 
        // We set req.file to the first file for compatibility with other handlers.
        if (req.files && req.files.length > 0) {
            req.file = req.files[0];
        }

        try {
            await validateUploadedFile(req, res, next);
        } catch (validationErr) {
            next(validationErr);
        }
    });
};

exports.handlePhotoUpload = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const photoUrl = `/uploads/id-photos/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            photo_url: photoUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error processing photo upload:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred while processing the upload.' });
    }
};

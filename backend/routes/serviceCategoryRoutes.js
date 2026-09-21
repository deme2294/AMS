const express = require('express');
const router = express.Router();
const serviceCategoryController = require('../controllers/serviceCategoryController');
const verifyToken = require('../middleware/verifyToken');
const { restrictTo } = require('../middleware/roleMiddleware');
const { ROLES } = require('../middleware/roles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/categories');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Public routes (no auth required)
router.get('/public', serviceCategoryController.getAllCategories);

// Protected routes (Admin, Manager, Barber, Receptionist can view)
router.get(
    '/',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST]),
    serviceCategoryController.getAllCategories
);

router.get(
    '/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST]),
    serviceCategoryController.getCategoryById
);

router.post(
    '/',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    upload.single('image'),
    serviceCategoryController.createCategory
);

router.put(
    '/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    upload.single('image'),
    serviceCategoryController.updateCategory
);

router.delete(
    '/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    serviceCategoryController.deleteCategory
);

router.patch(
    '/:id/toggle-status',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    serviceCategoryController.toggleCategoryStatus
);

router.put(
    '/sort-order/update',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    serviceCategoryController.updateSortOrder
);

module.exports = router;

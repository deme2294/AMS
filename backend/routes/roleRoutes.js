const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const verifyToken = require('../middleware/verifyToken');
const { restrictTo } = require('../middleware/roleMiddleware');
const { ROLES } = require('../middleware/roles');

// Base path: /api/roles

// Get all roles (Admin only — role management is sensitive)
router.get('/',      verifyToken, restrictTo([ROLES.ADMIN]), roleController.getAllRoles);

// Get single role by ID
router.get('/:id',   verifyToken, restrictTo([ROLES.ADMIN]), roleController.getRoleById);

// Create a custom role (Admin only)
router.post('/',     verifyToken, restrictTo([ROLES.ADMIN]), roleController.createRole);

// Update a role name/status (Admin only; system roles are name-protected in controller)
router.put('/:id',   verifyToken, restrictTo([ROLES.ADMIN]), roleController.updateRole);

// Delete a role (Admin only; system role IDs 1-5 are protected in controller)
router.delete('/:id', verifyToken, restrictTo([ROLES.ADMIN]), roleController.deleteRole);

// Clone a role with all permissions (Admin only)
router.post('/:id/clone', verifyToken, restrictTo([ROLES.ADMIN]), roleController.cloneRole);

// Get users assigned to a role (Admin only)
router.get('/:id/users', verifyToken, restrictTo([ROLES.ADMIN]), roleController.getRoleUsers);

module.exports = router;

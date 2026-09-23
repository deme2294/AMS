const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const verifyToken = require('../middleware/verifyToken');
const { restrictTo } = require('../middleware/roleMiddleware');
const { ROLES } = require('../middleware/roles');

// 1. Navigation for current user
router.get('/my-nav', verifyToken, menuController.getMyNavigation);

// 2. All menus catalog (Admin & Manager)
router.get('/all', verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), menuController.getAllMenus);

// 3. Side-by-side Role Comparison Matrix
router.get('/compare', verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), menuController.compareRolePermissions);

// 4. Role-specific permissions
router.get('/role/:roleId', verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), menuController.getRolePermissions);
router.post('/role/:roleId', verifyToken, restrictTo([ROLES.ADMIN]), menuController.updateRolePermissions);

// 4b. User-specific permission overrides
router.get('/user/:userId', verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), menuController.getUserPermissions);
router.post('/user/:userId', verifyToken, restrictTo([ROLES.ADMIN]), menuController.updateUserPermissions);

// 5. Quick action assignment / toggle
router.post('/assign-action', verifyToken, restrictTo([ROLES.ADMIN]), menuController.assignPermissionAction);

// 6. Menu Module CRUD
router.post('/create', verifyToken, restrictTo([ROLES.ADMIN]), menuController.createMenu);
router.post('/', verifyToken, restrictTo([ROLES.ADMIN]), menuController.createMenu);
router.get('/:id', verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), menuController.getMenuById);
router.put('/:id', verifyToken, restrictTo([ROLES.ADMIN]), menuController.updateMenu);
router.delete('/:id', verifyToken, restrictTo([ROLES.ADMIN]), menuController.deleteMenu);

module.exports = router;

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const userController = require('../controllers/userController.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const { ROLES } = require('../middleware/roles.js');
const { hasMenuPermission } = require('../middleware/menuPermissionMiddleware.js');
const auditMiddleware = require('../middleware/auditMiddleware.js');

// User management routes (Admin & authorized management)
router.get('/users',                  verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), userController.getAllUsers);
router.get('/department',             verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]), userController.getDepartment);
router.get('/users/:user_id',         verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), userController.getUserById);

router.post('/addUser',               verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/add'), auditMiddleware('CREATE', 'User'), userController.addUser);
router.post('/users',                 verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/add'), auditMiddleware('CREATE', 'User'), userController.addUser);
router.put('/updateUser/:user_id',    verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('UPDATE', 'User'), userController.updateUser);
router.put('/users/:user_id',         verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('UPDATE', 'User'), userController.updateUser);

// Dedicated role assignment endpoint
router.put('/users/:user_id/role',    verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('ASSIGN_ROLE', 'User'), userController.assignRole);

// Status and unlock endpoints
router.put('/users/:user_id/status',  verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('UPDATE_STATUS', 'User'), userController.changeUserStatus);
router.put('/:user_id(\\d+)/status',  verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('UPDATE_STATUS', 'User'), userController.changeUserStatus);
router.post('/users/:user_id/unlock', verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('UNLOCK', 'User'), userController.unlockUser);
router.post('/:user_id(\\d+)/unlock', verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('UNLOCK', 'User'), userController.unlockUser);

// Delete endpoints (support all path conventions)
router.delete('/deleteUser/:user_id', verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('DELETE', 'User'), userController.deleteUser);
router.delete('/users/:user_id',      verifyToken, restrictTo([ROLES.ADMIN]), hasMenuPermission('/users/all'), auditMiddleware('DELETE', 'User'), userController.deleteUser);

module.exports = router;

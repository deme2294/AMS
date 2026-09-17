const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const userController = require('../controllers/userController.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const { ROLES } = require('../middleware/roles.js');
const { hasMenuPermission } = require('../middleware/menuPermissionMiddleware.js');
const auditMiddleware = require('../middleware/auditMiddleware.js');

// All user management routes are Admin-only
router.get('/users',            verifyToken, restrictTo([ROLES.ADMIN]),                           hasMenuPermission('/users/all'), userController.getAllUsers);
router.get('/department',       verifyToken, restrictTo([ROLES.ADMIN, ROLES.MANAGER]),            userController.getDepartment);
router.put('/:user_id/status',  verifyToken, restrictTo([ROLES.ADMIN]),                           hasMenuPermission('/users/all'), auditMiddleware('UPDATE_STATUS', 'User'), userController.changeUserStatus);
router.post('/addUser',         verifyToken, restrictTo([ROLES.ADMIN]),                           hasMenuPermission('/users/add'), auditMiddleware('CREATE', 'User'), userController.addUser);
router.put('/updateUser/:user_id', verifyToken, restrictTo([ROLES.ADMIN]),                        hasMenuPermission('/users/all'), auditMiddleware('UPDATE', 'User'), userController.updateUser);
router.delete('/deleteUser/:user_id', verifyToken, restrictTo([ROLES.ADMIN]),                     hasMenuPermission('/users/all'), auditMiddleware('DELETE', 'User'), userController.deleteUser);

module.exports = router;

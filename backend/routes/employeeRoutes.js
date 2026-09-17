// employeeRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const { ROLES } = require('../middleware/roles.js');
const { addEmployee, getAllDepartments, getAllRoles, getAllSupervisors, getAllEmployees, batchAddEmployees } = require('../controllers/employeeController');

// Role groupings
const MANAGE_EMPLOYEES = [ROLES.ADMIN, ROLES.MANAGER];
const VIEW_STAFF       = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST];

// Employee management — Admin and Manager
router.post('/addEmployee',  verifyToken, restrictTo(MANAGE_EMPLOYEES), addEmployee);
router.post('/batch',        verifyToken, restrictTo(MANAGE_EMPLOYEES), batchAddEmployees);
router.get('/all',           verifyToken, restrictTo(VIEW_STAFF),       getAllEmployees);

// Lookup endpoints — Admin, Manager, Receptionist need these for forms
router.get('/departments',   verifyToken, restrictTo(VIEW_STAFF), getAllDepartments);
router.get('/roles',         verifyToken, restrictTo(VIEW_STAFF), getAllRoles);
router.get('/supervisors',   verifyToken, restrictTo(VIEW_STAFF), getAllSupervisors);

module.exports = router;

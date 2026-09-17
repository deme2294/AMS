const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/verifyToken');
const { restrictTo } = require('../middleware/roleMiddleware');

// All analytics routes require authentication (temporarily removing role restriction for debugging)
router.get('/stats', verifyToken, analyticsController.getDashboardStats);
router.get('/growth', verifyToken, analyticsController.getMonthlyGrowth);

module.exports = router;

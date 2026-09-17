const express = require('express');
const router = express.Router();
const serviceAnalyticsController = require('../controllers/serviceAnalyticsController');
const verifyToken = require('../middleware/verifyToken');
const { restrictTo } = require('../middleware/roleMiddleware');

// All service analytics routes require authentication
router.use(verifyToken);

// Core service/booking statistics
router.get('/service-stats', restrictTo('admin', 'manager', 'receptionist'), serviceAnalyticsController.getServiceStats);

// Daily bookings (last 30 days by default)
router.get('/daily-bookings', restrictTo('admin', 'manager', 'receptionist'), serviceAnalyticsController.getDailyBookings);

// Monthly bookings (last 12 months by default)
router.get('/monthly-bookings', restrictTo('admin', 'manager'), serviceAnalyticsController.getMonthlyBookings);

// Category breakdown
router.get('/category-breakdown', restrictTo('admin', 'manager'), serviceAnalyticsController.getCategoryBreakdown);

// Service breakdown (popular services)
router.get('/service-breakdown', restrictTo('admin', 'manager', 'receptionist'), serviceAnalyticsController.getServiceBreakdown);

// Barber performance
router.get('/barber-performance', restrictTo('admin', 'manager'), serviceAnalyticsController.getBarberPerformance);

// Status distribution
router.get('/status-distribution', restrictTo('admin', 'manager', 'receptionist'), serviceAnalyticsController.getStatusDistribution);

// Recent bookings
router.get('/recent-bookings', restrictTo('admin', 'manager', 'receptionist'), serviceAnalyticsController.getRecentBookings);

// Revenue statistics
router.get('/revenue', restrictTo('admin', 'manager'), serviceAnalyticsController.getRevenueStats);

module.exports = router;
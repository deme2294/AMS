// routes/queueRoutes.js
// Queue management routes for the barber shop appointment queue.
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const { ROLES } = require('../middleware/roles.js');
const queueController = require('../controllers/queueController.js');

// ─────────────────────────────────────────────────────────
// PUBLIC — Customers can track their queue slot by reference
// ─────────────────────────────────────────────────────────
router.get('/track/:reference_number', queueController.getQueueByReference);

// ─────────────────────────────────────────────────────────
// STAFF — All staff roles can view the queue
// ─────────────────────────────────────────────────────────
const VIEW_QUEUE_ROLES  = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST];
const MANAGE_QUEUE_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST];

router.get('/',     verifyToken, restrictTo(VIEW_QUEUE_ROLES),  queueController.getQueues);
router.get('/stats', verifyToken, restrictTo(VIEW_QUEUE_ROLES), queueController.getQueueStats);

// Approve booking & add to queue — Admin, Manager, Receptionist
router.post('/bookings/:booking_id/approve', verifyToken, restrictTo(MANAGE_QUEUE_ROLES), queueController.createQueueEntry);

// Update queue item status — Admin, Manager, Barber, Receptionist
router.put('/:id/status', verifyToken, restrictTo(VIEW_QUEUE_ROLES), queueController.updateQueueStatus);

// Call next in queue — Admin, Manager, Receptionist, Barber
router.post('/barber/:barber_id/next', verifyToken, restrictTo(VIEW_QUEUE_ROLES), queueController.callNext);
router.post('/next', verifyToken, restrictTo(VIEW_QUEUE_ROLES), queueController.callNext);

module.exports = router;

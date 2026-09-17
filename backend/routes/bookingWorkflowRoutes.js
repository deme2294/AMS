// routes/bookingWorkflowRoutes.js
// Routes for enhanced booking approval workflow

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const { restrictTo } = require("../middleware/roleMiddleware.js");
const { ROLES } = require("../middleware/roles.js");
const auditMiddleware = require("../middleware/auditMiddleware.js");
const bookingWorkflowController = require("../controllers/bookingWorkflowController.js");

// ─────────────────────────────────────────────────────────
// Role groupings for clarity
// ─────────────────────────────────────────────────────────
const WORKFLOW_MANAGERS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST];
const WORKFLOW_VIEWERS  = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.BARBER];

// ─────────────────────────────────────────────────────────
// REQUEST CHANGES - Admin/Manager/Receptionist can request changes
// ─────────────────────────────────────────────────────────
router.put(
  "/:id/request-changes",
  verifyToken,
  restrictTo(WORKFLOW_MANAGERS),
  auditMiddleware("UPDATE", "ServiceBooking"),
  bookingWorkflowController.requestChanges
);

// ─────────────────────────────────────────────────────────
// RESUBMIT AFTER CHANGES - Customer resubmits after making changes
// ─────────────────────────────────────────────────────────
router.put(
  "/:id/resubmit",
  verifyToken,
  auditMiddleware("UPDATE", "ServiceBooking"),
  bookingWorkflowController.resubmitAfterChanges
);

// ─────────────────────────────────────────────────────────
// WORKFLOW HISTORY - View workflow history for a booking
// ─────────────────────────────────────────────────────────
router.get(
  "/:id/history",
  verifyToken,
  bookingWorkflowController.getBookingWorkflowHistory
);

// By reference number (no ID lookup needed)
router.get(
  "/reference/:reference_number/history",
  verifyToken,
  bookingWorkflowController.getWorkflowHistoryByReference
);

// ─────────────────────────────────────────────────────────
// AVAILABLE ACTIONS - Get available workflow actions for current state
// ─────────────────────────────────────────────────────────
router.get(
  "/:id/actions",
  verifyToken,
  bookingWorkflowController.getAvailableWorkflowActions
);

// ─────────────────────────────────────────────────────────
// CHECK CHANGE REQUESTS - Check if booking has pending change requests
// ─────────────────────────────────────────────────────────
router.get(
  "/:id/change-requests",
  verifyToken,
  bookingWorkflowController.checkPendingChangeRequests
);

// ─────────────────────────────────────────────────────────
// WORKFLOW STATISTICS - Admin/Manager view workflow metrics
// ─────────────────────────────────────────────────────────
router.get(
  "/stats/workflow",
  verifyToken,
  restrictTo(WORKFLOW_VIEWERS),
  bookingWorkflowController.getWorkflowStatistics
);

module.exports = router;

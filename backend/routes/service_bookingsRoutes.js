// routes/service_bookingsRoutes.js
// Dedicated routes for service booking submission, review, and approval workflow.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const { restrictTo } = require("../middleware/roleMiddleware.js");
const { ROLES } = require("../middleware/roles.js");
const auditMiddleware = require("../middleware/auditMiddleware.js");
const serviceBookingsController = require("../controllers/service_bookingsController.js");

// ─────────────────────────────────────────────────────────
// Role groupings for clarity
// ─────────────────────────────────────────────────────────
const BOOKING_MANAGERS   = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST];
const BOOKING_VIEWERS    = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST];
const BOOKING_CANCELLERS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.CUSTOMER];

// ─────────────────────────────────────────────────────────
// CREATE — Any authenticated user can submit a booking
// ─────────────────────────────────────────────────────────
router.post("/", verifyToken, serviceBookingsController.createBooking);

// ─────────────────────────────────────────────────────────
// VIEW — All staff can see all bookings; customers use /my
// ─────────────────────────────────────────────────────────
router.get("/", verifyToken, restrictTo(BOOKING_VIEWERS), serviceBookingsController.getBookings);

// Customer's own bookings
router.get("/my", verifyToken, serviceBookingsController.getCustomerBookings);

// Public: track by reference number (no auth needed)
router.get("/:reference_number", serviceBookingsController.getBookingByReference);

// ─────────────────────────────────────────────────────────
// WORKFLOW — Approve, reject, confirm, cancel, delete
// ─────────────────────────────────────────────────────────
router.post(
    "/approve-by-ref",
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware("UPDATE", "ServiceBooking"),
    serviceBookingsController.approveBookingByReference
);

router.put(
    "/:id/approve",
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware("UPDATE", "ServiceBooking"),
    serviceBookingsController.approveBooking
);

router.put(
    "/:id/reject",
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware("UPDATE", "ServiceBooking"),
    serviceBookingsController.rejectBooking
);

router.put(
    "/:id/confirm",
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware("UPDATE", "ServiceBooking"),
    serviceBookingsController.confirmBooking
);

router.put(
    "/:id/cancel",
    verifyToken,
    restrictTo(BOOKING_CANCELLERS),
    auditMiddleware("UPDATE", "ServiceBooking"),
    serviceBookingsController.cancelBooking
);

router.delete(
    "/:id",
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    auditMiddleware("DELETE", "ServiceBooking"),
    serviceBookingsController.deleteBooking
);

module.exports = router;

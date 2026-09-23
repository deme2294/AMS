// routes/serviceRoutes.js
// Service Management Module routes
// RBAC: Uses named role constants from middleware/roles.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const { ROLES } = require('../middleware/roles.js');
const { hasMenuPermission } = require('../middleware/menuPermissionMiddleware.js');
const auditMiddleware = require('../middleware/auditMiddleware.js');
const serviceController = require('../controllers/serviceController.js');

// Validate handlers exist at startup
const requiredHandlers = [
    'getServiceCategories', 'getServiceCategoryById', 'createServiceCategory',
    'updateServiceCategory', 'deleteServiceCategory', 'getServices', 'createService',
    'getBarbers', 'getAvailableSlots', 'createBooking', 'getBookings',
    'getBookingByReference', 'getCustomerBookings', 'approveBooking',
    'approveBookingByReference', 'rejectBooking', 'confirmBooking', 'cancelBooking',
    'deleteBooking', 'getServicesPublic', 'getCategoriesForPublic',
    'getServiceByIdForPublic', 'getServiceRatingsSummary', 'getServiceRatings',
    'submitServiceRating', 'getMyServiceRating', 'getServiceById', 'updateService',
    'deleteService', 'toggleServiceAvailability', 'approveService',
];
for (const name of requiredHandlers) {
    if (!serviceController || typeof serviceController[name] !== 'function') {
        console.warn(`[serviceRoutes] Missing handler: serviceController.${name}`);
    }
}

const { uploadCategoryImage, uploadServiceImage } = require('../middleware/uploadMiddleware.js');

// ─────────────────────────────────────────────────────────
// Role groupings
// ─────────────────────────────────────────────────────────
const SERVICE_MANAGERS  = [ROLES.ADMIN, ROLES.MANAGER];
const SERVICE_VIEWERS   = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST];
const BOOKING_MANAGERS  = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST];
const BOOKING_VIEWERS   = [ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST];

// ================================================
// SERVICE CATEGORIES ROUTES
// ================================================

router.get('/categories', verifyToken, restrictTo(SERVICE_VIEWERS), serviceController.getServiceCategories);
router.get('/categories/:id', verifyToken, restrictTo(SERVICE_VIEWERS), serviceController.getServiceCategoryById);

router.post('/categories',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    uploadCategoryImage.single('image'),
    auditMiddleware('CREATE', 'ServiceCategory'),
    serviceController.createServiceCategory
);

router.put('/categories/:id',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    uploadCategoryImage.single('image'),
    auditMiddleware('UPDATE', 'ServiceCategory'),
    serviceController.updateServiceCategory
);

router.delete('/categories/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN]),
    auditMiddleware('DELETE', 'ServiceCategory'),
    serviceController.deleteServiceCategory
);

// ================================================
// SERVICES ROUTES (Authenticated Staff)
// ================================================

router.get('/',
    verifyToken,
    restrictTo(SERVICE_VIEWERS),
    hasMenuPermission('/services'),
    serviceController.getServices
);

router.post('/',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    hasMenuPermission('/services/add'),
    uploadServiceImage.single('service_image'),
    auditMiddleware('CREATE', 'Service'),
    serviceController.createService
);

// ================================================
// SERVICE PACKAGES ROUTES
// ================================================

// Public: no auth needed for browsing packages
router.get('/packages',         serviceController.getServicePackages);
router.get('/public/packages',  serviceController.getServicePackagesPublic);
router.get('/packages/:id',     serviceController.getServicePackageById);

router.post('/packages',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    uploadServiceImage.single('package_image'),
    auditMiddleware('CREATE', 'ServicePackage'),
    serviceController.createServicePackage
);

router.put('/packages/:id',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    uploadServiceImage.single('package_image'),
    auditMiddleware('UPDATE', 'ServicePackage'),
    serviceController.updateServicePackage
);

router.delete('/packages/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN]),
    auditMiddleware('DELETE', 'ServicePackage'),
    serviceController.deleteServicePackage
);

// ================================================
// BOOKING ROUTES (Mixed: public & protected)
// ================================================

// Public endpoints
router.get('/barbers', serviceController.getBarbers);
router.get('/available-slots', serviceController.getAvailableSlots);

// Create a booking — any authenticated user
router.post('/bookings', verifyToken, serviceController.createBooking);

// View all bookings — all staff
router.get('/bookings',
    verifyToken,
    restrictTo(BOOKING_VIEWERS),
    serviceController.getBookings
);

// Customer's own bookings
router.get('/bookings/my', verifyToken, serviceBookingByRef);

// Public tracking by reference (no auth)
router.get('/bookings/:reference_number', verifyToken, serviceController.getBookingByReference);

// Approve by reference — Admin, Manager, Receptionist
router.post('/bookings/approve-by-ref',
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware('UPDATE', 'ServiceBooking'),
    serviceController.approveBookingByReference
);

// Approve
router.put('/bookings/:id/approve',
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware('UPDATE', 'ServiceBooking'),
    serviceController.approveBooking
);

// Reject
router.put('/bookings/:id/reject',
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware('UPDATE', 'ServiceBooking'),
    serviceController.rejectBooking
);

// Confirm
router.put('/bookings/:id/confirm',
    verifyToken,
    restrictTo(BOOKING_MANAGERS),
    auditMiddleware('UPDATE', 'ServiceBooking'),
    serviceController.confirmBooking
);

// Cancel — staff or the booking owner (customer)
router.put('/bookings/:id/cancel',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.CUSTOMER]),
    auditMiddleware('UPDATE', 'ServiceBooking'),
    serviceController.cancelBooking
);

// Delete — Admin and Manager only
router.delete('/bookings/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN, ROLES.MANAGER]),
    auditMiddleware('DELETE', 'ServiceBooking'),
    serviceController.deleteBooking
);

// ================================================
// PUBLIC/CUSTOMER ROUTES (No auth required)
// ================================================

router.get('/public',                       serviceController.getServicesPublic);
router.get('/public/categories',            serviceController.getCategoriesForPublic);
router.get('/public/:id',                   serviceController.getServiceByIdForPublic);
router.get('/public/:id/ratings/summary',   serviceController.getServiceRatingsSummary);
router.get('/public/:id/ratings',           serviceController.getServiceRatings);
router.post('/public/:id/rate', verifyToken, serviceController.submitServiceRating);
router.get('/public/:id/rate',  verifyToken, serviceController.getMyServiceRating);

// Admin ratings monitoring across all salon services
router.get('/admin/ratings',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    serviceController.getAllAdminRatings
);

// Authenticated / general service ratings routes
router.get('/:id/ratings/summary',          serviceController.getServiceRatingsSummary);
router.get('/:id/ratings',                  serviceController.getServiceRatings);
router.post('/:id/rate',       verifyToken, serviceController.submitServiceRating);
router.get('/:id/rate',        verifyToken, serviceController.getMyServiceRating);

// ================================================
// SERVICES PARAM ROUTES (after fixed routes)
// ================================================

router.get('/:id', verifyToken, serviceController.getServiceById);

router.put('/:id',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    hasMenuPermission('/services'),
    uploadServiceImage.single('service_image'),
    auditMiddleware('UPDATE', 'Service'),
    serviceController.updateService
);

router.delete('/:id',
    verifyToken,
    restrictTo([ROLES.ADMIN]),
    hasMenuPermission('/services'),
    auditMiddleware('DELETE', 'Service'),
    serviceController.deleteService
);

router.put('/:id/toggle-availability',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    hasMenuPermission('/services'),
    auditMiddleware('UPDATE', 'Service'),
    serviceController.toggleServiceAvailability
);

router.put('/:id/approve',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    hasMenuPermission('/services'),
    auditMiddleware('UPDATE', 'Service'),
    serviceController.approveService
);

router.patch('/:id/approve',
    verifyToken,
    restrictTo(SERVICE_MANAGERS),
    hasMenuPermission('/services'),
    auditMiddleware('UPDATE', 'Service'),
    serviceController.approveService
);

// Helper to avoid undefined handler reference above
function serviceBookingByRef(req, res, next) {
    return serviceController.getCustomerBookings(req, res, next);
}

module.exports = router;

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const availabilityController = require('../controllers/availabilityController.js');

// Public endpoint - get available slots for booking
router.get('/public-slots', availabilityController.getAvailableSlotsForBooking);

// Admin/Barber CRUD
router.post('/',
    verifyToken,
    restrictTo([1, 2]),
    availabilityController.createAvailabilitySlot
);

router.get('/',
    verifyToken,
    restrictTo([1, 2, 3]),
    availabilityController.listAvailabilitySlots
);

router.put('/:id',
    verifyToken,
    restrictTo([1, 2]),
    availabilityController.updateAvailabilitySlot
);

router.delete('/:id',
    verifyToken,
    restrictTo([1, 2]),
    availabilityController.deleteAvailabilitySlot
);

module.exports = router;


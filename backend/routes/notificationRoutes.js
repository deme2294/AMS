// routes/notificationRoutes.js
// Handles notification routes for the barber shop system
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken.js');
const { restrictTo } = require('../middleware/roleMiddleware.js');
const { sendBookingReceivedEmail, sendBookingApprovedEmail, 
        sendBookingRejectedEmail, sendQueueStatusUpdateEmail,
        sendAppointmentReminderEmail } = require('../services/amsMailerService.js');

// Send notification (Admin/Barber)
router.post('/send',
    verifyToken,
    restrictTo([1, 2]),
    async (req, res) => {
        try {
            const { type, to, data } = req.body;
            
            if (!type || !to) {
                return res.status(400).json({
                    success: false,
                    message: "type and to are required"
                });
            }
            
            let result;
            switch (type) {
                case 'booking_received':
                    result = await sendBookingReceivedEmail(
                        to, data.customerName, data.serviceName, data.barberName,
                        data.bookingDate, data.timeSlot, data.referenceNumber
                    );
                    break;
                case 'booking_approved':
                    result = await sendBookingApprovedEmail(
                        to, data.customerName, data.serviceName, data.barberName,
                        data.bookingDate, data.timeSlot, data.referenceNumber,
                        data.queuePosition, data.estimatedWaitTime
                    );
                    break;
                case 'booking_rejected':
                    result = await sendBookingRejectedEmail(
                        to, data.customerName, data.serviceName, data.bookingDate,
                        data.timeSlot, data.rejectionReason
                    );
                    break;
                case 'queue_status':
                    result = await sendQueueStatusUpdateEmail(
                        to, data.customerName, data.serviceName, data.referenceNumber,
                        data.queueStatus, data.queuePosition, data.estimatedWaitTime
                    );
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid notification type"
                    });
            }
            
            return res.json({
                success: true,
                message: "Notification sent successfully"
            });
        } catch (error) {
            console.error("Error sending notification:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to send notification",
                error: error.message
            });
        }
    }
);

module.exports = router;
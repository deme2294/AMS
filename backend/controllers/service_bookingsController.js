// controllers/service_bookingsController.js
// Dedicated service booking workflow: submit, review, approve/reject, and queue handoff.

const con = require("../models/db");
const { generateReferenceNumber } = require("./queueController");

const bookingSelect = `
    SELECT
        sb.*,
        sb.appointment_date AS booking_date,
        sb.appointment_time AS time_slot,
        sb.booking_status AS status,
        sb.booking_note AS notes,
        s.service_name,
        s.price,
        s.discount_price,
        s.duration_minutes,
        sc.category_name,
        e.name AS barber_name,
        q.id AS queue_id,
        q.queue_position,
        q.estimated_wait_time,
        q.queue_status AS live_queue_status
    FROM service_bookings sb
    LEFT JOIN services s ON sb.service_id = s.id
    LEFT JOIN service_categories sc ON s.category_id = sc.id
    LEFT JOIN employees e ON sb.barber_id = e.employee_id
    LEFT JOIN queues q ON q.booking_id = sb.id
`;

const getBookingById = async (id) => {
    const [rows] = await con.promise().query(
        `${bookingSelect} WHERE sb.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
};

const safeSyncBookingReview = async (booking, updates = {}) => {
    try {
        const [existing] = await con.promise().query(
            "SELECT id FROM booking_reviews WHERE booking_id = ? LIMIT 1",
            [booking.id]
        );

        if (existing.length > 0) {
            await con.promise().query(
                `UPDATE booking_reviews
                 SET review_status = COALESCE(?, review_status),
                     reviewed_by = COALESCE(?, reviewed_by),
                     moved_to_queue = COALESCE(?, moved_to_queue),
                     queue_position = COALESCE(?, queue_position),
                     confirmed_date = COALESCE(?, confirmed_date),
                     confirmed_time = COALESCE(?, confirmed_time),
                     reviewed_at = COALESCE(?, reviewed_at),
                     rejection_reason = COALESCE(?, rejection_reason),
                     updated_at = NOW()
                 WHERE booking_id = ?`,
                [
                    updates.review_status || null,
                    updates.reviewed_by || null,
                    updates.moved_to_queue ?? null,
                    updates.queue_position || null,
                    updates.confirmed_date || null,
                    updates.confirmed_time || null,
                    updates.reviewed_at || null,
                    updates.rejection_reason || null,
                    booking.id
                ]
            );
            return;
        }

        await con.promise().query(
            `INSERT INTO booking_reviews
             (booking_id, customer_id, service_id, barber_id, reviewed_by, review_status,
              moved_to_queue, queue_position, confirmed_date, confirmed_time, reviewed_at,
              rejection_reason, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                booking.id,
                booking.customer_id || null,
                booking.service_id,
                booking.barber_id || null,
                updates.reviewed_by || null,
                updates.review_status || "pending",
                updates.moved_to_queue || 0,
                updates.queue_position || null,
                updates.confirmed_date || null,
                updates.confirmed_time || null,
                updates.reviewed_at || null,
                updates.rejection_reason || null
            ]
        );
    } catch (error) {
        console.warn("[service_bookings] booking_reviews sync skipped:", error.message);
    }
};

const resolveAvailabilitySlot = async ({ service_id, barber_id, booking_date, time_slot, availability_slot_id }) => {
    const params = [];
    let query = `
        SELECT id, barber_id, max_bookings, start_time, end_time
        FROM availability_slots
        WHERE service_id = ?
          AND available_date = ?
          AND slot_status IN ('available', 'open')
    `;
    params.push(service_id, booking_date);

    if (availability_slot_id) {
        query += " AND id = ?";
        params.push(availability_slot_id);
    } else {
        query += " AND start_time = ?";
        params.push(time_slot);
    }

    if (barber_id) {
        query += " AND (barber_id = ? OR barber_id IS NULL)";
        params.push(barber_id);
    }

    query += " ORDER BY CASE WHEN barber_id = ? THEN 0 ELSE 1 END, id DESC LIMIT 1";
    params.push(barber_id || null);

    const [slots] = await con.promise().query(query, params);
    return slots[0] || null;
};

const createQueueForBooking = async (booking, reviewedBy) => {
    const [existingQueue] = await con.promise().query(
        "SELECT * FROM queues WHERE booking_id = ? LIMIT 1",
        [booking.id]
    );

    if (existingQueue.length > 0) {
        await con.promise().query(
            `UPDATE service_bookings
             SET approval_status = 'approved',
                 booking_status = 'approved',
                 queue_status = 'queued',
                 reference_number = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [existingQueue[0].reference_number, booking.id]
        );
        return existingQueue[0];
    }

    const referenceNumber = booking.reference_number || await generateReferenceNumber();
    const [positionRows] = await con.promise().query(
        "SELECT IFNULL(MAX(queue_position), 0) AS max_position FROM queues"
    );
    const queuePosition = Number(positionRows[0].max_position || 0) + 1;
    const estimatedWaitTime = queuePosition * Number(booking.duration_minutes || 30);

    const [queueResult] = await con.promise().query(
        `INSERT INTO queues
         (booking_id, reference_number, queue_position, estimated_wait_time, queue_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'queued', NOW(), NOW())`,
        [booking.id, referenceNumber, queuePosition, estimatedWaitTime]
    );

    await con.promise().query(
        `UPDATE service_bookings
         SET reference_number = ?,
             approval_status = 'approved',
             booking_status = 'approved',
             queue_status = 'queued',
             updated_at = NOW()
         WHERE id = ?`,
        [referenceNumber, booking.id]
    );

    const [newQueue] = await con.promise().query(
        "SELECT * FROM queues WHERE id = ?",
        [queueResult.insertId]
    );
    return newQueue[0];
};

const createBooking = async (req, res) => {
    try {
        let {
            service_id,
            barber_id,
            booking_date,
            time_slot,
            availability_slot_id,
            customer_name,
            customer_phone,
            customer_email,
            notes
        } = req.body;

        if (!service_id || !booking_date || !time_slot || !customer_name || !customer_phone) {
            return res.status(400).json({
                success: false,
                message: "service_id, booking_date, time_slot, customer_name, and customer_phone are required"
            });
        }

        service_id = Number(service_id);
        barber_id = barber_id ? Number(barber_id) : null;
        availability_slot_id = availability_slot_id ? Number(availability_slot_id) : null;

        const [services] = await con.promise().query(
            "SELECT id FROM services WHERE id = ? AND is_available = 1 AND status = 'active'",
            [service_id]
        );
        if (services.length === 0) {
            return res.status(404).json({ success: false, message: "Service not found or unavailable" });
        }

        if (barber_id) {
            const [barbers] = await con.promise().query(
                "SELECT employee_id FROM employees WHERE employee_id = ?",
                [barber_id]
            );
            if (barbers.length === 0) {
                return res.status(404).json({ success: false, message: "Barber not found" });
            }
        }

        const customerId = req.user?.user_id || null;
        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to create a booking"
            });
        }

        let resolvedCustomerEmail = customer_email;
        if (!resolvedCustomerEmail) {
            const [users] = await con.promise().query(
                "SELECT email FROM users WHERE user_id = ? LIMIT 1",
                [customerId]
            );
            resolvedCustomerEmail = users[0]?.email || `customer-${customerId}@example.com`;
        }

        const slot = await resolveAvailabilitySlot({
            service_id,
            barber_id,
            booking_date,
            time_slot,
            availability_slot_id
        });

        if (!slot) {
            return res.status(409).json({
                success: false,
                message: "Selected time is no longer available. Please select another time."
            });
        }

        const [usage] = await con.promise().query(
            `SELECT COUNT(*) AS count
             FROM service_bookings
             WHERE availability_slot_id = ?
               AND booking_status NOT IN ('cancelled', 'rejected')`,
            [slot.id]
        );

        if (Number(usage[0].count) >= Number(slot.max_bookings || 1)) {
            return res.status(409).json({
                success: false,
                message: "This slot reached its maximum capacity. Please select another time."
            });
        }

        const referenceNumber = await generateReferenceNumber();

        const [result] = await con.promise().query(
            `INSERT INTO service_bookings
             (reference_number, customer_id, service_id, barber_id, availability_slot_id,
              customer_name, customer_email, customer_phone, appointment_date, appointment_time,
              booking_note, booking_status, approval_status, queue_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'waiting', 'not_started', NOW(), NOW())`,
            [
                referenceNumber,
                customerId,
                service_id,
                barber_id || slot.barber_id || null,
                slot.id,
                customer_name.trim(),
                resolvedCustomerEmail,
                customer_phone.trim(),
                booking_date,
                time_slot,
                notes || null
            ]
        );

        const booking = await getBookingById(result.insertId);
        await safeSyncBookingReview(booking, { review_status: "pending" });

        return res.status(201).json({
            success: true,
            message: "Booking created successfully and sent for review",
            data: booking
        });
    } catch (error) {
        console.error("Error creating service booking:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message
        });
    }
};

const getBookings = async (req, res) => {
    try {
        const { date, barber_id, status, approval_status } = req.query;
        const params = [];
        let query = `${bookingSelect} WHERE 1=1`;

        if (date) {
            query += " AND sb.appointment_date = ?";
            params.push(date);
        }
        if (barber_id) {
            query += " AND sb.barber_id = ?";
            params.push(barber_id);
        }
        if (status) {
            query += " AND sb.booking_status = ?";
            params.push(status);
        }
        if (approval_status) {
            query += " AND sb.approval_status = ?";
            params.push(approval_status);
        }

        query += " ORDER BY sb.appointment_date DESC, sb.appointment_time ASC";
        const [bookings] = await con.promise().query(query, params);
        return res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Error fetching service bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
};

const getCustomerBookings = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const [bookings] = await con.promise().query(
            `${bookingSelect} WHERE sb.customer_id = ? ORDER BY sb.appointment_date DESC, sb.appointment_time ASC`,
            [userId]
        );
        return res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("Error fetching customer service bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your bookings",
            error: error.message
        });
    }
};

const getBookingByReference = async (req, res) => {
    try {
        const { reference_number } = req.params;
        const [rows] = await con.promise().query(
            `${bookingSelect} WHERE sb.reference_number = ? LIMIT 1`,
            [reference_number]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching booking by reference:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking",
            error: error.message
        });
    }
};

const approveBooking = async (req, res) => {
    try {
        const booking = await getBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (booking.approval_status === "rejected") {
            return res.status(400).json({ success: false, message: "Rejected bookings cannot be approved" });
        }

        const queue = await createQueueForBooking(booking, req.user?.user_id);
        await safeSyncBookingReview(booking, {
            review_status: "approved",
            reviewed_by: req.user?.user_id,
            moved_to_queue: 1,
            queue_position: queue.queue_position,
            confirmed_date: booking.appointment_date,
            confirmed_time: booking.appointment_time,
            reviewed_at: new Date()
        });

        const updatedBooking = await getBookingById(booking.id);
        return res.status(200).json({
            success: true,
            message: "Booking approved and added to queue",
            data: updatedBooking
        });
    } catch (error) {
        console.error("Error approving service booking:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to approve booking",
            error: error.message
        });
    }
};

const approveBookingByReference = async (req, res) => {
    try {
        const { reference_number } = req.body;
        if (!reference_number) {
            return res.status(400).json({ success: false, message: "reference_number is required" });
        }

        const [rows] = await con.promise().query(
            `${bookingSelect} WHERE sb.reference_number = ? LIMIT 1`,
            [reference_number]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        req.params.id = rows[0].id;
        return approveBooking(req, res);
    } catch (error) {
        console.error("Error approving booking by reference:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to approve booking by reference",
            error: error.message
        });
    }
};

const rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const booking = await getBookingById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (booking.approval_status === "approved") {
            return res.status(400).json({ success: false, message: "Approved bookings cannot be rejected" });
        }

        await con.promise().query(
            `UPDATE service_bookings
             SET approval_status = 'rejected',
                 booking_status = 'rejected',
                 rejection_reason = ?,
                 updated_by = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [rejection_reason || "No reason provided", req.user?.user_id || null, id]
        );

        await safeSyncBookingReview(booking, {
            review_status: "rejected",
            reviewed_by: req.user?.user_id,
            rejection_reason: rejection_reason || "No reason provided",
            reviewed_at: new Date()
        });

        const updatedBooking = await getBookingById(id);
        return res.status(200).json({
            success: true,
            message: "Booking rejected",
            data: updatedBooking
        });
    } catch (error) {
        console.error("Error rejecting service booking:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject booking",
            error: error.message
        });
    }
};

const confirmBooking = async (req, res) => {
    try {
        const [result] = await con.promise().query(
            "UPDATE service_bookings SET booking_status = 'approved', updated_at = NOW() WHERE id = ?",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        return res.status(200).json({ success: true, message: "Booking confirmed", data: await getBookingById(req.params.id) });
    } catch (error) {
        console.error("Error confirming service booking:", error);
        return res.status(500).json({ success: false, message: "Failed to confirm booking", error: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const [result] = await con.promise().query(
            "UPDATE service_bookings SET booking_status = 'cancelled', updated_at = NOW() WHERE id = ?",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        return res.status(200).json({ success: true, message: "Booking cancelled", data: await getBookingById(req.params.id) });
    } catch (error) {
        console.error("Error cancelling service booking:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel booking", error: error.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const booking = await getBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        await con.promise().query("DELETE FROM queues WHERE booking_id = ?", [req.params.id]);
        await con.promise().query("DELETE FROM booking_reviews WHERE booking_id = ?", [req.params.id]);
        await con.promise().query("DELETE FROM service_bookings WHERE id = ?", [req.params.id]);

        return res.status(200).json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
        console.error("Error deleting service booking:", error);
        return res.status(500).json({ success: false, message: "Failed to delete booking", error: error.message });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getCustomerBookings,
    getBookingByReference,
    approveBooking,
    approveBookingByReference,
    rejectBooking,
    confirmBooking,
    cancelBooking,
    deleteBooking
};

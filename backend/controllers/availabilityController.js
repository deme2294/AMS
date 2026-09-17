// controllers/availabilityController.js
// Handles all operations for Admin/Barber Availability Slot Management

const con = require("../models/db");

// ================================================
// VALIDATION RULES
// ================================================

const SLOT_STATUSES = ['available', 'booked', 'closed', 'paused'];

const BOOKING_STATUSES = ['pending', 'approved', 'queued', 'serving', 'completed', 'rejected', 'cancelled'];
const QUEUE_STATUSES = ['not_started', 'queued', 'serving', 'completed'];

const validateSlotStatus = (status) => {
    return status && SLOT_STATUSES.includes(status) ? status : 'available';
};

// Check for time range overlap
const checkOverlap = async (serviceId, date, startTime, endTime, barberId, excludeId = null) => {
    // `available_date` is the actual column name in availability_slots
    let query = `
        SELECT id FROM availability_slots
        WHERE service_id = ?
          AND available_date = ?
          AND slot_status IN ('available', 'booked')

          AND (start_time < ? AND end_time > ?)
    `;
    const params = [serviceId, date, endTime, startTime];

    
    if (barberId !== null && barberId !== undefined && barberId !== '') {
        query += ` AND (barber_id = ?)`;
        params.push(barberId);
    } else {
        // treat undefined/null/empty as "global slot" => barber_id IS NULL
        query += ` AND barber_id IS NULL`;
    }
    
    if (excludeId) {
        query += ` AND id <> ?`;
        params.push(excludeId);
    }
    
    const [rows] = await con.promise().query(query, params);
    return rows.length > 0;
};

// ================================================
// AVAILABILITY SLOT CONTROLLERS
// ================================================

// Create availability slot (Admin/Barber)
const createAvailabilitySlot = async (req, res) => {
    try {
        const {
            service_id,
            barber_id,
            available_date,
            start_time,
            end_time,
            max_bookings,
            slot_status,
            notes
        } = req.body;

        // Normalize payload fields (support a couple of common client shapes)
        // Frontend uses: service_id, barber_id, availability_date?, start_time, end_time
        const normalized = {
            service_id,
            barber_id,
            available_date: req.body.available_date || req.body.availability_date || available_date,
            start_time: req.body.start_time || start_time,
            end_time: req.body.end_time || end_time,
            max_bookings,
            slot_status,
            notes
        };

        if (
            !normalized.service_id ||
            !normalized.available_date ||
            normalized.start_time === undefined ||
            normalized.end_time === undefined ||
            normalized.start_time === '' ||
            normalized.end_time === ''
        ) {
            // DEBUG to diagnose createAvailabilitySlot 500s
            // (safe to remove later)
            console.log('[createAvailabilitySlot DEBUG]', {
                body: req.body,
                normalized
            });
            return res.status(400).json({ 
                success: false, 
                message: 'service_id, available_date, start_time, end_time are required' 
            });
        }

        // Validate service exists
        const [services] = await con.promise().query(
            'SELECT id FROM services WHERE id = ? AND status = "active"',
            [service_id]
        );
        if (services.length === 0) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // Validate barber if provided
        if (barber_id) {
            const [barbers] = await con.promise().query(
                'SELECT employee_id FROM employees WHERE employee_id = ?',
                [barber_id]
            );
            if (barbers.length === 0) {
                return res.status(404).json({ success: false, message: 'Barber not found' });
            }
        }

        // Validate time range
        if (start_time >= end_time) {
            return res.status(400).json({ 
                success: false, 
                message: 'End time must be after start time' 
            });
        }

        const normalizedBarberId = barber_id ? Number(barber_id) : null;
        const normalizedMaxBookings = Number(max_bookings != null ? max_bookings : 1);
        const normalizedSlotStatus = validateSlotStatus(slot_status);

        if (!Number.isFinite(normalizedMaxBookings) || normalizedMaxBookings < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'max_bookings must be a valid number >= 1' 
            });
        }

        // Prevent overlapping slots
        const hasOverlap = await checkOverlap(service_id, normalized.available_date, start_time, end_time, normalizedBarberId);

        if (hasOverlap) {
            return res.status(409).json({ 
                success: false, 
                message: 'Time slot overlaps with an existing availability slot' 
            });
        }

        const created_by = req.user?.user_id || null;

        console.log('[createAvailabilitySlot] Inserting slot with data:', {
            service_id,
            barber_id: normalizedBarberId,
            available_date: normalized.available_date,
            start_time: normalized.start_time,
            end_time: normalized.end_time,
            max_bookings: normalizedMaxBookings,
            slot_status: normalizedSlotStatus,
            notes: notes || null,
            created_by
        });

        const [result] = await con.promise().query(
            `INSERT INTO availability_slots
                 (service_id, barber_id, available_date, start_time, end_time,
                  max_bookings, slot_status, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
            [
                service_id,
                normalizedBarberId,
                normalized.available_date,
                normalized.start_time,
                normalized.end_time,
                normalizedMaxBookings,
                normalizedSlotStatus,
                notes || null,
                created_by
            ]
        );



        const [rows] = await con.promise().query(
            'SELECT * FROM availability_slots WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({ 
            success: true, 
            data: rows[0],
            message: 'Availability slot created successfully'
        });
    } catch (err) {
        console.error('createAvailabilitySlot error:', {
            message: err?.message,
            code: err?.code,
            errno: err?.errno,
            sqlState: err?.sqlState,
            sqlMessage: err?.sqlMessage,
            sql: err?.sql,
            ...err
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to create availability slot',
            error: err?.message || 'Unknown error'
        });
    }
};


// List availability slots
const listAvailabilitySlots = async (req, res) => {
    try {
        const { service_id, barber_id, date, slot_status } = req.query;

        let query = `
            SELECT a.*, s.service_name, e.name as barber_name, e.fname, e.lname
            FROM availability_slots a
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN employees e ON a.barber_id = e.employee_id
            WHERE 1=1
        `;
        const params = [];

        if (service_id) {
            query += ` AND a.service_id = ?`;
            params.push(service_id);
        }

        if (barber_id) {
            query += ` AND (a.barber_id = ? OR a.barber_id IS NULL)`;
            params.push(barber_id);
        }

        if (date) {
            // available_date is stored as DATE in DB. Normalize incoming YYYY-MM-DD
            query += ` AND DATE(a.available_date) = DATE(?)`;
            params.push(date);
        }


        if (slot_status && SLOT_STATUSES.includes(slot_status)) {
            query += ` AND a.slot_status = ?`;
            params.push(slot_status);
        }

        query += ` ORDER BY a.available_date ASC, a.start_time ASC`;


        const [rows] = await con.promise().query(query, params);

        const formattedRows = rows.map(r => ({
            ...r,
            barber_name: r.barber_id 
                ? (r.barber_name || r.fname || `Barber #${r.barber_id}`)
                : 'Global (Any Barber)',
            service_name: r.service_name || `Service #${r.service_id}`
        }));

        return res.status(200).json({ success: true, data: formattedRows });
    } catch (err) {
        console.error('listAvailabilitySlots error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to list availability slots', 
            error: err.message 
        });
    }
};

// Update availability slot (Admin/Barber)
const updateAvailabilitySlot = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            service_id,
            barber_id,
            available_date,
            start_time,
            end_time,
            max_bookings,
            slot_status,
            notes
        } = req.body;

        const [existing] = await con.promise().query(
            'SELECT * FROM availability_slots WHERE id = ?', 
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Availability slot not found' 
            });
        }

        const current = existing[0];
        const nextServiceId = service_id !== undefined ? service_id : current.service_id;
        const nextBarberId = barber_id !== undefined ? (barber_id ? Number(barber_id) : null) : current.barber_id;
        const nextDate = available_date !== undefined ? available_date : current.available_date;
        const nextStart = start_time !== undefined ? start_time : current.start_time;
        const nextEnd = end_time !== undefined ? end_time : current.end_time;

        // Validate time range if changed
        if (nextStart >= nextEnd) {
            return res.status(400).json({ 
                success: false, 
                message: 'End time must be after start time' 
            });
        }

        // Check for overlap if time/date changed
        const hasOverlap = await checkOverlap(nextServiceId, nextDate, nextStart, nextEnd, nextBarberId, id);
        if (hasOverlap) {
            return res.status(409).json({ 
                success: false, 
                message: 'Time slot overlaps with an existing availability slot' 
            });
        }

        const finalMaxBookings = (max_bookings !== undefined && max_bookings !== null)
            ? Number(max_bookings)
            : Number(current.max_bookings || 1);
        const finalSlotStatus = validateSlotStatus(slot_status !== undefined ? slot_status : current.slot_status);

        await con.promise().query(
            `UPDATE availability_slots 
             SET service_id = ?, barber_id = ?, available_date = ?, 
                 start_time = ?, end_time = ?, max_bookings = ?, 
                 slot_status = ?, notes = ?, updated_at = NOW()
             WHERE id = ?`,
            [nextServiceId, nextBarberId, nextDate, nextStart, nextEnd, 
             finalMaxBookings, finalSlotStatus, notes !== undefined ? notes : current.notes, id]
        );

        const [updated] = await con.promise().query(
            `SELECT a.*, s.service_name, e.name as barber_name
             FROM availability_slots a
             LEFT JOIN services s ON a.service_id = s.id
             LEFT JOIN employees e ON a.barber_id = e.employee_id
             WHERE a.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: updated[0],
            message: 'Availability slot updated successfully'
        });
    } catch (err) {
        console.error('updateAvailabilitySlot error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to update availability slot', 
            error: err.message 
        });
    }
};

// Delete availability slot (Admin/Barber)
const deleteAvailabilitySlot = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await con.promise().query(
            'SELECT * FROM availability_slots WHERE id = ?', 
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Availability slot not found' 
            });
        }

        // Check for existing bookings
        const [bookings] = await con.promise().query(
            'SELECT COUNT(*) as count FROM service_bookings WHERE availability_slot_id = ? AND status NOT IN ("cancelled","completed")',
            [id]
        );

        if (bookings[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete slot with ${bookings[0].count} active booking(s)` 
            });
        }

        await con.promise().query('DELETE FROM availability_slots WHERE id = ?', [id]);
        return res.status(200).json({ 
            success: true, 
            message: 'Availability slot deleted successfully' 
        });
    } catch (err) {
        console.error('deleteAvailabilitySlot error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to delete availability slot', 
            error: err.message 
        });
    }
};

// Get barbers for availability management
const getBarbersForAvailability = async (req, res) => {
    try {
        const [barbers] = await con.promise().query(
            `SELECT e.employee_id as id, e.name as full_name, e.email, e.phone
             FROM employees e
             LEFT JOIN users u ON e.employee_id = u.employee_id
             WHERE u.role_id = 2
             ORDER BY e.name ASC`
        );
        return res.status(200).json({ success: true, data: barbers });
    } catch (err) {
        console.error('getBarbersForAvailability error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch barbers', 
            error: err.message 
        });
    }
};

// ================================================
// PUBLIC ENDPOINTS (for customer booking flow)
// =============================================

// Get available slots for a service on a given date (public)
const getAvailableSlotsForBooking = async (req, res) => {
    try {
        const { service_id, barber_id, date } = req.query;

        if (!service_id || !date) {
            return res.status(400).json({
                success: false,
                message: "service_id and date are required"
            });
            
        }

        // Service details
        const [services] = await con.promise().query(
            "SELECT duration_minutes FROM services WHERE id = ? AND is_available = 1 AND status = 'active'",
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Service not found or unavailable" 
            });
        }

        // Load available slots for that service/date
        let slotsQuery = `
            SELECT 
                id as availability_slot_id,
                start_time,
                end_time,
                max_bookings,
                current_bookings,
                slot_status
            FROM availability_slots
            WHERE service_id = ?
              AND available_date = ?
              AND slot_status = 'available'
        `;
        
        const params = [service_id, date];

        if (barber_id) {
            slotsQuery += " AND (barber_id = ? OR barber_id IS NULL)";
            params.push(barber_id);
        } else {
            slotsQuery += " AND barber_id IS NULL";
        }

        slotsQuery += " ORDER BY start_time ASC";

        const [availabilityRows] = await con.promise().query(slotsQuery, params);

        // Return slots with capacity info
        const available_slots = availabilityRows.map(r => ({
            availability_slot_id: r.availability_slot_id,
            start_time: r.start_time,
            end_time: r.end_time,
            remaining_capacity: Math.max(0, r.max_bookings - (r.current_bookings || 0)),
            is_fully_booked: (r.current_bookings || 0) >= r.max_bookings
        }));

        return res.status(200).json({
            success: true,
            data: {
                service: { duration_minutes: services[0].duration_minutes },
                available_slots,
                date
            }
        });
    } catch (error) {
        console.error("Error fetching available slots:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch available slots",
            error: error.message
        });
    }
};

module.exports = {
    createAvailabilitySlot,
    listAvailabilitySlots,
    updateAvailabilitySlot,
    deleteAvailabilitySlot,
    getBarbersForAvailability,
    getAvailableSlotsForBooking,
    SLOT_STATUSES,
    validateSlotStatus,
    checkOverlap
};
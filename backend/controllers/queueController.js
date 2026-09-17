// controllers/queueController.js
// Handles all operations for Queue Management

const con = require("../models/db");
const amsMailer = require("../services/amsMailerService");

// Generate reference number in format: BRB-YYYY-NNNN
const generateReferenceNumber = async () => {
  try {
    const year = new Date().getFullYear();
    // Get the last reference number for this year from service_bookings
    const [result] = await con.promise().query(
      `SELECT reference_number FROM service_bookings 
       WHERE reference_number LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [`BRB-${year}-%`]
    );
    
    let sequence = 1;
    if (result.length > 0 && result[0].reference_number) {
      const lastRef = result[0].reference_number;
      const lastSeq = parseInt(lastRef.split('-')[2]) || 0;
      sequence = lastSeq + 1;
    }
    
    // Format sequence as 4-digit number (0001, 0002, etc.)
    const seqStr = sequence.toString().padStart(4, '0');
    return `BRB-${year}-${seqStr}`;
  } catch (error) {
    console.error("Error generating reference number:", error);
    // Fallback to timestamp-based reference
    return `BRB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  }
};

// Get all queues (for admin/barber)
const getQueues = async (req, res) => {
  try {
    const { queue_status, barber_id, date } = req.query;
    
    let query = `
       SELECT q.*, sb.customer_name, sb.customer_phone as phone_number, s.service_name, 
              sb.appointment_date as appointment_date, sb.appointment_time as appointment_time, e.name as barber_name
        FROM queues q
        JOIN service_bookings sb ON q.booking_id = sb.id
        JOIN services s ON sb.service_id = s.id
        LEFT JOIN employees e ON sb.barber_id = e.employee_id
        WHERE 1=1
      `;
    const params = [];
    
    if (queue_status) {
      query += " AND q.queue_status = ?";
      params.push(queue_status);
    }
    
    if (barber_id) {
      query += " AND sb.barber_id = ?";
      params.push(barber_id);
    }
    
    if (date) {
      query += " AND sb.appointment_date = ?";
      params.push(date);
    }
    
    query += " ORDER BY q.queue_position ASC";
    
    const [queues] = await con.promise().query(query, params);
    
    return res.status(200).json({
      success: true,
      data: queues
    });
  } catch (error) {
    console.error("Error fetching queues:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queues",
      error: error.message
    });
  }
};

// Get queue by reference number (for customer tracking)
const getQueueByReference = async (req, res) => {
  try {
    const { reference_number } = req.params;
    
    const [queues] = await con.promise().query(
      `SELECT q.id, q.booking_id, sb.reference_number, 
              IFNULL(q.queue_position, 0) as queue_position, 
              IFNULL(q.estimated_wait_time, 0) as estimated_wait_time, 
              IFNULL(q.queue_status, 'not_started') as queue_status,
              sb.customer_name, sb.customer_phone as phone_number, s.service_name, 
              sb.appointment_date as appointment_date, sb.appointment_time as appointment_time, e.name as barber_name,
              sb.approval_status, sb.queue_status as booking_queue_status, s.price
       FROM service_bookings sb
       LEFT JOIN queues q ON q.booking_id = sb.id
       JOIN services s ON sb.service_id = s.id
       LEFT JOIN employees e ON sb.barber_id = e.employee_id
       WHERE sb.reference_number = ?`,
      [reference_number]
    );
    
    if (queues.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking / Queue entry not found for this reference number"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: queues[0]
    });
  } catch (error) {
    console.error("Error fetching queue by reference:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue information",
      error: error.message
    });
  }
};

// Create queue entry (called when booking is approved)
const createQueueEntry = async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    // First, get the booking details
    const [bookings] = await con.promise().query(
      `SELECT sb.*, s.service_name, s.price, sc.category_name, 
              sb.customer_name, sb.customer_phone as phone_number,
              e.name as barber_name
       FROM service_bookings sb
       JOIN services s ON sb.service_id = s.id
       JOIN service_categories sc ON s.category_id = sc.id
       LEFT JOIN employees e ON sb.barber_id = e.employee_id
       WHERE sb.id = ?`,
      [booking_id]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    const booking = bookings[0];
    
    // Generate reference number
    const reference_number = await generateReferenceNumber();
    
    // Calculate queue position (get the highest position and add 1)
    const [positionResult] = await con.promise().query(
      `SELECT IFNULL(MAX(queue_position), 0) as max_position FROM queues`
    );
    const queue_position = positionResult[0].max_position + 1;
    
    // Estimate wait time (simple calculation: position * average service duration)
    // In a real system, this would be more complex based on actual service durations
    const estimated_wait_time = queue_position * 30; // Assuming 30 min average service
    
    // Insert queue entry
    const [result] = await con.promise().query(
      `INSERT INTO queues 
       (booking_id, reference_number, queue_position, estimated_wait_time, queue_status, created_at)
       VALUES (?, ?, ?, ?, 'queued', NOW())`,
      [
        booking_id,
        reference_number,
        queue_position,
        estimated_wait_time
      ]
    );
    
    // Update booking with reference number and set approval_status to approved
    await con.promise().query(
      `UPDATE service_bookings 
       SET approval_status = 'approved', queue_status = 'queued', reference_number = ?
       WHERE id = ?`,
      [reference_number, booking_id]
    );
    
    // Fetch the created queue entry
    const [newQueue] = await con.promise().query(
      `SELECT q.*, sb.customer_name, sb.customer_phone as phone_number, s.service_name, 
              sb.booking_date as appointment_date, sb.time_slot as appointment_time, e.name as barber_name
       FROM queues q
       JOIN service_bookings sb ON q.booking_id = sb.id
       JOIN services s ON sb.service_id = s.id
       LEFT JOIN employees e ON sb.barber_id = e.employee_id
       WHERE q.id = ?`,
      [result.insertId]
    );
    
    return res.status(201).json({
      success: true,
      message: "Queue entry created successfully",
      data: newQueue[0]
    });
  } catch (error) {
    console.error("Error creating queue entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create queue entry",
      error: error.message
    });
  }
};

// Update queue status (for calling next, marking serving/completed)
const updateQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { queue_status } = req.body;
    
    // Validate queue_status
    const validStatuses = ['not_started', 'queued', 'serving', 'completed'];
    if (!queue_status || !validStatuses.includes(queue_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queue status. Must be one of: not_started, queued, serving, completed"
      });
    }
    
    // Update queue status
    const [result] = await con.promise().query(
      `UPDATE queues SET queue_status = ?, updated_at = NOW() WHERE id = ?`,
      [queue_status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Queue entry not found"
      });
    }
    
    // If marking as completed, also update the booking status
    if (queue_status === 'completed') {
      await con.promise().query(
        `UPDATE service_bookings sb
         JOIN queues q ON sb.id = q.booking_id
         SET sb.queue_status = 'completed', sb.status = 'completed'
         WHERE q.id = ?`,
        [id]
      );
    }
    
    // If marking as serving, update booking status
    if (queue_status === 'serving') {
      await con.promise().query(
        `UPDATE service_bookings sb
         JOIN queues q ON sb.id = q.booking_id
         SET sb.queue_status = 'serving', sb.status = 'in_progress'
         WHERE q.id = ?`,
        [id]
      );
    }
    
    // Fetch updated queue entry
    const [updatedQueue] = await con.promise().query(
      `SELECT q.*, sb.customer_name, sb.customer_email, sb.customer_phone as phone_number, s.service_name, 
              sb.appointment_date as appointment_date, sb.appointment_time as appointment_time, e.name as barber_name
       FROM queues q
       JOIN service_bookings sb ON q.booking_id = sb.id
       JOIN services s ON sb.service_id = s.id
       LEFT JOIN employees e ON sb.barber_id = e.employee_id
       WHERE q.id = ?`,
      [id]
    );

    // Send queue status email asynchronously
    if (updatedQueue[0] && updatedQueue[0].customer_email) {
      amsMailer.sendQueueStatusUpdateEmail(
        updatedQueue[0].customer_email,
        updatedQueue[0].customer_name,
        updatedQueue[0].service_name,
        updatedQueue[0].reference_number,
        queue_status,
        updatedQueue[0].queue_position,
        updatedQueue[0].estimated_wait_time
      ).catch(err => console.error("Error sending queue status update email:", err));
    }
    
    return res.status(200).json({
      success: true,
      message: `Queue status updated to ${queue_status}`,
      data: updatedQueue[0]
    });
  } catch (error) {
    console.error("Error updating queue status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update queue status",
      error: error.message
    });
  }
};

// Call next in queue (automatically set first queued item to serving)
const callNext = async (req, res) => {
  try {
    const { barber_id } = req.params;
    
    // Find the first queued item for this barber (or overall if no barber specified)
    let query = `
      SELECT q.id FROM queues q
      JOIN service_bookings sb ON q.booking_id = sb.id
      WHERE q.queue_status = 'queued'
    `;
    const params = [];
    
    if (barber_id) {
      query += " AND sb.barber_id = ?";
      params.push(barber_id);
    }
    
    query += " ORDER BY q.queue_position ASC LIMIT 1";
    
    const [nextInQueue] = await con.promise().query(query, params);
    
    if (nextInQueue.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No customers in queue"
      });
    }
    
    // Update the first queued item to serving
    const [result] = await con.promise().query(
      `UPDATE queues SET queue_status = 'serving', updated_at = NOW() WHERE id = ?`,
      [nextInQueue[0].id]
    );
    
    // Update corresponding booking
    await con.promise().query(
      `UPDATE service_bookings sb
       JOIN queues q ON sb.id = q.booking_id
       SET sb.queue_status = 'serving', sb.status = 'in_progress'
       WHERE q.id = ?`,
      [nextInQueue[0].id]
    );
    
    // Fetch updated queue entry
    const [updatedQueue] = await con.promise().query(
      `SELECT q.*, sb.customer_name, sb.customer_email, sb.customer_phone as phone_number, s.service_name, 
              sb.appointment_date as appointment_date, sb.appointment_time as appointment_time, e.name as barber_name
       FROM queues q
       JOIN service_bookings sb ON q.booking_id = sb.id
       JOIN services s ON sb.service_id = s.id
       LEFT JOIN employees e ON sb.barber_id = e.employee_id
       WHERE q.id = ?`,
      [nextInQueue[0].id]
    );

    // Send queue status email asynchronously
    if (updatedQueue[0] && updatedQueue[0].customer_email) {
      amsMailer.sendQueueStatusUpdateEmail(
        updatedQueue[0].customer_email,
        updatedQueue[0].customer_name,
        updatedQueue[0].service_name,
        updatedQueue[0].reference_number,
        'serving',
        updatedQueue[0].queue_position,
        updatedQueue[0].estimated_wait_time
      ).catch(err => console.error("Error sending call next email:", err));
    }
    
    return res.status(200).json({
      success: true,
      message: "Next customer called",
      data: updatedQueue[0]
    });
  } catch (error) {
    console.error("Error calling next in queue:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to call next customer",
      error: error.message
    });
  }
};

// Get queue statistics
const getQueueStats = async (req, res) => {
  try {
    const { barber_id, date } = req.query;
    
    let query = `
      SELECT 
        COUNT(CASE WHEN q.queue_status = 'queued' THEN 1 END) as waiting_count,
        COUNT(CASE WHEN q.queue_status = 'serving' THEN 1 END) as serving_count,
        COUNT(CASE WHEN q.queue_status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN q.queue_status = 'not_started' THEN 1 END) as not_started_count,
        AVG(CASE WHEN q.queue_status = 'queued' THEN q.estimated_wait_time END) as avg_wait_time
      FROM queues q
      JOIN service_bookings sb ON q.booking_id = sb.id
      WHERE 1=1
    `;
    const params = [];
    
    if (barber_id) {
      query += " AND sb.barber_id = ?";
      params.push(barber_id);
    }
    
    if (date) {
      query += " AND sb.appointment_date = ?";
      params.push(date);
    }
    
    const [stats] = await con.promise().query(query, params);
    
    return res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue statistics",
      error: error.message
    });
  }
};

module.exports = {
  getQueues,
  getQueueByReference,
  createQueueEntry,
  updateQueueStatus,
  callNext,
  getQueueStats,
  generateReferenceNumber
};

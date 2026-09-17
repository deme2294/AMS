// controllers/bookingWorkflowController.js
// Enhanced booking approval workflow with state machine and history tracking

const con = require("../models/db");
const workflowEngine = require("../utils/workflowEngine");
const { WORKFLOW_ACTIONS, APPROVAL_STATUS } = workflowEngine;

/**
 * Request changes to a booking
 * Sets approval_status to 'changes_requested' and records details
 */
const requestChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { change_requests, internal_note } = req.body;
    
    if (!change_requests || change_requests.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Change request details are required'
      });
    }
    
    // Get current booking
    const [bookings] = await con.promise().query(
      `SELECT id, approval_status, reference_number, customer_id, customer_email, customer_name
       FROM service_bookings 
       WHERE id = ? 
       LIMIT 1`,
      [id]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookings[0];
    
    // Validate that booking can have changes requested
    if (booking.approval_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request changes for already approved bookings'
      });
    }
    
    if (booking.approval_status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request changes for rejected bookings'
      });
    }
    
    // Get user role for validation
    const [users] = await con.promise().query(
      `SELECT r.role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.user_id = ? 
       LIMIT 1`,
      [req.user?.user_id]
    );
    
    const userRole = users[0]?.role_name || 'Unknown';
    
    // Execute workflow transition
    const transition = await workflowEngine.executeTransition({
      bookingId: id,
      toStatus: APPROVAL_STATUS.CHANGES_REQUESTED,
      action: WORKFLOW_ACTIONS.CHANGES_REQUESTED,
      actionBy: req.user?.user_id,
      userRole,
      notes: change_requests,
      internalNote: internal_note || null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    if (!transition.success) {
      return res.status(400).json({
        success: false,
        message: transition.message
      });
    }
    
    // Update service_bookings with approval note
    await con.promise().query(
      `UPDATE service_bookings 
       SET approval_note = ?,
           updated_by = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [change_requests, req.user?.user_id, id]
    );
    
    // Get updated booking
    const [updatedBooking] = await con.promise().query(
      `SELECT sb.*, s.service_name, sc.category_name, e.name AS barber_name
       FROM service_bookings sb
       LEFT JOIN services s ON sb.service_id = s.id
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       LEFT JOIN employees e ON sb.barber_id = e.employee_id
       WHERE sb.id = ?`,
      [id]
    );
    
    // TODO: Send notification to customer
    // This will be implemented in Task #16 (Real-time Notifications)
    
    return res.status(200).json({
      success: true,
      message: 'Changes requested successfully. Customer will be notified.',
      data: updatedBooking[0]
    });
  } catch (error) {
    console.error('[BookingWorkflow] Error requesting changes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to request changes',
      error: error.message
    });
  }
};

/**
 * Get workflow history for a booking
 */
const getBookingWorkflowHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify booking exists and user has access
    const [bookings] = await con.promise().query(
      `SELECT id, customer_id 
       FROM service_bookings 
       WHERE id = ? 
       LIMIT 1`,
      [id]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check access: admins see all, customers see their own
    const booking = bookings[0];
    const isAdmin = ['Admin', 'Manager', 'Receptionist'].includes(req.user?.role_name);
    const isOwner = booking.customer_id === req.user?.user_id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view workflow history'
      });
    }
    
    // Get workflow history
    const history = await workflowEngine.getWorkflowHistory(id);
    
    // For customers, hide internal notes
    const filteredHistory = isAdmin ? history : history.map(h => ({
      ...h,
      internal_note: null
    }));
    
    return res.status(200).json({
      success: true,
      data: filteredHistory
    });
  } catch (error) {
    console.error('[BookingWorkflow] Error getting workflow history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get workflow history',
      error: error.message
    });
  }
};

/**
 * Get workflow history by reference number
 */
const getWorkflowHistoryByReference = async (req, res) => {
  try {
    const { reference_number } = req.params;
    
    // Get booking to check ownership
    const [bookings] = await con.promise().query(
      `SELECT id, customer_id 
       FROM service_bookings 
       WHERE reference_number = ? 
       LIMIT 1`,
      [reference_number]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookings[0];
    const isAdmin = ['Admin', 'Manager', 'Receptionist'].includes(req.user?.role_name);
    const isOwner = booking.customer_id === req.user?.user_id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view workflow history'
      });
    }
    
    const history = await workflowEngine.getWorkflowHistoryByReference(reference_number);
    
    // For customers, hide internal notes
    const filteredHistory = isAdmin ? history : history.map(h => ({
      ...h,
      internal_note: null
    }));
    
    return res.status(200).json({
      success: true,
      data: filteredHistory
    });
  } catch (error) {
    console.error('[BookingWorkflow] Error getting workflow history by reference:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get workflow history',
      error: error.message
    });
  }
};

/**
 * Get available workflow actions for a booking
 */
const getAvailableWorkflowActions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get booking current status
    const [bookings] = await con.promise().query(
      `SELECT id, approval_status 
       FROM service_bookings 
       WHERE id = ? 
       LIMIT 1`,
      [id]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookings[0];
    
    // Get user role
    const [users] = await con.promise().query(
      `SELECT r.role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.user_id = ? 
       LIMIT 1`,
      [req.user?.user_id]
    );
    
    const userRole = users[0]?.role_name || 'Unknown';
    
    // Get available actions
    const actions = await workflowEngine.getAvailableActions(
      booking.approval_status,
      userRole
    );
    
    return res.status(200).json({
      success: true,
      data: {
        current_status: booking.approval_status,
        available_actions: actions
      }
    });
  } catch (error) {
    console.error('[BookingWorkflow] Error getting available actions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get available actions',
      error: error.message
    });
  }
};

/**
 * Get workflow statistics
 */
const getWorkflowStatistics = async (req, res) => {
  try {
    const { date_from, date_to, action, role } = req.query;
    
    const stats = await workflowEngine.getWorkflowStats({
      date_from,
      date_to,
      action,
      role
    });
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[BookingWorkflow] Error getting workflow statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get workflow statistics',
      error: error.message
    });
  }
};

/**
 * Check if booking has pending change requests
 */
const checkPendingChangeRequests = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await workflowEngine.checkChangeRequests(id);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[BookingWorkflow] Error checking change requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check change requests',
      error: error.message
    });
  }
};

/**
 * Customer resubmits booking after making requested changes
 */
const resubmitAfterChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_notes } = req.body;
    
    // Get booking
    const [bookings] = await con.promise().query(
      `SELECT id, approval_status, customer_id, reference_number
       FROM service_bookings 
       WHERE id = ? 
       LIMIT 1`,
      [id]
    );
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = bookings[0];
    
    // Verify user is the customer
    if (booking.customer_id !== req.user?.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Only the booking owner can resubmit'
      });
    }
    
    // Verify booking is in changes_requested status
    if (booking.approval_status !== 'changes_requested') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not awaiting changes'
      });
    }
    
    // Execute workflow transition
    const transition = await workflowEngine.executeTransition({
      bookingId: id,
      toStatus: APPROVAL_STATUS.WAITING,
      action: WORKFLOW_ACTIONS.RESUBMITTED,
      actionBy: req.user?.user_id,
      userRole: 'Customer',
      notes: updated_notes || 'Customer has made requested changes',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    if (!transition.success) {
      return res.status(400).json({
        success: false,
        message: transition.message
      });
    }
    
    // Clear approval_note (since changes were made)
    await con.promise().query(
      `UPDATE service_bookings 
       SET approval_note = NULL,
           booking_note = COALESCE(?, booking_note),
           updated_at = NOW()
       WHERE id = ?`,
      [updated_notes, id]
    );
    
    // Get updated booking
    const [updatedBooking] = await con.promise().query(
      `SELECT sb.*, s.service_name, sc.category_name
       FROM service_bookings sb
       LEFT JOIN services s ON sb.service_id = s.id
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       WHERE sb.id = ?`,
      [id]
    );
    
    return res.status(200).json({
      success: true,
      message: 'Booking resubmitted for review',
      data: updatedBooking[0]
    });
  } catch (error) {
    console.error('[BookingWorkflow] Error resubmitting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resubmit booking',
      error: error.message
    });
  }
};

module.exports = {
  requestChanges,
  getBookingWorkflowHistory,
  getWorkflowHistoryByReference,
  getAvailableWorkflowActions,
  getWorkflowStatistics,
  checkPendingChangeRequests,
  resubmitAfterChanges
};

// utils/workflowEngine.js
// Booking Approval Workflow Engine
// Handles state transitions, validation, and history tracking

const con = require("../models/db");

/**
 * Workflow State Machine
 * Defines valid transitions and rules
 */
const WORKFLOW_ACTIONS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
  RESUBMITTED: 'resubmitted',
  CANCELLED: 'cancelled',
  AUTO_APPROVED: 'auto_approved'
};

const APPROVAL_STATUS = {
  WAITING: 'waiting',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
  CANCELLED: 'cancelled'
};

/**
 * Validate if a state transition is allowed
 * @param {string} fromState - Current approval_status
 * @param {string} toState - Desired approval_status
 * @param {string} userRole - User's role (Admin, Manager, etc.)
 * @param {boolean} hasNote - Whether a note/reason is provided
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
async function validateTransition(fromState, toState, userRole, hasNote = false) {
  try {
    // Use stored procedure for validation
    const [results] = await con.promise().query(
      `CALL sp_validate_transition(?, ?, ?, ?, @is_valid, @error_message);
       SELECT @is_valid AS is_valid, @error_message AS error_message;`,
      [fromState, toState, userRole, hasNote ? 1 : 0]
    );
    
    // Results are in the second result set
    const validationResult = results[1][0];
    
    return {
      valid: validationResult.is_valid === 1,
      error: validationResult.is_valid === 1 ? null : validationResult.error_message
    };
  } catch (error) {
    console.error('[WorkflowEngine] Validation error:', error);
    return {
      valid: false,
      error: 'Workflow validation failed: ' + error.message
    };
  }
}

/**
 * Record a workflow transition in history
 * @param {object} params - Transition parameters
 * @returns {Promise<number>} - History record ID
 */
async function recordTransition({
  bookingId,
  fromStatus,
  toStatus,
  action,
  actionBy,
  notes = null,
  internalNote = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    await con.promise().query(
      `CALL sp_record_workflow_transition(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        fromStatus,
        toStatus,
        action,
        actionBy,
        notes,
        internalNote,
        ipAddress,
        userAgent
      ]
    );
    
    // Get the last inserted ID
    const [result] = await con.promise().query(
      `SELECT LAST_INSERT_ID() AS history_id`
    );
    
    return result[0].history_id;
  } catch (error) {
    console.error('[WorkflowEngine] Failed to record transition:', error);
    throw error;
  }
}

/**
 * Get workflow history for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Array>} - Array of history records
 */
async function getWorkflowHistory(bookingId) {
  try {
    const [history] = await con.promise().query(
      `SELECT 
        bwh.*,
        u.name AS action_by_name,
        u.email AS action_by_email
       FROM booking_workflow_history bwh
       LEFT JOIN users u ON bwh.action_by = u.user_id
       WHERE bwh.booking_id = ?
       ORDER BY bwh.action_timestamp DESC`,
      [bookingId]
    );
    
    return history;
  } catch (error) {
    console.error('[WorkflowEngine] Failed to get workflow history:', error);
    return [];
  }
}

/**
 * Get workflow history by reference number
 * @param {string} referenceNumber - Booking reference number
 * @returns {Promise<Array>} - Array of history records
 */
async function getWorkflowHistoryByReference(referenceNumber) {
  try {
    const [history] = await con.promise().query(
      `SELECT 
        bwh.*,
        u.name AS action_by_name,
        u.email AS action_by_email
       FROM booking_workflow_history bwh
       LEFT JOIN users u ON bwh.action_by = u.user_id
       WHERE bwh.reference_number = ?
       ORDER BY bwh.action_timestamp DESC`,
      [referenceNumber]
    );
    
    return history;
  } catch (error) {
    console.error('[WorkflowEngine] Failed to get workflow history by reference:', error);
    return [];
  }
}

/**
 * Execute a workflow transition with full validation
 * @param {object} params - Transition parameters
 * @returns {Promise<{success: boolean, message: string, data: object|null}>}
 */
async function executeTransition({
  bookingId,
  toStatus,
  action,
  actionBy,
  userRole,
  notes = null,
  internalNote = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    // Get current booking status
    const [bookings] = await con.promise().query(
      `SELECT id, approval_status, reference_number 
       FROM service_bookings 
       WHERE id = ? 
       LIMIT 1`,
      [bookingId]
    );
    
    if (bookings.length === 0) {
      return {
        success: false,
        message: 'Booking not found',
        data: null
      };
    }
    
    const booking = bookings[0];
    const fromStatus = booking.approval_status;
    
    // Check if status is actually changing
    if (fromStatus === toStatus) {
      return {
        success: true,
        message: 'Booking already in target status',
        data: { booking, fromStatus, toStatus, skipped: true }
      };
    }
    
    // Validate transition
    const validation = await validateTransition(
      fromStatus,
      toStatus,
      userRole,
      notes !== null && notes.trim() !== ''
    );
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error,
        data: null
      };
    }
    
    // Update booking status
    await con.promise().query(
      `UPDATE service_bookings 
       SET approval_status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [toStatus, bookingId]
    );
    
    // Record transition in history
    const historyId = await recordTransition({
      bookingId,
      fromStatus,
      toStatus,
      action,
      actionBy,
      notes,
      internalNote,
      ipAddress,
      userAgent
    });
    
    return {
      success: true,
      message: `Status changed from ${fromStatus} to ${toStatus}`,
      data: {
        bookingId,
        referenceNumber: booking.reference_number,
        fromStatus,
        toStatus,
        action,
        historyId
      }
    };
  } catch (error) {
    console.error('[WorkflowEngine] Failed to execute transition:', error);
    return {
      success: false,
      message: 'Failed to execute workflow transition: ' + error.message,
      data: null
    };
  }
}

/**
 * Get available actions for a booking based on current status and user role
 * @param {string} currentStatus - Current approval_status
 * @param {string} userRole - User's role
 * @returns {Promise<Array>} - Array of available actions
 */
async function getAvailableActions(currentStatus, userRole) {
  try {
    const [actions] = await con.promise().query(
      `SELECT 
        to_state,
        requires_note,
        description
       FROM workflow_state_rules
       WHERE from_state = ?
         AND is_active = 1
         AND FIND_IN_SET(?, allowed_roles) > 0
       ORDER BY to_state`,
      [currentStatus, userRole]
    );
    
    return actions;
  } catch (error) {
    console.error('[WorkflowEngine] Failed to get available actions:', error);
    return [];
  }
}

/**
 * Get workflow statistics
 * @param {object} filters - Optional filters (date_from, date_to, action, role)
 * @returns {Promise<object>} - Workflow statistics
 */
async function getWorkflowStats(filters = {}) {
  try {
    let query = `
      SELECT 
        COUNT(*) AS total_transitions,
        COUNT(DISTINCT booking_id) AS unique_bookings,
        action,
        action_role,
        DATE(action_timestamp) AS action_date,
        AVG(TIMESTAMPDIFF(MINUTE, sb.created_at, bwh.action_timestamp)) AS avg_minutes_to_action
      FROM booking_workflow_history bwh
      LEFT JOIN service_bookings sb ON bwh.booking_id = sb.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.date_from) {
      query += ` AND DATE(bwh.action_timestamp) >= ?`;
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      query += ` AND DATE(bwh.action_timestamp) <= ?`;
      params.push(filters.date_to);
    }
    
    if (filters.action) {
      query += ` AND bwh.action = ?`;
      params.push(filters.action);
    }
    
    if (filters.role) {
      query += ` AND bwh.action_role = ?`;
      params.push(filters.role);
    }
    
    query += `
      GROUP BY action, action_role, action_date
      ORDER BY action_date DESC, action
    `;
    
    const [stats] = await con.promise().query(query, params);
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('[WorkflowEngine] Failed to get workflow stats:', error);
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

/**
 * Check if a booking requires changes based on workflow history
 * @param {number} bookingId - Booking ID
 * @returns {Promise<{requiresChanges: boolean, latestRequest: object|null}>}
 */
async function checkChangeRequests(bookingId) {
  try {
    const [requests] = await con.promise().query(
      `SELECT 
        bwh.*,
        u.name AS action_by_name
       FROM booking_workflow_history bwh
       LEFT JOIN users u ON bwh.action_by = u.user_id
       WHERE bwh.booking_id = ?
         AND bwh.action = 'changes_requested'
       ORDER BY bwh.action_timestamp DESC
       LIMIT 1`,
      [bookingId]
    );
    
    if (requests.length === 0) {
      return {
        requiresChanges: false,
        latestRequest: null
      };
    }
    
    // Check if there's been a resubmission after this request
    const [resubmissions] = await con.promise().query(
      `SELECT id
       FROM booking_workflow_history
       WHERE booking_id = ?
         AND action = 'resubmitted'
         AND action_timestamp > ?
       LIMIT 1`,
      [bookingId, requests[0].action_timestamp]
    );
    
    return {
      requiresChanges: resubmissions.length === 0,
      latestRequest: requests[0]
    };
  } catch (error) {
    console.error('[WorkflowEngine] Failed to check change requests:', error);
    return {
      requiresChanges: false,
      latestRequest: null
    };
  }
}

module.exports = {
  WORKFLOW_ACTIONS,
  APPROVAL_STATUS,
  validateTransition,
  recordTransition,
  getWorkflowHistory,
  getWorkflowHistoryByReference,
  executeTransition,
  getAvailableActions,
  getWorkflowStats,
  checkChangeRequests
};

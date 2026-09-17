-- ============================================
-- BOOKING WORKFLOW ENGINE ENHANCEMENTS
-- Task #7: Enhanced Approval Workflow
-- ============================================

-- Table: booking_workflow_history
-- Tracks all status transitions and approval actions for complete audit trail
CREATE TABLE IF NOT EXISTS `booking_workflow_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  
  -- References
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `reference_number` VARCHAR(50) NULL,
  
  -- Status Transition
  `from_status` VARCHAR(50) NULL COMMENT 'Previous approval_status',
  `to_status` VARCHAR(50) NOT NULL COMMENT 'New approval_status',
  
  -- Action Details
  `action` ENUM(
    'submitted',          -- Initial booking submission
    'approved',           -- Admin approved
    'rejected',           -- Admin rejected
    'changes_requested',  -- Admin requested changes
    'resubmitted',        -- Customer resubmitted after changes
    'cancelled',          -- Booking cancelled
    'auto_approved'       -- Automatically approved by system
  ) NOT NULL,
  
  `action_by` INT NULL COMMENT 'User ID who performed the action',
  `action_role` VARCHAR(50) NULL COMMENT 'Role of user (Admin, Manager, Customer)',
  
  -- Notes and Reasons
  `notes` TEXT NULL COMMENT 'Approval notes, rejection reason, or change requests',
  `internal_note` TEXT NULL COMMENT 'Internal notes not visible to customer',
  
  -- Metadata
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `action_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_booking_id (booking_id),
  INDEX idx_reference_number (reference_number),
  INDEX idx_action (action),
  INDEX idx_action_by (action_by),
  INDEX idx_action_timestamp (action_timestamp),
  
  -- Foreign Keys
  CONSTRAINT fk_workflow_booking
    FOREIGN KEY (booking_id)
    REFERENCES service_bookings(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_workflow_user
    FOREIGN KEY (action_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Booking approval workflow history and state transitions';

-- ============================================
-- WORKFLOW STATE MACHINE CONFIGURATION
-- ============================================

-- Table: workflow_state_rules
-- Defines valid state transitions for the approval workflow
CREATE TABLE IF NOT EXISTS `workflow_state_rules` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  
  `from_state` VARCHAR(50) NOT NULL,
  `to_state` VARCHAR(50) NOT NULL,
  `allowed_roles` VARCHAR(255) NOT NULL COMMENT 'Comma-separated role names',
  `requires_note` TINYINT(1) DEFAULT 0 COMMENT 'Whether note/reason is required',
  `is_active` TINYINT(1) DEFAULT 1,
  
  `description` VARCHAR(255) NULL,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure unique transition rules
  UNIQUE KEY unique_transition (from_state, to_state),
  INDEX idx_from_state (from_state),
  INDEX idx_to_state (to_state)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Approval workflow state transition rules';

-- ============================================
-- SEED WORKFLOW STATE RULES
-- ============================================

INSERT INTO `workflow_state_rules` 
  (`from_state`, `to_state`, `allowed_roles`, `requires_note`, `description`) 
VALUES
  -- From: waiting (initial state)
  ('waiting', 'approved', 'Admin,Manager,Receptionist', 0, 'Approve pending booking'),
  ('waiting', 'rejected', 'Admin,Manager,Receptionist', 1, 'Reject pending booking (reason required)'),
  ('waiting', 'changes_requested', 'Admin,Manager,Receptionist', 1, 'Request changes from customer (details required)'),
  ('waiting', 'cancelled', 'Admin,Manager,Receptionist,Customer', 1, 'Cancel before review'),
  
  -- From: changes_requested
  ('changes_requested', 'waiting', 'Customer', 0, 'Customer resubmits after making changes'),
  ('changes_requested', 'approved', 'Admin,Manager,Receptionist', 0, 'Approve despite requested changes'),
  ('changes_requested', 'rejected', 'Admin,Manager,Receptionist', 1, 'Reject after change request'),
  ('changes_requested', 'cancelled', 'Admin,Manager,Receptionist,Customer', 1, 'Cancel after change request'),
  
  -- From: approved
  ('approved', 'cancelled', 'Admin,Manager,Receptionist,Customer', 1, 'Cancel approved booking'),
  ('approved', 'rejected', 'Admin,Manager', 1, 'Reverse approval (rare, admin override)'),
  
  -- From: rejected
  ('rejected', 'waiting', 'Admin,Manager', 0, 'Reopen rejected booking for review'),
  ('rejected', 'approved', 'Admin,Manager', 0, 'Approve previously rejected booking (admin override)'),
  
  -- From: cancelled (usually terminal, but allow reopening)
  ('cancelled', 'waiting', 'Admin,Manager', 0, 'Reopen cancelled booking')
ON DUPLICATE KEY UPDATE
  `allowed_roles` = VALUES(`allowed_roles`),
  `requires_note` = VALUES(`requires_note`),
  `description` = VALUES(`description`),
  `updated_at` = CURRENT_TIMESTAMP;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Add index to service_bookings for workflow queries
ALTER TABLE `service_bookings` 
  ADD INDEX IF NOT EXISTS idx_approval_created (approval_status, created_at);

-- ============================================
-- VIEWS FOR WORKFLOW REPORTING
-- ============================================

-- View: Booking workflow summary with latest action
CREATE OR REPLACE VIEW `v_booking_workflow_summary` AS
SELECT 
  sb.id AS booking_id,
  sb.reference_number,
  sb.customer_name,
  sb.service_id,
  s.service_name,
  sb.appointment_date,
  sb.appointment_time,
  sb.booking_status,
  sb.approval_status,
  sb.created_at AS booking_created_at,
  
  -- Latest workflow action
  (SELECT bwh.action 
   FROM booking_workflow_history bwh 
   WHERE bwh.booking_id = sb.id 
   ORDER BY bwh.action_timestamp DESC 
   LIMIT 1) AS last_action,
   
  (SELECT bwh.action_timestamp 
   FROM booking_workflow_history bwh 
   WHERE bwh.booking_id = sb.id 
   ORDER BY bwh.action_timestamp DESC 
   LIMIT 1) AS last_action_timestamp,
   
  (SELECT u.name 
   FROM booking_workflow_history bwh 
   LEFT JOIN users u ON bwh.action_by = u.user_id
   WHERE bwh.booking_id = sb.id 
   ORDER BY bwh.action_timestamp DESC 
   LIMIT 1) AS last_action_by_name,
   
  -- Workflow metrics
  (SELECT COUNT(*) 
   FROM booking_workflow_history bwh 
   WHERE bwh.booking_id = sb.id) AS total_transitions,
   
  (SELECT TIMESTAMPDIFF(MINUTE, sb.created_at, MIN(bwh.action_timestamp))
   FROM booking_workflow_history bwh 
   WHERE bwh.booking_id = sb.id 
   AND bwh.action = 'approved') AS minutes_to_approval

FROM service_bookings sb
LEFT JOIN services s ON sb.service_id = s.id;

-- ============================================
-- STORED PROCEDURES FOR WORKFLOW
-- ============================================

DELIMITER //

-- Procedure: Record workflow transition
CREATE OR REPLACE PROCEDURE `sp_record_workflow_transition`(
  IN p_booking_id BIGINT UNSIGNED,
  IN p_from_status VARCHAR(50),
  IN p_to_status VARCHAR(50),
  IN p_action VARCHAR(50),
  IN p_action_by INT,
  IN p_notes TEXT,
  IN p_internal_note TEXT,
  IN p_ip_address VARCHAR(45),
  IN p_user_agent VARCHAR(500)
)
BEGIN
  DECLARE v_reference_number VARCHAR(50);
  DECLARE v_role VARCHAR(50);
  
  -- Get reference number
  SELECT reference_number INTO v_reference_number
  FROM service_bookings
  WHERE id = p_booking_id;
  
  -- Get user role
  SELECT r.role_name INTO v_role
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.user_id = p_action_by;
  
  -- Insert workflow history record
  INSERT INTO booking_workflow_history (
    booking_id,
    reference_number,
    from_status,
    to_status,
    action,
    action_by,
    action_role,
    notes,
    internal_note,
    ip_address,
    user_agent,
    action_timestamp
  ) VALUES (
    p_booking_id,
    v_reference_number,
    p_from_status,
    p_to_status,
    p_action,
    p_action_by,
    v_role,
    p_notes,
    p_internal_note,
    p_ip_address,
    p_user_agent,
    NOW()
  );
END //

-- Procedure: Validate state transition
CREATE OR REPLACE PROCEDURE `sp_validate_transition`(
  IN p_from_state VARCHAR(50),
  IN p_to_state VARCHAR(50),
  IN p_user_role VARCHAR(50),
  IN p_has_note TINYINT(1),
  OUT p_is_valid TINYINT(1),
  OUT p_error_message VARCHAR(255)
)
BEGIN
  DECLARE v_allowed_roles VARCHAR(255);
  DECLARE v_requires_note TINYINT(1);
  DECLARE v_is_active TINYINT(1);
  
  -- Default to invalid
  SET p_is_valid = 0;
  SET p_error_message = 'Unknown validation error';
  
  -- Check if transition rule exists
  SELECT allowed_roles, requires_note, is_active
  INTO v_allowed_roles, v_requires_note, v_is_active
  FROM workflow_state_rules
  WHERE from_state = p_from_state
    AND to_state = p_to_state
  LIMIT 1;
  
  -- If no rule found
  IF v_allowed_roles IS NULL THEN
    SET p_error_message = CONCAT('Invalid transition: ', p_from_state, ' → ', p_to_state);
    SET p_is_valid = 0;
  -- If rule is inactive
  ELSEIF v_is_active = 0 THEN
    SET p_error_message = 'This transition is currently disabled';
    SET p_is_valid = 0;
  -- If role not allowed
  ELSEIF FIND_IN_SET(p_user_role, v_allowed_roles) = 0 THEN
    SET p_error_message = CONCAT('Role ', p_user_role, ' not authorized for this transition');
    SET p_is_valid = 0;
  -- If note required but not provided
  ELSEIF v_requires_note = 1 AND p_has_note = 0 THEN
    SET p_error_message = 'A note/reason is required for this action';
    SET p_is_valid = 0;
  -- All checks passed
  ELSE
    SET p_is_valid = 1;
    SET p_error_message = 'Valid transition';
  END IF;
END //

DELIMITER ;

-- ============================================
-- WORKFLOW METRICS AND ANALYTICS
-- ============================================

-- View: Workflow performance metrics
CREATE OR REPLACE VIEW `v_workflow_metrics` AS
SELECT 
  DATE(bwh.action_timestamp) AS metric_date,
  bwh.action,
  COUNT(*) AS action_count,
  
  -- Average time to action
  AVG(TIMESTAMPDIFF(MINUTE, sb.created_at, bwh.action_timestamp)) AS avg_minutes_from_submission,
  
  -- By role
  bwh.action_role,
  
  -- Success/failure rates
  SUM(CASE WHEN bwh.to_status = 'approved' THEN 1 ELSE 0 END) AS approvals,
  SUM(CASE WHEN bwh.to_status = 'rejected' THEN 1 ELSE 0 END) AS rejections,
  SUM(CASE WHEN bwh.to_status = 'changes_requested' THEN 1 ELSE 0 END) AS change_requests

FROM booking_workflow_history bwh
LEFT JOIN service_bookings sb ON bwh.booking_id = sb.id
GROUP BY metric_date, bwh.action, bwh.action_role
ORDER BY metric_date DESC, bwh.action;

-- ============================================
-- CLEANUP AND ARCHIVE
-- ============================================

-- Optional: Archive old workflow history (keep last 2 years)
-- Uncomment to enable:
-- CREATE EVENT IF NOT EXISTS archive_old_workflow_history
-- ON SCHEDULE EVERY 1 MONTH
-- DO
--   DELETE FROM booking_workflow_history
--   WHERE action_timestamp < DATE_SUB(NOW(), INTERVAL 2 YEAR);

COMMIT;

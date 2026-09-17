-- ============================================
-- COMPLETE BARBER MANAGEMENT SYSTEM SCHEMA
-- Database: db_barber
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS=0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================
-- 1. BASE TABLES (Users, Roles, Employees)
-- ============================================

-- Table: roles
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT NOT NULL PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO roles (role_id, role_name, status) VALUES
(1, 'Admin', 1),
(2, 'Barber', 1),
(3, 'Customer', 1),
(4, 'Manager', 1),
(5, 'Receptionist', 1);

-- Table: employees
CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `fname` VARCHAR(50) NULL,
  `lname` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `sex` ENUM('M', 'F', 'Other') NULL,
  `role_id` INT NULL,
  `department_id` INT NULL,
  `supervisor_id` INT NULL,
  `hire_date` DATE NULL,
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `profile_image` VARCHAR(500) NULL,
  `bio` TEXT NULL,
  `specialization` VARCHAR(255) NULL,
  `years_experience` INT NULL DEFAULT 0,
  `rating_avg` DECIMAL(3,2) NULL DEFAULT 0.00,
  `total_bookings` INT DEFAULT 0,
  `completed_bookings` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_role (role_id),
  INDEX idx_status (status),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NULL,
  `user_name` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NULL,
  `status` ENUM('1','0') DEFAULT '1',
  `online_flag` TINYINT(1) DEFAULT 0,
  `avatar_url` VARCHAR(255) NULL,
  `failed_login_attempts` INT DEFAULT 0,
  `account_locked_until` DATETIME NULL,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expires` DATETIME NULL,
  `redemption_token` VARCHAR(255) NULL,
  `redemption_token_expires` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_employee (employee_id),
  INDEX idx_role (role_id),
  INDEX idx_username (user_name),
  
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 2. SERVICE MANAGEMENT TABLES
-- ============================================

-- Table: service_categories
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `category_image` VARCHAR(500) NULL,
  `category_icon` VARCHAR(255) NULL,
  `status` ENUM('active','inactive') DEFAULT 'active',
  `display_order` INT DEFAULT 0,
  `created_by` INT NULL,
  `updated_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: services
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `service_slug` VARCHAR(255) NOT NULL UNIQUE,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `discount_price` DECIMAL(10,2) NULL,
  `duration_minutes` INT NOT NULL DEFAULT 30,
  `service_image` VARCHAR(500) NULL,
  `service_icon` VARCHAR(255) NULL,
  `service_type` ENUM(
    'haircut',
    'beard_trim',
    'hair_wash',
    'hair_coloring',
    'combo',
    'vip',
    'kids',
    'other'
  ) DEFAULT 'other',
  
  `max_customers_per_slot` INT DEFAULT 1,
  `buffer_time_minutes` INT DEFAULT 0,
  `preparation_time` INT DEFAULT 0,
  `cleanup_time` INT DEFAULT 0,
  
  `is_available` TINYINT(1) DEFAULT 1,
  `is_featured` TINYINT(1) DEFAULT 0,
  `published_publicly` TINYINT(1) DEFAULT 1,
  `requires_approval` TINYINT(1) DEFAULT 1,
  
  `status` ENUM('active','inactive','draft','archived') DEFAULT 'active',
  
  `rating_avg` DECIMAL(3,2) NULL DEFAULT 0.00,
  `total_reviews` INT DEFAULT 0,
  `total_bookings` INT DEFAULT 0,
  `total_completed` INT DEFAULT 0,
  
  `created_by` INT NULL,
  `updated_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_slug (service_slug),
  INDEX idx_public (published_publicly),
  INDEX idx_available (is_available),
  
  CONSTRAINT fk_services_category
    FOREIGN KEY (category_id)
    REFERENCES service_categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: service_barber_assignments
-- Tracks which barbers can perform which services
CREATE TABLE IF NOT EXISTS `service_barber_assignments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `service_id` INT NOT NULL,
  `barber_id` INT NOT NULL,
  `is_primary` TINYINT(1) DEFAULT 0,
  `commission_rate` DECIMAL(5,2) NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `assigned_by` INT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_service_barber (service_id, barber_id),
  INDEX idx_service (service_id),
  INDEX idx_barber (barber_id),
  INDEX idx_status (status),
  
  CONSTRAINT fk_assignment_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_assignment_barber
    FOREIGN KEY (barber_id)
    REFERENCES employees(employee_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 3. AVAILABILITY & SCHEDULING TABLES
-- ============================================

-- Table: availability_slots
CREATE TABLE IF NOT EXISTS `availability_slots` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `barber_id` INT NULL,
  `service_id` INT NOT NULL,
  `available_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `max_bookings` INT NOT NULL DEFAULT 1,
  `current_bookings` INT DEFAULT 0,
  `slot_status` ENUM('available','booked','closed','paused') DEFAULT 'available',
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_service_date (service_id, available_date),
  INDEX idx_barber_date (barber_id, available_date),
  INDEX idx_status (slot_status),
  INDEX idx_date (available_date),
  
  CONSTRAINT fk_slot_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_slot_barber
    FOREIGN KEY (barber_id)
    REFERENCES employees(employee_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 4. BOOKING & APPROVAL WORKFLOW TABLES
-- ============================================

-- Table: service_bookings
CREATE TABLE IF NOT EXISTS `service_bookings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  
  -- Booking Reference
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  
  -- Foreign Keys
  `customer_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `barber_id` INT NULL,
  `availability_slot_id` INT NULL,
  
  -- Customer Snapshot
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  
  -- Appointment Information
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `duration_minutes` INT NULL,
  
  -- File Upload (Image/PDF)
  `attachment_file` VARCHAR(500) NULL,
  `attachment_type` ENUM('image','pdf') NULL,
  
  -- Booking Details
  `booking_note` TEXT NULL,
  `special_requirements` TEXT NULL,
  
  -- Workflow Status
  `booking_status` ENUM(
    'pending',
    'approved',
    'queued',
    'serving',
    'completed',
    'cancelled',
    'rejected',
    'no_show'
  ) DEFAULT 'pending',
  
  `approval_status` ENUM(
    'waiting',
    'approved',
    'rejected',
    'changes_requested'
  ) DEFAULT 'waiting',
  
  `queue_status` ENUM(
    'not_started',
    'queued',
    'serving',
    'completed',
    'skipped'
  ) DEFAULT 'not_started',
  
  -- Pricing
  `original_price` DECIMAL(10,2) NULL,
  `final_price` DECIMAL(10,2) NULL,
  `discount_applied` DECIMAL(10,2) NULL,
  
  -- Queue Tracking
  `queue_position` INT NULL,
  `estimated_wait_minutes` INT NULL,
  
  -- Notification Tracking
  `reminder_sent` TINYINT(1) DEFAULT 0,
  `notification_sent` TINYINT(1) DEFAULT 0,
  `sms_sent` TINYINT(1) DEFAULT 0,
  
  -- Approval Information
  `approved_by` INT NULL,
  `approved_at` DATETIME NULL,
  `approval_note` TEXT NULL,
  
  -- Rejection Information
  `rejected_by` INT NULL,
  `rejected_at` DATETIME NULL,
  `rejection_reason` TEXT NULL,
  
  -- Completion Information
  `completed_at` DATETIME NULL,
  `actual_duration_minutes` INT NULL,
  
  -- Cancellation Information
  `cancelled_by` INT NULL,
  `cancelled_at` DATETIME NULL,
  `cancelled_reason` TEXT NULL,
  
  -- Audit Fields
  `created_by` INT NULL,
  `updated_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_reference_number (reference_number),
  INDEX idx_customer (customer_id),
  INDEX idx_service (service_id),
  INDEX idx_barber (barber_id),
  INDEX idx_slot (availability_slot_id),
  INDEX idx_booking_status (booking_status),
  INDEX idx_approval_status (approval_status),
  INDEX idx_queue_status (queue_status),
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_created_at (created_at),
  
  -- Foreign Keys
  CONSTRAINT fk_booking_customer
    FOREIGN KEY (customer_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_booking_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_booking_barber
    FOREIGN KEY (barber_id)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_booking_slot
    FOREIGN KEY (availability_slot_id)
    REFERENCES availability_slots(id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_booking_approved_by
    FOREIGN KEY (approved_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_booking_rejected_by
    FOREIGN KEY (rejected_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 5. QUEUE MANAGEMENT TABLES
-- ============================================

-- Table: queues
CREATE TABLE IF NOT EXISTS `queues` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `booking_id` BIGINT UNSIGNED NOT NULL UNIQUE,
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  `service_id` INT NOT NULL,
  `barber_id` INT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `queue_position` INT NOT NULL,
  `estimated_wait_time` INT NULL, -- in minutes
  `actual_wait_time` INT NULL, -- in minutes
  `queue_date` DATE NOT NULL,
  `queue_status` ENUM(
    'waiting',
    'called',
    'serving',
    'completed',
    'skipped',
    'cancelled'
  ) DEFAULT 'waiting',
  `called_at` DATETIME NULL,
  `serving_started_at` DATETIME NULL,
  `serving_completed_at` DATETIME NULL,
  `called_by` INT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_booking (booking_id),
  INDEX idx_reference_number (reference_number),
  INDEX idx_queue_status (queue_status),
  INDEX idx_queue_position (queue_position),
  INDEX idx_queue_date (queue_date),
  INDEX idx_service (service_id),
  INDEX idx_barber (barber_id),
  
  CONSTRAINT fk_queue_booking
    FOREIGN KEY (booking_id)
    REFERENCES service_bookings(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_queue_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_queue_barber
    FOREIGN KEY (barber_id)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 6. REVIEW & RATING TABLES
-- ============================================

-- Table: service_reviews
CREATE TABLE IF NOT EXISTS `service_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `service_id` INT NOT NULL,
  `barber_id` INT NULL,
  `customer_id` INT NOT NULL,
  `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  `service_rating` TINYINT NULL CHECK (service_rating BETWEEN 1 AND 5),
  `barber_rating` TINYINT NULL CHECK (barber_rating BETWEEN 1 AND 5),
  `cleanliness_rating` TINYINT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
  `review_title` VARCHAR(255) NULL,
  `review_text` TEXT NULL,
  `pros` TEXT NULL,
  `cons` TEXT NULL,
  `would_recommend` TINYINT(1) NULL,
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending',
  `is_verified_booking` TINYINT(1) DEFAULT 0,
  `helpful_count` INT DEFAULT 0,
  `not_helpful_count` INT DEFAULT 0,
  `admin_response` TEXT NULL,
  `responded_by` INT NULL,
  `responded_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_booking_review (booking_id),
  INDEX idx_service (service_id),
  INDEX idx_barber (barber_id),
  INDEX idx_customer (customer_id),
  INDEX idx_rating (rating),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_review_booking
    FOREIGN KEY (booking_id)
    REFERENCES service_bookings(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_review_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_review_barber
    FOREIGN KEY (barber_id)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_review_customer
    FOREIGN KEY (customer_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 7. COMPLAINT MANAGEMENT TABLES
-- ============================================

-- Table: categories (for complaints)
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `parent_category_id` BIGINT UNSIGNED NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_parent (parent_category_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: complaints
CREATE TABLE IF NOT EXISTS `complaints` (
  `complaint_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  
  -- User Info
  `user_id` INT NULL,
  `name` VARCHAR(100) NULL,
  `email` VARCHAR(100) NULL,
  `phone_number` VARCHAR(20) NULL,
  
  -- Complaint Details
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` BIGINT UNSIGNED NULL,
  `subcategory` VARCHAR(100) NULL,
  
  -- Related Entities
  `related_booking_id` BIGINT UNSIGNED NULL,
  `related_service_id` INT NULL,
  `related_barber_id` INT NULL,
  
  -- Status & Workflow
  `status` ENUM(
    'Pending',
    'Investigating',
    'In Progress',
    'Resolved',
    'Closed',
    'Rejected'
  ) DEFAULT 'Pending',
  `priority` ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  
  -- Assignment
  `assigned_to` INT NULL,
  `assignment_comment` TEXT NULL,
  `department` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  
  -- Resolution
  `resolution` TEXT NULL,
  `resolved_by` INT NULL,
  `resolved_at` DATETIME NULL,
  
  -- Dates
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` DATETIME NULL,
  
  -- Attachments
  `attachment_url` TEXT NULL,
  
  -- Public/Authenticated flag
  `is_public` BOOLEAN DEFAULT FALSE,
  
  -- Indexes
  INDEX idx_reference (reference_number),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_category (category_id),
  INDEX idx_booking (related_booking_id),
  INDEX idx_created_at (created_at),
  
  -- Foreign Keys
  CONSTRAINT fk_complaint_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_complaint_category
    FOREIGN KEY (category_id)
    REFERENCES categories(category_id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_complaint_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES users(user_id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_complaint_booking
    FOREIGN KEY (related_booking_id)
    REFERENCES service_bookings(id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_complaint_service
    FOREIGN KEY (related_service_id)
    REFERENCES services(id)
    ON DELETE SET NULL,
  
  CONSTRAINT fk_complaint_barber
    FOREIGN KEY (related_barber_id)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: complaint_assignees
CREATE TABLE IF NOT EXISTS `complaint_assignees` (
  `assignee_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `department` VARCHAR(100) NULL,
  `location` VARCHAR(100) NULL,
  `assignment_comment` TEXT NULL,
  `response` TEXT NULL,
  `response_submitted_at` TIMESTAMP NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_complaint_assignee (complaint_id, user_id),
  INDEX idx_complaint (complaint_id),
  INDEX idx_user (user_id),
  
  CONSTRAINT fk_assignee_complaint
    FOREIGN KEY (complaint_id)
    REFERENCES complaints(complaint_id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_assignee_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: complaint_comments
CREATE TABLE IF NOT EXISTS `complaint_comments` (
  `comment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `user_id` INT NULL,
  `message` TEXT NOT NULL,
  `is_internal` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_complaint (complaint_id),
  INDEX idx_user (user_id),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_comment_complaint
    FOREIGN KEY (complaint_id)
    REFERENCES complaints(complaint_id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_comment_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: complaint_history
CREATE TABLE IF NOT EXISTS `complaint_history` (
  `history_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `status_before` VARCHAR(50) NULL,
  `status_after` VARCHAR(50) NULL,
  `priority_before` VARCHAR(20) NULL,
  `priority_after` VARCHAR(20) NULL,
  `assigned_from` INT NULL,
  `assigned_to` INT NULL,
  `changed_by` INT NULL,
  `change_note` TEXT NULL,
  `changed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_complaint (complaint_id),
  INDEX idx_changed_by (changed_by),
  INDEX idx_changed_at (changed_at),
  
  CONSTRAINT fk_history_complaint
    FOREIGN KEY (complaint_id)
    REFERENCES complaints(complaint_id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_history_user
    FOREIGN KEY (changed_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: complaint_attachments
CREATE TABLE IF NOT EXISTS `complaint_attachments` (
  `attachment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_url` TEXT NOT NULL,
  `file_type` VARCHAR(50) NULL,
  `file_size` INT NULL,
  `uploaded_by` INT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_complaint (complaint_id),
  INDEX idx_uploaded_by (uploaded_by),
  
  CONSTRAINT fk_attachment_complaint
    FOREIGN KEY (complaint_id)
    REFERENCES complaints(complaint_id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_attachment_user
    FOREIGN KEY (uploaded_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 8. AUDIT & SECURITY TABLES
-- ============================================

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(50) NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` VARCHAR(50) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_entity_id (entity_id),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: active_sessions
CREATE TABLE IF NOT EXISTS `active_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `jti` VARCHAR(255) NOT NULL UNIQUE,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_activity` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` DATETIME NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_jti (jti),
  INDEX idx_expires_at (expires_at),
  
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: revoked_tokens
CREATE TABLE IF NOT EXISTS `revoked_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `jti` VARCHAR(255) NOT NULL UNIQUE,
  `user_id` INT NULL,
  `token` TEXT NULL,
  `revoked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NULL,
  `reason` VARCHAR(255) NULL,
  
  INDEX idx_jti (jti),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  
  CONSTRAINT fk_revoked_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: blocked_ips
CREATE TABLE IF NOT EXISTS `blocked_ips` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL UNIQUE,
  `blocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `blocked_until` DATETIME NULL,
  `reason` VARCHAR(255) NULL,
  `blocked_by` INT NULL,
  
  INDEX idx_ip_address (ip_address),
  INDEX idx_blocked_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 9. CMS & MENU TABLES
-- ============================================

-- Table: cms_menus
CREATE TABLE IF NOT EXISTS `cms_menus` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `path` VARCHAR(255) NULL,
  `icon` TEXT NULL,
  `color` VARCHAR(50) DEFAULT 'blue',
  `parent_id` INT NULL,
  `order_index` INT DEFAULT 0,
  `is_section` TINYINT(1) DEFAULT 0,
  `is_dropdown` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_order_index (order_index),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: role_menu_permissions
CREATE TABLE IF NOT EXISTS `role_menu_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `menu_id` INT NOT NULL,
  `can_view` TINYINT(1) DEFAULT 0,
  `can_create` TINYINT(1) DEFAULT 0,
  `can_edit` TINYINT(1) DEFAULT 0,
  `can_delete` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_role_menu (role_id, menu_id),
  INDEX idx_role_id (role_id),
  INDEX idx_menu_id (menu_id),
  
  CONSTRAINT fk_perm_role
    FOREIGN KEY (role_id)
    REFERENCES roles(role_id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_perm_menu
    FOREIGN KEY (menu_id)
    REFERENCES cms_menus(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 10. NOTIFICATION TABLES
-- ============================================

-- Table: notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `related_entity_type` VARCHAR(50) NULL,
  `related_entity_id` VARCHAR(50) NULL,
  `action_url` VARCHAR(500) NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `read_at` DATETIME NULL,
  `priority` ENUM('low','normal','high','urgent') DEFAULT 'normal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  
  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 11. SYSTEM SETTINGS TABLES
-- ============================================

-- Table: system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NULL,
  `setting_type` ENUM('string','number','boolean','json') DEFAULT 'string',
  `description` TEXT NULL,
  `is_public` TINYINT(1) DEFAULT 0,
  `updated_by` INT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_setting_key (setting_key),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS=1;
COMMIT;

-- ============================================
-- END OF SCHEMA
-- ============================================

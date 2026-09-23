-- ========================================================
-- Barber Management System (db_barber) Unified Database Script
-- Consolidated and Deduplicated Schema & Data
-- Auto-generated: 2026-09-17T07:41:04.583Z
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `db_barber` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `db_barber`;

SET FOREIGN_KEY_CHECKS = 0;

-- ========================================================
-- SECTION 1: TABLE STRUCTURES (37 Tables)
-- ========================================================

-- --------------------------------------------------------
-- Table structure for table `roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `organization_types`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `organization_types`;
CREATE TABLE IF NOT EXISTS `organization_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `departments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE IF NOT EXISTS `departments` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `employee_positions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `employee_positions`;
CREATE TABLE IF NOT EXISTS `employee_positions` (
  `position_id` int(11) NOT NULL AUTO_INCREMENT,
  `position_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`position_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `fk_ep_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `service_categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `service_categories`;
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `category_icon` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `category_image` varchar(255) DEFAULT NULL,
  `banner_image` varchar(255) DEFAULT NULL,
  `color` varchar(50) DEFAULT '#ec4899',
  `sort_order` int(11) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `employees`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `fname` varchar(50) DEFAULT NULL,
  `lname` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `sex` enum('M','F','Other') DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `profile_image` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `years_experience` int(11) DEFAULT 0,
  `rating_avg` decimal(3,2) DEFAULT 0.00,
  `total_bookings` int(11) DEFAULT 0,
  `completed_bookings` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`employee_id`),
  KEY `role_id` (`role_id`),
  KEY `department_id` (`department_id`),
  KEY `idx_emp_status` (`status`),
  KEY `idx_emp_email` (`email`),
  CONSTRAINT `fk_emp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) DEFAULT NULL,
  `user_name` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `status` enum('1','0') DEFAULT '1',
  `online_flag` tinyint(1) DEFAULT 0,
  `avatar_url` varchar(255) DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `account_locked_until` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `redemption_token` varchar(255) DEFAULT NULL,
  `redemption_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_name` (`user_name`),
  KEY `employee_id` (`employee_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `fk_user_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `organization_structure`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `organization_structure`;
CREATE TABLE IF NOT EXISTS `organization_structure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `position_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `organization_id` (`organization_id`),
  KEY `parent_id` (`parent_id`),
  KEY `employee_id` (`employee_id`),
  KEY `position_id` (`position_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `fk_os_org_type` FOREIGN KEY (`organization_id`) REFERENCES `organization_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_parent` FOREIGN KEY (`parent_id`) REFERENCES `organization_structure` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_pos` FOREIGN KEY (`position_id`) REFERENCES `employee_positions` (`position_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `services`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(255) NOT NULL,
  `service_slug` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 30,
  `duration_minutes` int(11) NOT NULL DEFAULT 30,
  `is_available` tinyint(1) DEFAULT 1,
  `status` enum('active','inactive') DEFAULT 'active',
  `is_featured` tinyint(1) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `service_image` varchar(500) DEFAULT NULL,
  `banner_image` varchar(500) DEFAULT NULL,
  `service_icon` varchar(50) DEFAULT NULL,
  `rating_avg` decimal(3,2) DEFAULT 0.00,
  `rating_count` int(11) DEFAULT 0,
  `max_customers_per_slot` int(11) DEFAULT 1,
  `preparation_time` int(11) DEFAULT 0,
  `cleanup_time` int(11) DEFAULT 0,
  `booking_buffer_time` int(11) DEFAULT 0,
  `service_type` varchar(50) DEFAULT 'standard',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_slug` (`service_slug`),
  KEY `category_id` (`category_id`),
  KEY `barber_id` (`barber_id`),
  CONSTRAINT `fk_services_category` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_barber` FOREIGN KEY (`barber_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `service_barber_assignments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `service_barber_assignments`;
CREATE TABLE IF NOT EXISTS `service_barber_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `barber_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_barber_unique` (`service_id`,`barber_id`),
  KEY `barber_id` (`barber_id`),
  CONSTRAINT `fk_sba_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sba_barber` FOREIGN KEY (`barber_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `availability_slots`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `availability_slots`;
CREATE TABLE IF NOT EXISTS `availability_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `barber_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `available_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_status` enum('available','booked','blocked') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `barber_id` (`barber_id`),
  KEY `service_id` (`service_id`),
  KEY `idx_date_status` (`available_date`,`slot_status`),
  CONSTRAINT `fk_avail_barber` FOREIGN KEY (`barber_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_avail_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `service_bookings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `service_bookings`;
CREATE TABLE IF NOT EXISTS `service_bookings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `availability_slot_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_email` varchar(100) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `booking_status` enum('pending','approved','rejected','confirmed','cancelled','completed') DEFAULT 'pending',
  `approval_status` enum('waiting','pending','approved','rejected','changes_requested','cancelled') DEFAULT 'pending',
  `requires_approval` tinyint(1) DEFAULT 1,
  `workflow_state` varchar(50) DEFAULT 'waiting',
  `rejection_reason` text DEFAULT NULL,
  `booking_note` text DEFAULT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `queue_status` enum('not_started','queued','serving','completed','cancelled') DEFAULT 'queued',
  `reminder_sent` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `customer_id` (`customer_id`),
  KEY `barber_id` (`barber_id`),
  KEY `availability_slot_id` (`availability_slot_id`),
  KEY `idx_booking_ref` (`reference_number`),
  KEY `idx_booking_date` (`appointment_date`),
  KEY `idx_approval_created` (`approval_status`,`created_at`),
  CONSTRAINT `fk_sb_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_sb_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sb_barber` FOREIGN KEY (`barber_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sb_slot` FOREIGN KEY (`availability_slot_id`) REFERENCES `availability_slots` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `queues`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `queues`;
CREATE TABLE IF NOT EXISTS `queues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `queue_position` int(11) NOT NULL,
  `estimated_wait_time` int(11) DEFAULT 0,
  `queue_status` enum('not_started','queued','waiting','serving','completed','cancelled') DEFAULT 'queued',
  `status` enum('waiting','serving','completed','cancelled','queued','not_started') DEFAULT 'waiting',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_queue_ref` (`reference_number`),
  KEY `idx_queue_pos` (`queue_position`),
  CONSTRAINT `fk_queues_booking` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `booking_reviews`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `booking_reviews`;
CREATE TABLE IF NOT EXISTS `booking_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `review_status` varchar(50) DEFAULT 'pending',
  `moved_to_queue` tinyint(1) DEFAULT 0,
  `queue_position` int(11) DEFAULT NULL,
  `confirmed_date` date DEFAULT NULL,
  `confirmed_time` time DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `customer_id` (`customer_id`),
  KEY `service_id` (`service_id`),
  KEY `barber_id` (`barber_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_br_booking` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_br_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_br_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_br_barber` FOREIGN KEY (`barber_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_br_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `service_ratings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `service_ratings`;
CREATE TABLE IF NOT EXISTS `service_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  `review` text DEFAULT NULL,
  `review_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `service_id` (`service_id`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_sr_booking` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `service_reviews`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `service_reviews`;
CREATE TABLE IF NOT EXISTS `service_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `booking_id` bigint(20) unsigned DEFAULT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `review_title` varchar(255) DEFAULT NULL,
  `review_text` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'approved',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `customer_id` (`customer_id`),
  KEY `booking_id` (`booking_id`),
  KEY `barber_id` (`barber_id`),
  CONSTRAINT `fk_sreviews_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sreviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sreviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sreviews_barber` FOREIGN KEY (`barber_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `workflow_state_rules`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `workflow_state_rules`;
CREATE TABLE IF NOT EXISTS `workflow_state_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_state` varchar(50) NOT NULL,
  `to_state` varchar(50) NOT NULL,
  `allowed_roles` varchar(255) NOT NULL COMMENT 'Comma-separated role names',
  `requires_note` tinyint(1) DEFAULT 0 COMMENT 'Whether note/reason is required',
  `is_active` tinyint(1) DEFAULT 1,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_transition` (`from_state`,`to_state`),
  KEY `idx_from_state` (`from_state`),
  KEY `idx_to_state` (`to_state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Approval workflow state transition rules';

-- --------------------------------------------------------
-- Table structure for table `booking_workflow_history`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `booking_workflow_history`;
CREATE TABLE IF NOT EXISTS `booking_workflow_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `from_status` varchar(50) DEFAULT NULL COMMENT 'Previous approval_status',
  `to_status` varchar(50) NOT NULL COMMENT 'New approval_status',
  `action` enum('submitted','approved','rejected','changes_requested','resubmitted','cancelled','auto_approved') NOT NULL,
  `action_by` int(11) DEFAULT NULL COMMENT 'User ID who performed the action',
  `action_role` varchar(50) DEFAULT NULL COMMENT 'Role of user (Admin, Manager, Customer)',
  `notes` text DEFAULT NULL COMMENT 'Approval notes, rejection reason, or change requests',
  `internal_note` text DEFAULT NULL COMMENT 'Internal notes not visible to customer',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `action_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_reference_number` (`reference_number`),
  KEY `idx_action` (`action`),
  KEY `idx_action_by` (`action_by`),
  KEY `idx_action_timestamp` (`action_timestamp`),
  CONSTRAINT `fk_workflow_booking` FOREIGN KEY (`booking_id`) REFERENCES `service_bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workflow_user` FOREIGN KEY (`action_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Booking approval workflow history and state transitions';

-- --------------------------------------------------------
-- Table structure for table `complaints`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `complaints`;
CREATE TABLE IF NOT EXISTS `complaints` (
  `complaint_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Pending',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `tracking_number` varchar(50) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `is_escalated` tinyint(1) DEFAULT 0,
  `assigned_department_id` int(11) DEFAULT NULL,
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`complaint_id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  KEY `assigned_department_id` (`assigned_department_id`),
  KEY `assigned_to_user_id` (`assigned_to_user_id`),
  KEY `idx_tracking_num` (`tracking_number`),
  CONSTRAINT `fk_complaint_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_complaint_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_complaint_dept` FOREIGN KEY (`assigned_department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_complaint_assigned_user` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `complaint_assignees`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `complaint_assignees`;
CREATE TABLE IF NOT EXISTS `complaint_assignees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `assignee_id` int(11) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `unassigned_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `assignee_id` (`assignee_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `fk_ca_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `complaint_comments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `complaint_comments`;
CREATE TABLE IF NOT EXISTS `complaint_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment_text` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`comment_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_cc_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `complaint_history`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `complaint_history`;
CREATE TABLE IF NOT EXISTS `complaint_history` (
  `history_id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `change_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `fk_ch_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ch_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `complaint_feedback`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `complaint_feedback`;
CREATE TABLE IF NOT EXISTS `complaint_feedback` (
  `feedback_id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`feedback_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_cf_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cf_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `complaint_attachments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `complaint_attachments`;
CREATE TABLE IF NOT EXISTS `complaint_attachments` (
  `attachment_id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attachment_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_ca_attach_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `cms_menus`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cms_menus`;
CREATE TABLE IF NOT EXISTS `cms_menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `path` varchar(255) DEFAULT NULL,
  `icon` text DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `is_section` tinyint(1) DEFAULT 0,
  `is_dropdown` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `fk_menu_parent` FOREIGN KEY (`parent_id`) REFERENCES `cms_menus` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `role_menu_permissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `role_menu_permissions`;
CREATE TABLE IF NOT EXISTS `role_menu_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `can_view` tinyint(1) DEFAULT 1,
  `can_create` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_menu_unique` (`role_id`,`menu_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `fk_rmp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rmp_menu` FOREIGN KEY (`menu_id`) REFERENCES `cms_menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `user_menu_permissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_menu_permissions`;
CREATE TABLE IF NOT EXISTS `user_menu_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `permission_type` enum('allow','deny') NOT NULL DEFAULT 'allow',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_menu_unique` (`user_id`,`menu_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `fk_ump_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ump_menu` FOREIGN KEY (`menu_id`) REFERENCES `cms_menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `active_sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `active_sessions`;
CREATE TABLE IF NOT EXISTS `active_sessions` (
  `user_id` int(11) NOT NULL,
  `jti` varchar(255) NOT NULL,
  `last_activity` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_as_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `approvalhierarchy`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `approvalhierarchy`;
CREATE TABLE IF NOT EXISTS `approvalhierarchy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `step_name` varchar(100) NOT NULL,
  `approver_role` varchar(50) DEFAULT NULL,
  `approver_user_id` int(11) DEFAULT NULL,
  `step_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `approver_user_id` (`approver_user_id`),
  CONSTRAINT `fk_ah_user` FOREIGN KEY (`approver_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `audit_logs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_al_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `blocked_ips`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `blocked_ips`;
CREATE TABLE IF NOT EXISTS `blocked_ips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `blocked_until` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_address` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `contact_messages`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read','replied') DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `subscribers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `subscribers`;
CREATE TABLE IF NOT EXISTS `subscribers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `status` enum('active','unsubscribed') DEFAULT 'active',
  `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `system_settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `revoked_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `revoked_tokens`;
CREATE TABLE IF NOT EXISTS `revoked_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `notifications`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'general',
  `is_read` tinyint(1) DEFAULT 0,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================================
-- SECTION 2: SEED DATA & INITIAL RECORDS
-- ========================================================

--
-- Dumping data for table `roles`
--
INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(2, 'Barber', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(3, 'Customer', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(4, 'Manager', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(5, 'Receptionist', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`), `status` = VALUES(`status`);

--
-- Dumping data for table `organization_types`
--
INSERT INTO `organization_types` (`id`, `name`, `description`, `color`, `level_order`, `created_at`) VALUES
(1, 'CEO', 'Top level organization', 'from-purple-600 to-purple-700', 1, '2025-12-15 13:52:30'),
(2, 'Department', 'Major functional area', 'from-blue-600 to-blue-700', 4, '2025-12-15 13:52:30'),
(3, 'Directorate', 'Sub-division of department', 'from-teal-600 to-teal-700', 3, '2025-12-15 13:52:30'),
(4, 'Division', 'Specific Division', 'from-green-600 to-green-700', 5, '2025-12-15 13:52:30'),
(7, 'Deputy CEO', 'Deputy CEO', 'from-orange-600 to-orange-700', 2, '2025-12-16 07:31:32'),
(8, 'unit', 'unit', 'linear-gradient(to right, #7c3aed, #5b21b6)', 6, '2025-12-16 08:55:42'),
(9, 'Senior Software Developer', 'Senior Software Developer', 'linear-gradient(to right, #e11d48, #9f1239)', 7, '2026-03-19 11:15:29'),
(10, ' Software Developer Specialist', 'Software Developer Specialist', 'from-gray-600 to-gray-700', 8, '2026-03-19 11:16:04'),
(11, ' Software Developer Assistant', ' Software Developer Assistant', 'from-gray-600 to-gray-700', 9, '2026-03-19 11:16:52'),
(12, 'Senior', 'Senior', 'linear-gradient(to right, #4f46e5, #3730a3)', 10, '2026-03-20 05:27:27'),
(13, 'Specialist', 'Specialist', 'linear-gradient(to right, #059669, #065f46)', 11, '2026-03-20 05:27:54'),
(14, 'Assistant', 'Assistant', 'linear-gradient(to right, #0284c7, #075985)', 12, '2026-03-20 05:28:22');

--
-- Dumping data for table `departments`
--
INSERT INTO `departments` (`department_id`, `name`, `description`, `created_at`) VALUES
(1, 'IT', 'Information Technology Department', '2026-01-02 10:25:30'),
(2, 'HR', 'Human Resources', '2026-01-02 10:25:30'),
(3, 'Finance', 'Finance and Accounts', '2026-01-02 10:25:30'),
(4, 'Marketing', 'Marketing and Public Relations', '2026-01-02 10:25:30');

--
-- Dumping data for table `employee_positions`
--
INSERT INTO `employee_positions` (`id`, `employee_id`, `org_node_id`, `is_primary`, `is_delegation`, `created_at`) VALUES
(1, 151, 13, 1, 0, '2026-03-19 11:10:44'),
(2, 151, 15, 0, 1, '2026-03-19 11:11:39'),
(3, 151, 16, 0, 1, '2026-03-19 11:11:50'),
(4, 146, 11, 1, 0, '2026-03-19 11:12:47'),
(5, 149, 52, 1, 0, '2026-03-19 11:21:25'),
(6, 109, 55, 1, 0, '2026-03-20 05:31:29'),
(7, 152, 14, 1, 1, '2026-03-20 05:38:43'),
(8, 152, 17, 0, 1, '2026-03-20 05:39:19'),
(9, 152, 18, 0, 1, '2026-03-20 05:39:35'),
(10, 143, 10, 1, 0, '2026-03-20 05:40:11'),
(11, 142, 9, 1, 0, '2026-03-20 05:41:17'),
(12, 139, 52, 1, 0, '2026-03-20 11:47:21'),
(13, 72, 10, 1, 0, '2026-03-20 14:00:50'),
(14, 146, 14, 1, 0, '2026-03-23 06:56:06'),
(15, 117, 19, 1, 0, '2026-03-23 06:56:06'),
(17, 109, 55, 1, 0, '2026-03-23 08:48:56'),
(18, 139, 26, 1, 0, '2026-03-23 08:48:56');

--
-- Dumping data for table `categories`
--
INSERT IGNORE INTO categories (category_id, category_name, description, status) VALUES
(1, 'Service Quality', 'Issues related to the quality of service provided', 'active'),
(2, 'Staff Behavior', 'Complaints about staff conduct or professionalism', 'active'),
(3, 'Cleanliness & Hygiene', 'Concerns about shop cleanliness and hygiene standards', 'active'),
(4, 'Booking & Scheduling', 'Issues with appointment booking or scheduling', 'active'),
(5, 'Pricing & Billing', 'Concerns about pricing, charges, or billing', 'active'),
(6, 'Wait Time', 'Complaints about excessive waiting times', 'active'),
(7, 'Product Quality', 'Issues with products used during service', 'active'),
(8, 'Other', 'Other complaints not covered by above categories', 'active');

--
-- Dumping data for table `service_categories`
--
INSERT INTO `service_categories` (`id`, `category_name`, `description`, `icon`, `category_icon`, `color`, `sort_order`, `image_url`, `category_image`, `banner_image`, `status`) VALUES
(1, 'Hair Styling & Care', 'Expert haircuts, styling, vibrant coloring, balayage, and restorative hair treatments.', 'fa-scissors', 'fa-scissors', '#ec4899', 1, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80', 'active'),
(2, 'Luxury Facials & Skincare', 'HydraFacials, deep cleansing, anti-aging therapies, and rejuvenating skin peel treatments.', 'fa-spa', 'fa-spa', '#a855f7', 2, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1512290900672-1f486427d11a?auto=format&fit=crop&w=1200&q=80', 'active'),
(3, 'Nail Bar & Pedicure', 'Deluxe spa pedicures, manicures, acrylic sculpting, and long-lasting gel nail art.', 'fa-hand-sparkles', 'fa-hand-sparkles', '#f43f5e', 3, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80', 'active'),
(4, 'Bridal & Glam Makeup', 'Bespoke bridal makeovers, party glam, photoshoot aesthetics, and premium false lash applications.', 'fa-wand-magic-sparkles', 'fa-wand-magic-sparkles', '#d946ef', 4, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80', 'active'),
(5, 'Body Spa & Massages', 'Swedish full-body massage, hot stone relaxation, aromatherapy, and exfoliating body polishes.', 'fa-hot-tub-person', 'fa-hot-tub-person', '#06b6d4', 5, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'active'),
(6, 'Waxing & Brow Sculpting', 'Precision eyebrow threading, tinting, and gentle silky full-body waxing services.', 'fa-feather', 'fa-feather', '#eab308', 6, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80', 'active'),
(7, 'Gentlemen Grooming', 'Classic skin fades, beard sculpt & contouring, and royal hot-towel steam shave treatments.', 'fa-crown', 'fa-crown', '#3b82f6', 7, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80', 'active')
ON DUPLICATE KEY UPDATE
  category_name = VALUES(category_name),
  description = VALUES(description),
  icon = VALUES(icon),
  category_icon = VALUES(category_icon),
  color = VALUES(color),
  sort_order = VALUES(sort_order),
  image_url = VALUES(image_url),
  category_image = VALUES(category_image),
  banner_image = VALUES(banner_image),
  status = VALUES(status);

--
-- Dumping data for table `employees`
--
INSERT INTO `employees` (`employee_id`, `name`, `role_id`, `department_id`, `supervisor_id`, `fname`, `lname`, `email`, `phone`, `sex`) VALUES
(21, 'www www', 1, 1, NULL, 'hayal', 'tamrat', NULL, '0916048977', NULL),
(34, 'hayaltame', NULL, 2, 21, 'ggg', 'ggg', 'beki@gmail.com', '0934556621', 'F'),
(36, 'hayaltame', NULL, 2, 0, 'some', 'one', 'bekeei@gmail.com', '0934556621', 'M'),
(37, 'hayaltame111', 1, NULL, NULL, 'some11', 'tame', 'oneq@gmail.com', '0934556688', 'M'),
(38, 'hayaltame3333', 1, NULL, NULL, 'aaa', 'a', 'one1a111@gmail.com', '0934556111', 'M'),
(39, 'hayaltame1114444', 1, NULL, NULL, 'some00', 'one11', 'one222@gmail.com', '0934556688', 'M'),
(40, 'hayaltame1114444444', 1, NULL, NULL, 'yeab444', 'one4444', 'beki444@gmail.com', '0934556444', 'M'),
(41, 'hayaltame444', 1, NULL, NULL, 'yeabeee', 'eeee', 'eeeee@gmail.com', '0934556644', 'M'),
(43, 'rtttttt44', 1, NULL, NULL, 'yeabeee', 'eeee', 'eeee44e@gmail.com', '0934556677', 'M'),
(45, 'tttttttttttt111', 1, NULL, NULL, 'yeabrrr', 'tamer', 'onerrr@gmail.com', '0934556655', 'M'),
(46, 'bekele woya', 8, NULL, NULL, 'bekele', 'woya', 'woya@gmail.com', '0933499094', 'M'),
(47, 'admin admin', 1, 2, 1, 'admin', 'admin', 'admin@email.com', '123-456-7890', 'M'),
(48, 'hylt', 8, NULL, 0, 'hl', 'tm', 'hl@gmail.com', '0934556644', 'M'),
(49, 'yonas', 2, NULL, NULL, 'yonas', 'ceo', 'yonas@itp.org', '0933499093', 'M'),
(50, 'simegn', 5, 2, 49, 'geter', 'geter', 'simegn@itp.org', '0933499094', 'M'),
(51, 'hayal@itp.org', 8, 2, 50, 'hayal', 'hayal', 'hayal@itp.org', '0933499097', 'M'),
(54, 'hayalt@itp.org', 8, 2, 0, 'hayalt', 'hayalt', 'hayalt@itp.org', '0933499097', 'M'),
(55, 'abebe', 4, NULL, 0, 'abebe', 'abe', 'abe@itp.et', '0934556624', 'M'),
(56, '333333333', 4, 2, 49, 'some00333333', 'one333333', 'beki33333333333@gmail.com', '0934556333', 'M'),
(57, 'staf', 8, 2, 56, 'staf', 'staf', 'staf@gmail.com', '0934556688', 'M'),
(58, 'nebyat', 6, 2, 50, 'nebyat', 'nebyat', 'nebyat@itp.et', '093455444', 'F'),
(59, 'ewunetu', 7, 2, 58, 'ewunetu', 'ewunetu', 'ewunetu@itp.et', '0934556453', 'M'),
(60, 'general', 3, NULL, 49, 'general', 'manager', 'manager@itp.et', '0933499366', 'M'),
(62, 'staf1', 8, 2, 66, 'staf1', 'staf1', 'staf1@itp.et', '0934556688', 'M'),
(63, 'hayalta4444', 6, 2, 50, 'some', 'one', 'berrrrrki@gmail.com', '0934556555', 'M'),
(64, 'yeabeeeee', 1, NULL, NULL, 'some', 'one', 'eeee@gmail.com', '0934556688', 'M'),
(65, 'team leader', 7, 2, 58, 'teaml', 'teaml', 'teaml@gmail.com', '09373773333', 'M'),
(66, 'team leader', 7, 2, 58, 'teamleader', 'teamleader', 'teamleader@gmail.com', '09373773333', 'M'),
(67, 'hayal', 1, NULL, NULL, 'hayal', 'tamrat', 'hayal@itp.it', '0916048977', 'M'),
(68, 'hayal', 8, 2, 65, 'hayal', 'tamrat', 'hayalt@itp.it', '0916048977', 'M'),
(69, 'registrar@gmail.com', 5, NULL, NULL, 'registrar', 'registrar', 'registrar@gmail.com', '0916048977', 'M'),
(70, 'Nathan', 1, NULL, NULL, 'Hayal', 'Girum', 'nathan@itp.et', '0976180462', 'M'),
(71, 'Hayal Tamrat Girum', 3, NULL, NULL, 'Hayal', 'Girum', 'hayal@gmai.com', '0976180462', 'M'),
(72, 'nathay tamrat', 5, NULL, 70, 'hayal', 'tamrat', 'regist@bus.com', '0916048977', 'M'),
(73, 'hayal tamrat', 1, NULL, NULL, 'nathay', 'tamrat', 'astu@nathayblog.com', '0916048977', 'M'),
(75, 'hayal tamrat', 4, NULL, 70, 'nathay', 'tamrat', 'hager@temechain.com', '0916048977', 'M'),
(78, 'hayal tamrat', 4, NULL, 70, 'nathay', 'tamrat', 'hager1@temechain.com', '0916048977', 'M'),
(82, 'hayal tamrat', 4, 1, 49, 'hayal', 'tamrat', 'hager22@temechain.com', '0916048977', 'M'),
(83, 'Hayal Tamrat', 5, NULL, NULL, 'Hayal', 'Tamrat', 'Hayalt@hu.edu.et', '0916048977', 'M'),
(84, 'Hayal ', 1, NULL, NULL, 'Nathay ', 'Nathay ', 'Nathantamrat50@gmail.com', '90188837377', 'M'),
(85, 'nathay tamrat', 5, NULL, NULL, 'nathay', 'tamrat', 'astu@nathayblog.et', '0916048977', 'M'),
(86, 'agent', 6, 1, 50, 'test', 'some one', 'agent@lonche.com', 'itp@123', 'M'),
(87, 'hayal tamrat', 1, 1, NULL, 'hayal', 'tamrat', 'hayaltamrat@gmail.com', '+25191222112', NULL),
(88, 'yossef knfe', 4, 2, NULL, 'yossef', 'knfe', 'yosef@gmail.com', '0913566735', NULL),
(89, 'test21 test21', 3, 1, NULL, 'test21', 'test21', 'test21@gmail.com', '', NULL),
(90, 'Hayal Tamrat', 1, 1, NULL, 'Hayal', 'Tamrat', 'kidoastu1993@gmail.com', '0913566735', NULL),
(91, 'nathan tame', 1, 1, NULL, 'nathan', 'tame', 'hayaltamrat3@gmail.com', '0909090909', NULL),
(92, 'test admin', 1, 1, NULL, 'test', 'admin', 'testadmin@gmail.com', '0913566735', NULL),
(93, 'test hr', 4, 2, NULL, 'test', 'hr', 'testhr@gmail.com', '', NULL),
(94, 'test Leasing', 0, 1, NULL, 'test', 'Leasing', 'testleasing@gmail.com', '0913566735', NULL),
(95, 'test conten', 3, 1, NULL, 'test', 'conten', 'testcontent@gmail.com', '0913566735', NULL),
(96, 'test event', 5, 1, NULL, 'test', 'event', 'testevent@gmail.com', '0913566735', NULL),
(97, 'test follow_up', 2, 1, NULL, 'test', 'follow_up', 'testfollowup@gmail.com', '0913566735', NULL),
(98, 'content tets1', 3, 1, NULL, 'content', 'tets1', 'contenttest1@gmail.com', '0917266671', NULL),
(99, 'test test', 1, 1, NULL, 'test', 'test', 'test@gmail.com', '98893219831298', NULL),
(100, 'Security Auditor', 1, 1, NULL, 'Security', 'Auditor', 'audit_1771417756741@example.com', '0900000000', NULL),
(5000, 'Security Auditor', 1, 1, NULL, 'Security', 'Auditor', 'audit_1771418828658@example.com', '0900000000', NULL),
(5001, 'Security Auditor', 1, 1, NULL, 'Security', 'Auditor', 'audit_1771419160931@example.com', '0900000000', NULL),
(5002, 'tets tets', 4, 2, NULL, 'tets', 'tets', 'tets113@gmail.com', '0917122712', NULL),
(5003, 'contet contet', 3, 1, NULL, 'contet', 'contet', 'contet1@gmail.com', '+251913566735', NULL);

--
-- Dumping data for table `users`
--
INSERT IGNORE INTO `users` (`user_id`, `employee_id`, `user_name`, `password`, `role_id`, `status`, `online_flag`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 1, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(2, 2, 'barber1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 2, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(3, 3, 'customer1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 3, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(4, 4, 'manager1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 4, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(5, 5, 'receptionist1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 5, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00')
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`), `status` = VALUES(`status`);

--
-- Dumping data for table `organization_structure`
--
INSERT INTO `organization_structure` (`id`, `name`, `name_amharic`, `type`, `parent_id`, `level`, `description`, `head_employee_id`, `status`, `created_at`, `updated_at`) VALUES
(9, 'CEO', 'CEO', 'CEO', NULL, 1, 'CEO', NULL, 'active', '2025-12-16 07:33:36', '2025-12-16 07:33:36'),
(10, 'Deputy CEO', 'Deputy CEO', 'Deputy CEO', 9, 2, 'Deputy CEO', NULL, 'active', '2025-12-16 07:34:14', '2025-12-16 07:34:14'),
(11, 'IT Directorate', 'IT Directorate', 'Directorate', 10, 3, 'IT Directorate', NULL, 'active', '2025-12-16 07:35:17', '2025-12-16 07:35:17'),
(12, 'Constraction  Directorate', 'Constraction  Directorate', 'Directorate', 10, 3, 'Constraction  Directorate', NULL, 'active', '2025-12-16 07:35:45', '2025-12-16 07:35:45'),
(13, 'Inovation and Encubation Department', 'Inovation and Encubation Department', 'Department', 11, 4, 'Inovation and Encubation Department', NULL, 'active', '2025-12-16 07:39:08', '2025-12-16 07:39:08'),
(14, 'Digital Service and Infrastructure Devevelopment', 'Digital Service and Infrastructure Devevelopment', 'Department', 11, 4, 'Digital Service and Infrastructure Devevelopment', NULL, 'active', '2025-12-16 07:40:31', '2025-12-16 07:40:31'),
(15, 'Reaserch Section ', 'Reaserch Section ', 'Section', 13, 5, 'Reaserch Section ', NULL, 'active', '2025-12-16 07:41:09', '2025-12-16 07:41:09'),
(16, 'Encubation Section ', 'Encubation Section ', 'Section', 13, 5, 'Encubation Section ', NULL, 'active', '2025-12-16 07:41:37', '2025-12-16 07:41:37'),
(17, 'Network and Infrastructure ', 'Network and Infrastructure ', 'Section', 14, 5, 'Network and Infrastructure ', NULL, 'active', '2025-12-16 07:42:18', '2025-12-16 07:42:18'),
(18, 'Software development', 'Software development', 'Section', 14, 5, 'Software development', NULL, 'active', '2025-12-16 07:43:06', '2025-12-16 07:43:06'),
(19, 'Ciyber Security ', 'Ciyber Security ', 'Section', 14, 5, 'Ciyber Security ', NULL, 'active', '2025-12-16 07:43:29', '2025-12-16 07:43:29'),
(20, 'Construction and Design ', 'Construction and Design ', 'Department', 12, 4, 'Construction and Design ', NULL, 'active', '2025-12-16 07:45:58', '2025-12-16 07:45:58'),
(21, 'Construction ', 'Construction', 'Section', 20, 5, 'Construction', NULL, 'active', '2025-12-16 07:46:29', '2025-12-16 07:46:29'),
(22, 'Design ', 'Design', 'Section', 20, 5, 'Design Section ', NULL, 'active', '2025-12-16 07:46:51', '2025-12-16 07:46:51'),
(24, 'Land and Office Managment', 'Land and Office Managment', 'Department', 12, 4, 'Land and Office Managment', NULL, 'active', '2025-12-16 07:49:24', '2025-12-16 07:49:24'),
(25, 'Utilities and service ', 'Utilities and service ', 'Department', 12, 4, 'Utilities and service ', NULL, 'active', '2025-12-16 07:50:30', '2025-12-16 07:50:30'),
(26, 'Enviroment and Greenery ', 'Enviroment and Greenery ', 'Department', 12, 4, 'Enviroment and Greenery ', NULL, 'active', '2025-12-16 07:51:34', '2025-12-16 07:51:34'),
(27, 'Markating ', 'Markating ', 'Department', 10, 3, 'Markating Department', NULL, 'active', '2025-12-16 07:54:07', '2025-12-16 07:54:07'),
(28, 'Markating and Sales ', 'Markating and Sales ', 'Section', 27, 4, 'Markating and Sales ', NULL, 'active', '2025-12-16 07:54:49', '2025-12-16 07:54:49'),
(29, 'Investor Support', 'Investor Support', 'Section', 27, 4, 'Investor Support', NULL, 'active', '2025-12-16 07:55:18', '2025-12-16 07:55:18'),
(30, 'Bussines Development and Support', 'Bussines Development and Support', 'Section', 27, 4, 'Bussines Development and Support', NULL, 'active', '2025-12-16 07:56:02', '2025-12-16 07:56:02'),
(31, 'Corporate Adminstration Directorate', 'Corporate Adminstration Directorate', 'Directorate', 9, 2, 'Corporate Adminstration Directorate', NULL, 'active', '2025-12-16 07:57:02', '2025-12-16 07:57:25'),
(32, 'Finance Department', 'Finance Department', 'Department', 31, 3, 'Finance Department', NULL, 'active', '2025-12-16 07:58:00', '2025-12-16 07:58:00'),
(33, 'HR Department', 'HR Department', 'Department', 31, 3, 'HR Department', NULL, 'active', '2025-12-16 07:58:22', '2025-12-16 07:58:22'),
(34, 'Procrument and Resource Admin', 'Procrument and Resource Admin', 'Department', 31, 3, 'Procrument and Resource Admin', NULL, 'active', '2025-12-16 07:59:08', '2025-12-16 07:59:08'),
(35, 'Income and Cost Section ', 'Income and Cost Section ', 'Section', 32, 4, 'Income and Cost Section ', NULL, 'active', '2025-12-16 08:00:55', '2025-12-16 08:00:55'),
(36, 'Budget Section ', 'Budget Section ', 'Section', 32, 4, 'Budget Section ', NULL, 'active', '2025-12-16 08:02:21', '2025-12-16 08:02:21'),
(37, 'Procrument Section ', 'Procrument Section ', 'Section', 34, 4, 'Procrument Section ', NULL, 'active', '2025-12-16 08:02:56', '2025-12-16 08:03:46'),
(38, 'Inventory Admin', 'Inventory Admin', 'Section', 34, 4, 'Inventory Admin', NULL, 'active', '2025-12-16 08:02:58', '2025-12-16 08:04:30'),
(39, 'General Service ', 'General Service ', 'Section', 34, 4, 'General Service ', NULL, 'active', '2025-12-16 08:05:25', '2025-12-16 08:05:25'),
(40, 'HR Admin ', 'HR Admin ', 'Section', 33, 4, 'HR Admin ', NULL, 'active', '2025-12-16 08:06:04', '2025-12-16 08:06:04'),
(41, 'Training and HR development', 'Training and HR development', 'Section', 33, 4, 'Training and HR development', NULL, 'active', '2025-12-16 08:06:49', '2025-12-16 08:06:49'),
(42, 'Security ', 'Security ', 'Department', 9, 2, NULL, NULL, 'active', '2025-12-16 08:53:00', '2025-12-16 08:53:00'),
(43, 'CEO Office Addmistration ', 'CEO Office Addmistration ', 'Department', 9, 2, NULL, NULL, 'active', '2025-12-16 08:53:55', '2025-12-16 08:53:55'),
(44, 'Law Department', 'Law Department', 'Department', 9, 2, NULL, NULL, 'active', '2025-12-16 08:54:21', '2025-12-16 08:54:35'),
(45, 'Strategic Advisor', 'Strategic Advisor', 'unit', 9, 2, NULL, NULL, 'active', '2025-12-16 08:56:27', '2025-12-16 08:57:07'),
(46, 'Law Service ', 'Law Service ', 'Section', 44, 3, NULL, NULL, 'active', '2025-12-16 08:58:26', '2025-12-16 08:58:26'),
(47, 'Complaice Section ', 'Complaice Section ', 'Section', 44, 3, NULL, NULL, 'active', '2025-12-16 08:58:47', '2025-12-16 08:58:47'),
(48, 'Auditor', 'Auditor', 'Section', 9, 2, NULL, NULL, 'active', '2025-12-16 08:59:47', '2025-12-16 08:59:47'),
(49, 'Corporation Communication Section ', 'Corporation Communication Section ', 'Section', 9, 2, NULL, NULL, 'active', '2025-12-16 09:00:36', '2025-12-16 09:00:36'),
(50, 'Plan and followup ', 'Plan and followup ', 'Section', 9, 2, NULL, NULL, 'active', '2025-12-16 09:01:49', '2025-12-16 09:01:49'),
(51, 'Senior', 'Senior', 'Senior Software Developer', 18, 6, NULL, NULL, 'active', '2026-03-19 11:18:02', '2026-03-19 11:18:02'),
(52, 'Specialist', 'Specialist', ' Software Developer Specialist', 18, 6, NULL, NULL, 'active', '2026-03-19 11:18:31', '2026-03-19 11:18:31'),
(53, 'Assistant', 'Assistant', ' Software Developer Assistant', 18, 6, NULL, NULL, 'active', '2026-03-19 11:18:52', '2026-03-19 11:18:52'),
(54, 'Senior System admin', 'Senior System admin', 'Senior', 17, 6, NULL, NULL, 'active', '2026-03-20 05:29:38', '2026-03-20 05:29:38'),
(55, ' System admin Specialist', ' System admin Specialist', 'Specialist', 17, 6, NULL, NULL, 'active', '2026-03-20 05:30:06', '2026-03-20 05:30:06'),
(56, ' System admin Asistant', ' System admin Asistant', 'Assistant', 17, 6, NULL, NULL, 'active', '2026-03-20 05:30:31', '2026-03-20 05:30:31');

--
-- Dumping data for table `services`
--
INSERT INTO `services` (
    `id`, `category_id`, `service_name`, `service_slug`, `short_description`, `description`,
    `price`, `discount_price`, `duration`, `duration_minutes`, `is_available`, `status`,
    `is_featured`, `rating_avg`, `rating_count`, `image_url`, `service_image`, `banner_image`,
    `service_icon`, `service_type`
) VALUES
(1, 1, 'Signature Blowout & Styling', 'signature-blowout-styling',
 'Volumizing wash, deep conditioning scalp massage, and red-carpet blowout styling.',
 'Indulge in our salon signature blowout. Begins with an invigorating organic hair bath, conditioning scalp massage, and finished with a blowout that leaves hair silky, radiant, and bouncing with volume.',
 450.00, 380.00, 45, 45, 1, 'active', 1, 4.90, 24,
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
 'fa-wind', 'hair'),

(2, 1, 'Balayage & Color Glossing', 'balayage-color-glossing',
 'Hand-painted sun-kissed dimension with a nourishing gloss tone sealant.',
 'Custom hand-painted French balayage highlights designed to enhance your natural tones with zero harsh demarcation lines. Includes a restorative bond builder and high-shine gloss toner.',
 1800.00, 1550.00, 120, 120, 1, 'active', 1, 5.00, 18,
 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
 'fa-palette', 'hair'),

(3, 2, 'Hydra-Glow Deep Cleansing Facial', 'hydra-glow-facial',
 'Vortex suction infusion with hyaluronic acid, LED light therapy, and detox massage.',
 'A non-invasive, multi-step treatment that combines the benefits of next-level hydra-dermabrasion, a chemical peel, automated painless extractions, and a special delivery of Antioxidants and Hyaluronic Acid for instantly glowing skin.',
 950.00, 850.00, 60, 60, 1, 'active', 1, 4.95, 32,
 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1512290900672-1f486427d11a?auto=format&fit=crop&w=1200&q=80',
 'fa-droplet', 'skincare'),

(4, 3, 'Deluxe Rosewater Pedicure & Gel Manicure', 'deluxe-pedicure-gel-manicure',
 'Organic rose petal foot bath, callus smoothing, massage, and chip-resistant gel polish.',
 'Pure relaxation for hands and feet. Featuring a warm rose petal foot bath, organic sugar scrub exfoliation, hot towel wrap, hydrating paraffin dip, and high-shine LED gel manicure with custom nail art accent.',
 750.00, 680.00, 75, 75, 1, 'active', 1, 4.88, 19,
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
 'fa-hand-sparkles', 'nails'),

(5, 4, 'Royal Bridal Makeover Package', 'royal-bridal-makeover',
 'Complete high-definition bridal makeup, couture hairstyling, mink lashes, and veil setting.',
 'Our premier VIP bridal beauty experience. Includes skin prep, airbrush or high-definition bridal makeup contouring, custom false lashes, bridal hairstyling with jewelry/veil pinning, and a touch-up emergency kit.',
 3200.00, 2900.00, 150, 150, 1, 'active', 1, 5.00, 15,
 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
 'fa-heart', 'bridal'),

(6, 5, 'Swedish Aromatherapy Relaxing Massage', 'swedish-aromatherapy-massage',
 'Full-body stress relief using organic botanical essential oils and warm compress.',
 'Melt away everyday tension and fatigue with a full-body rhythmic Swedish massage. Uses warm aromatic botanical oils, long fluid strokes, and pressure-point techniques to restore muscular ease and serenity.',
 1100.00, 950.00, 60, 60, 1, 'active', 1, 4.92, 27,
 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
 'fa-spa', 'spa'),

(7, 7, 'VIP Royal Gentleman Cut & Hot Towel Shave', 'vip-royal-gentleman-cut-shave',
 'Precision scissor/clipper haircut, warm steam lather shave, and cold stone tonic splash.',
 'The definitive gentlemen grooming ritual. Features an architected haircut, straight-razor neck line, hot herbal steam towels, pre-shave essential oils, straight-razor shave, and an ice-cold tonic skin soothing splash.',
 650.00, 550.00, 60, 60, 1, 'active', 1, 4.96, 41,
 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
 'fa-crown', 'barber')
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  service_name = VALUES(service_name),
  short_description = VALUES(short_description),
  description = VALUES(description),
  price = VALUES(price),
  discount_price = VALUES(discount_price),
  duration = VALUES(duration),
  duration_minutes = VALUES(duration_minutes),
  is_available = VALUES(is_available),
  status = VALUES(status),
  is_featured = VALUES(is_featured),
  rating_avg = VALUES(rating_avg),
  rating_count = VALUES(rating_count),
  image_url = VALUES(image_url),
  service_image = VALUES(service_image),
  banner_image = VALUES(banner_image),
  service_icon = VALUES(service_icon),
  service_type = VALUES(service_type);

--
-- Dumping data for table `service_ratings`
--
INSERT INTO `service_ratings` (`id`, `service_id`, `user_id`, `customer_id`, `rating`, `review`, `review_text`, `created_at`) VALUES
(1, 3, 9004, 9004, 5, 'Absolute glow! My skin has never looked so fresh and radiant.', 'Absolute glow! My skin has never looked so fresh and radiant.', NOW()),
(2, 1, 9004, 9004, 5, 'Fantastic styling and head massage, lasted for 3 full days.', 'Fantastic styling and head massage, lasted for 3 full days.', NOW()),
(3, 6, 9004, 9004, 5, 'Incredible deep relaxation. Highly recommend the lavender essential oil.', 'Incredible deep relaxation. Highly recommend the lavender essential oil.', NOW()),
(4, 4, 9004, 9004, 5, 'Flawless nail art and super soothing rosewater bath!', 'Flawless nail art and super soothing rosewater bath!', NOW())
ON DUPLICATE KEY UPDATE
  rating = VALUES(rating),
  review = VALUES(review),
  review_text = VALUES(review_text);

--
-- Dumping data for table `workflow_state_rules`
--
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

--
-- Dumping data for table `cms_menus`
--
INSERT INTO `cms_menus` (`id`, `title`, `path`, `icon`, `color`, `parent_id`, `order_index`, `is_section`, `is_dropdown`, `is_active`) VALUES
(0, 'Component Library', '/admin/components', '<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z\" /></svg>', 'violet', 7, 83, 0, 0, 1),
(1, 'App', NULL, NULL, 'blue', NULL, 10, 1, 0, 1),
(4, 'Interaction', '', '', 'blue', NULL, 40, 1, 0, 1),
(5, 'Appearance', NULL, NULL, 'blue', NULL, 50, 1, 0, 1),
(6, 'Users', NULL, NULL, 'blue', NULL, 60, 1, 0, 1),
(7, 'Settings', '', '', 'blue', NULL, 70, 1, 0, 0),
(8, 'Dashboard', '/dashboard', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z\" /></svg>', 'blue', 1, 11, 0, 1, 1),
(9, 'Overview', '/dashboard/overview', NULL, 'blue', 8, 1, 0, 0, 1),
(10, 'Analytics', '/dashboard/analytics', NULL, 'blue', 8, 2, 0, 0, 1),
(11, 'Posts', '/content/posts', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z\" /></svg>', 'emerald', 2, 21, 0, 1, 1),
(12, 'Add Posts', '/content/posts', '', 'blue', 11, 1, 0, 0, 1),
(13, 'Manage Posts', '/post/managePosts', NULL, 'blue', 11, 2, 0, 0, 1),
(14, 'Gallery', '/post/gallery', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" /></svg>', 'amber', 2, 22, 0, 1, 1),
(15, 'Gallery Managmet', '/post/gallery', '', 'blue', 14, 1, 0, 0, 1),
(16, 'Manage Gallery', '/post/manageGallery', NULL, 'blue', 14, 2, 0, 0, 0),
(17, 'Pages', '/content/pages', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z\" /></svg>', 'indigo', 2, 23, 0, 0, 0),
(18, 'Categories', '/content/categories', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z\" /></svg>', 'orange', 2, 24, 0, 0, 0),
(19, 'Tags', '/content/tags', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z\" /></svg>', 'pink', 2, 25, 0, 0, 0),
(20, 'Offices', '/content/offices', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4\" /></svg>', 'cyan', 2, 26, 0, 0, 1),
(21, 'Leased Lands', '/content/leased-lands', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 114 0 2 2 0 002 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" /></svg>', 'green', 2, 27, 0, 0, 1),
(22, 'Live Events', '/content/live-events', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'red', 2, 28, 0, 0, 1),
(23, 'Careers', '/content/careers', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'blue', 2, 29, 0, 0, 1),
(24, 'Partners & Investors', '/content/partners-investors', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" /></svg>', 'violet', 2, 30, 0, 0, 1),
(25, 'Incubation', '/content/incubation', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 10V3L4 14h7v7l9-11h-7z\" /></svg>', 'blue', 2, 31, 0, 0, 1),
(26, 'Trainings', '/content/trainings', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253\" /></svg>', 'amber', 2, 32, 0, 0, 1),
(27, 'Investment Steps', '/content/investment-steps', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\" /></svg>', 'teal', 2, 33, 0, 0, 1),
(28, 'Board Members', '/content/board-members', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z\" /></svg>', 'purple', 2, 34, 0, 0, 1),
(29, 'Who We Are', '/content/who-we-are', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" /></svg>', 'indigo', 2, 35, 0, 0, 1),
(30, 'Library', '/media/library', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10\" /></svg>', 'purple', 3, 41, 0, 0, 0),
(32, 'Contact', '/interaction/contact', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'blue', 4, 51, 0, 1, 0),
(34, 'Contact Inbox', '/interaction/contact-messages', '', 'blue', 4, 1, 0, 0, 1),
(36, 'Manage Forms', '/interaction/forms/manage', NULL, 'blue', 33, 1, 0, 0, 1),
(37, 'Submissions', '/interaction/forms/submissions', NULL, 'blue', 33, 2, 0, 0, 1),
(39, 'Menus', '/appearance/menus', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 6h16M4 12h16M4 18h16\" /></svg>', 'rose', 5, 61, 0, 0, 1),
(40, 'Theme', '/appearance/theme-settings', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\" /></svg>', 'violet', 5, 62, 0, 0, 1),
(41, 'Users', '/users/all', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z\" /></svg>', 'lime', 6, 71, 0, 0, 1),
(42, 'Add User', '/users/add', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z\" /></svg>', 'sky', 6, 72, 0, 0, 1),
(43, 'Subscribers', '/users/subscribers', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 'fuchsia', 6, 73, 0, 0, 1),
(44, 'Settings', '/settings/general', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z\" /><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 12a3 3 0 11-6 0 3 3 0 016 0z\" /></svg>', 'slate', 7, 81, 0, 0, 1),
(45, 'Audit Logs', '/settings/audit-logs', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\" /></svg>', 'red', 7, 82, 0, 0, 1),
(46, 'Roles & Permissions', '/users/roles', '<svg className=\"w-5 h-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z\" /></svg>', 'indigo', 6, 74, 0, 0, 1);

INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES (100, 'Services', NULL, NULL, 'blue', NULL, 30, 1, 0, 1);

INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES 
(101, 'Categories', '/services/categories', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>', 
    'blue', 100, 31, 0, 0, 1),

(102, 'All Services', '/services', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.952-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', 
    'emerald', 100, 32, 0, 0, 1),

(103, 'Add Service', '/services/add', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>', 
    'green', 100, 33, 0, 0, 1);

INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES (110, 'Bookings', NULL, NULL, 'purple', NULL, 40, 1, 0, 1);

INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
VALUES 
(111, 'Pending Review', '/bookings/pending', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', 
    'orange', 110, 41, 0, 0, 1),

(112, 'All Bookings', '/bookings', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>', 
    'blue', 110, 42, 0, 0, 1),

(113, 'Queue Management', '/queue', 
    '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>', 
    'purple', 110, 43, 0, 0, 1);

--
-- Dumping data for table `role_menu_permissions`
--
INSERT INTO `role_menu_permissions` (`role_id`, `menu_id`, `can_view`, `can_create`, `can_edit`, `can_delete`) VALUES
(0, 8, 1, 0, 0, 0),
(0, 9, 1, 0, 0, 0),
(0, 10, 1, 0, 0, 0),
(0, 20, 1, 0, 0, 0),
(0, 21, 1, 0, 0, 0),
(1, 0, 1, 0, 0, 0),
(1, 1, 1, 0, 0, 0),
(1, 2, 1, 0, 0, 0),
(1, 3, 1, 0, 0, 0),
(1, 4, 1, 0, 0, 0),
(1, 5, 1, 0, 0, 0),
(1, 6, 1, 0, 0, 0),
(1, 7, 1, 0, 0, 0),
(1, 8, 1, 0, 0, 0),
(1, 9, 1, 0, 0, 0),
(1, 10, 1, 0, 0, 0),
(1, 11, 1, 0, 0, 0),
(1, 12, 1, 0, 0, 0),
(1, 13, 1, 0, 0, 0),
(1, 14, 1, 0, 0, 0),
(1, 15, 1, 0, 0, 0),
(1, 16, 1, 0, 0, 0),
(1, 20, 1, 0, 0, 0),
(1, 21, 1, 0, 0, 0),
(1, 22, 1, 0, 0, 0),
(1, 23, 1, 0, 0, 0),
(1, 24, 1, 0, 0, 0),
(1, 25, 1, 0, 0, 0),
(1, 26, 1, 0, 0, 0),
(1, 27, 1, 0, 0, 0),
(1, 28, 1, 0, 0, 0),
(1, 29, 1, 0, 0, 0),
(1, 32, 1, 0, 0, 0),
(1, 34, 1, 0, 0, 0),
(1, 35, 1, 0, 0, 0),
(1, 38, 1, 0, 0, 0),
(1, 39, 1, 0, 0, 0),
(1, 41, 1, 0, 0, 0),
(1, 42, 1, 0, 0, 0),
(1, 43, 1, 0, 0, 0),
(1, 45, 1, 0, 0, 0),
(1, 46, 1, 0, 0, 0),
(1, 47, 1, 0, 0, 0),
(2, 4, 1, 0, 0, 0),
(2, 8, 1, 0, 0, 0),
(2, 9, 1, 0, 0, 0),
(2, 10, 1, 0, 0, 0),
(2, 34, 1, 0, 0, 0),
(2, 35, 1, 0, 0, 0),
(3, 8, 1, 0, 0, 0),
(3, 9, 1, 0, 0, 0),
(3, 10, 1, 0, 0, 0),
(3, 12, 1, 0, 0, 0),
(3, 13, 1, 0, 0, 0),
(3, 14, 1, 0, 0, 0),
(3, 15, 1, 0, 0, 0),
(3, 16, 1, 0, 0, 0),
(4, 0, 1, 0, 0, 0),
(4, 8, 1, 0, 0, 0),
(4, 9, 1, 0, 0, 0),
(4, 10, 1, 0, 0, 0),
(4, 23, 1, 0, 0, 0),
(4, 47, 1, 0, 0, 0),
(5, 8, 1, 0, 0, 0),
(5, 9, 1, 0, 0, 0),
(5, 10, 1, 0, 0, 0),
(5, 22, 1, 0, 0, 0);

INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(1, 100, 1, 0, 0, 0),
(1, 101, 1, 1, 1, 1),
(1, 102, 1, 1, 1, 1),
(1, 103, 1, 1, 0, 0),
-- Bookings Section
(1, 110, 1, 0, 0, 0),
(1, 111, 1, 1, 1, 1),
(1, 112, 1, 1, 1, 1),
(1, 113, 1, 1, 1, 1);

INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(4, 100, 1, 0, 0, 0),
(4, 101, 1, 1, 1, 1),
(4, 102, 1, 1, 1, 1),
(4, 103, 1, 1, 0, 0),
-- Bookings Section
(4, 110, 1, 0, 0, 0),
(4, 111, 1, 1, 1, 0),
(4, 112, 1, 1, 1, 0),
(4, 113, 1, 1, 1, 0);

INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(2, 100, 1, 0, 0, 0),
(2, 101, 1, 0, 0, 0),
(2, 102, 1, 0, 0, 0),
-- Bookings Section
(2, 110, 1, 0, 0, 0),
(2, 112, 1, 0, 0, 0),
(2, 113, 1, 0, 0, 0);

INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section
(5, 100, 1, 0, 0, 0),
(5, 101, 1, 0, 0, 0),
(5, 102, 1, 0, 0, 0),
-- Bookings Section
(5, 110, 1, 0, 0, 0),
(5, 111, 1, 1, 1, 0),
(5, 112, 1, 1, 1, 0),
(5, 113, 1, 1, 1, 0);

INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES
-- Services Section (view only)
(3, 100, 1, 0, 0, 0),
(3, 102, 1, 0, 0, 0);

--
-- Dumping data for table `user_menu_permissions`
--
INSERT INTO `user_menu_permissions` (`user_id`, `menu_id`, `permission_type`) VALUES
(0, 4, 'allow'),
(0, 7, 'allow'),
(0, 9, 'allow'),
(0, 10, 'allow'),
(0, 12, 'allow'),
(0, 13, 'allow'),
(0, 15, 'allow'),
(0, 26, 'allow'),
(0, 27, 'allow'),
(0, 28, 'allow'),
(0, 29, 'allow'),
(0, 34, 'allow'),
(0, 36, 'allow'),
(0, 39, 'allow'),
(0, 40, 'allow'),
(0, 41, 'allow'),
(0, 42, 'allow'),
(0, 43, 'allow'),
(0, 44, 'allow'),
(0, 45, 'allow'),
(0, 46, 'allow'),
(34, 1, 'deny'),
(34, 2, 'deny'),
(34, 3, 'deny'),
(34, 4, 'deny'),
(34, 5, 'deny'),
(34, 6, 'deny'),
(34, 7, 'deny'),
(34, 8, 'deny'),
(34, 9, 'allow'),
(34, 10, 'deny'),
(34, 11, 'deny'),
(34, 12, 'allow'),
(34, 13, 'deny'),
(34, 14, 'deny'),
(34, 15, 'allow'),
(34, 16, 'deny'),
(34, 17, 'deny'),
(34, 18, 'deny'),
(34, 19, 'deny'),
(34, 20, 'deny'),
(34, 21, 'deny'),
(34, 22, 'deny'),
(34, 24, 'deny'),
(34, 25, 'deny'),
(34, 26, 'deny'),
(34, 27, 'deny'),
(34, 28, 'deny'),
(34, 29, 'deny'),
(34, 30, 'deny'),
(34, 32, 'deny'),
(34, 33, 'deny'),
(34, 34, 'allow'),
(34, 35, 'deny'),
(34, 36, 'deny'),
(34, 37, 'deny'),
(34, 38, 'deny'),
(34, 39, 'deny'),
(34, 40, 'deny'),
(34, 41, 'deny'),
(34, 42, 'deny'),
(34, 43, 'deny'),
(34, 44, 'deny'),
(34, 45, 'deny'),
(34, 46, 'deny'),
(36, 23, 'allow'),
(81, 12, 'allow'),
(81, 13, 'allow'),
(81, 15, 'allow'),
(81, 16, 'allow'),
(84, 0, 'allow'),
(84, 1, 'allow'),
(84, 2, 'allow'),
(84, 3, 'allow'),
(84, 4, 'allow'),
(84, 5, 'allow'),
(84, 6, 'allow'),
(84, 7, 'allow'),
(84, 8, 'allow'),
(84, 9, 'allow'),
(84, 10, 'allow'),
(84, 11, 'allow'),
(84, 12, 'allow'),
(84, 13, 'allow'),
(84, 14, 'allow'),
(84, 15, 'allow'),
(84, 16, 'allow'),
(84, 17, 'allow'),
(84, 18, 'allow'),
(84, 19, 'allow'),
(84, 20, 'allow'),
(84, 21, 'allow'),
(84, 22, 'allow'),
(84, 23, 'allow'),
(84, 24, 'allow'),
(84, 25, 'allow'),
(84, 26, 'allow'),
(84, 27, 'allow'),
(84, 28, 'allow'),
(84, 29, 'allow'),
(84, 30, 'allow'),
(84, 32, 'allow'),
(84, 33, 'allow'),
(84, 34, 'allow'),
(84, 35, 'allow'),
(84, 36, 'allow'),
(84, 37, 'allow'),
(84, 38, 'allow'),
(84, 39, 'allow'),
(84, 40, 'allow'),
(84, 41, 'allow'),
(84, 42, 'allow'),
(84, 43, 'allow'),
(84, 44, 'allow'),
(84, 45, 'allow'),
(84, 46, 'allow'),
(84, 47, 'allow'),
(89, 10, 'allow'),
(89, 32, 'allow'),
(89, 34, 'allow'),
(89, 35, 'allow'),
(1002, 47, 'allow');

--
-- Dumping data for table `system_settings`
--
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('density', 'compact', '2026-03-26 13:07:28'),
('fontFamily', 'system', '2026-03-26 13:07:28'),
('logoPreview', '', '2026-03-26 13:04:58'),
('primaryColor', 'blue', '2026-03-26 13:04:58'),
('themeMode', 'dark', '2026-03-30 07:21:16');

INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'Elite Barber Shop', 'string', 'Name of the barber shop', 1),
('site_email', 'info@elitebarbershop.com', 'string', 'Contact email address', 1),
('site_phone', '+251-911-123456', 'string', 'Contact phone number', 1),
('booking_approval_required', 'true', 'boolean', 'Whether bookings require admin approval', 0),
('booking_advance_days', '30', 'number', 'How many days in advance customers can book', 1),
('queue_auto_position', 'true', 'boolean', 'Automatically calculate queue positions', 0),
('review_min_rating', '1', 'number', 'Minimum rating value', 1),
('review_max_rating', '5', 'number', 'Maximum rating value', 1),
('review_requires_booking', 'true', 'boolean', 'Reviews require completed booking', 0),
('notification_email_enabled', 'true', 'boolean', 'Enable email notifications', 0),
('notification_sms_enabled', 'false', 'boolean', 'Enable SMS notifications', 0),
('business_hours_start', '09:00', 'string', 'Business opening time', 1),
('business_hours_end', '20:00', 'string', 'Business closing time', 1),
('business_days', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', 'json', 'Working days', 1);

--
-- Dumping data for table `contact_messages`
--
INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `message`, `status`, `created_at`) VALUES
(1, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2025-12-19 11:32:58'),
(2, 'Bereket Tamrat', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 07:38:32'),
(3, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 09:19:18'),
(4, 'Beki Tame', 'berekettamrat2015@gmail.com', '+251913566735', 'test', 'read', '2026-01-05 09:31:32'),
(5, 'Hayal', 'onerrr@gmail.com', '', 'Tets', 'read', '2026-01-10 05:48:42'),
(6, 'Mesfin Tsegaye', 'mesfin@mevinai.com', '+251911522902', 'Hello, this is Mesfin, Founder of Mevinai PLC. I’m interested in renting a workspace for our company and would appreciate guidance on the next steps. We’re a growing startup and are looking for an environment that can support our team’s expansion and innovation.', 'read', '2026-01-12 13:19:08'),
(7, 'Mesfin Tsegaye', 'mesfin@mevinai.com', '+251911522902', 'Hello, this is Mesfin, Founder of Mevinai PLC. I’m interested in renting a workspace for our company and would appreciate guidance on the next steps. We’re a growing startup and are looking for an environment that can support our team’s expansion and innovation.', 'read', '2026-01-12 13:19:35'),
(8, 'Hayal Tamrat Girum', 'hayaltamrat3@gmail.com', '+251976180462', 'this is test from hayal\n', 'replied', '2026-01-19 15:09:36'),
(9, 'Dagim Mathewos', 'dmathewos529@gmail.com', '+251903918129', 'Subject: Cooperative Training Placement Request – 5 Web Development & Database Students (Teferi Mekonnen Polytechnic College)\n\nTo:  Ethiopian IT Park (ICT Park) Addis Ababa, Ethiopia\n\nDear Sir/Madam,\n\nWe are writing to formally express our keen interest in undertaking our Cooperative Training (Internship) at the Ethiopian IT Park. We are a group of five (5) dedicated students currently completing our Level 3 certification in Web Development and Database Management at Teferi Mekonnen Polytechnic College.\n\nAs students of one of Ethiopia’s most historic technical institutions, we are eager to bridge the gap between our academic studies and the real-world digital ecosystem. We believe that the Ethiopian IT Park, as the nation\'s premier technology hub, offers the ideal environment for us to refine our technical skills while contributing to the Park\'s digital objectives.\n\nDuring our placement, we are prepared to assist resident companies or the Park administration in the following areas:\n\nWeb Development: Assisting in front-end updates, UI/UX maintenance, and basic web programming (HTML, CSS, JavaScript).\n\nDatabase Management: Supporting data entry, SQL queries, database cleaning, and documentation.\n\nTechnical Support: Aiding in IT infrastructure maintenance and general technical troubleshooting within the Special Economic Zone.\n\nWe are highly motivated, disciplined, and ready to adapt to the fast-paced professional environment of the IT Park. We have attached our institutional recommendation letter from Teferi Mekonnen Polytechnic College for your review.\n\nWe would welcome the opportunity to discuss how we can contribute to your organization during our training period. Thank you for considering our request and for your commitment to empowering the next generation of Ethiopian IT professionals.\n\nSincerely,\n\nStudent Representative Name: Dagim Mathewos Phone Number: +251-903-918-129 College: Teferi Mekonnen Polytechnic College', 'read', '2026-01-26 14:34:42'),
(10, '<script>alert(\'XSS\')</script>', 'test@gmail.com', '<script>alert(\'XSS\')</script>', '<script>alert(\'XSS\')</script>', 'read', '2026-01-29 13:53:36'),
(11, 'Habtam Habtam', 'hayaltamrat@gmail.com', '+359933499097', 'test', 'new', '2026-01-29 19:35:27'),
(12, 'John Doe', 'test@example.com', NULL, 'Normal message', 'read', '2026-02-02 13:41:27'),
(13, 'Contact Tester', 'tester@example.com', '0988776655', 'This is a valid test message', 'new', '2026-02-18 12:08:01'),
(14, 'Contact Tester', 'tester@example.com', '0988776655', 'This is a valid test message', 'new', '2026-02-18 12:08:57'),
(15, 'Test', 'test@test.com', NULL, 'Hello', 'new', '2026-02-18 14:00:57'),
(16, 'Tester', 'test@test.com', NULL, 'text', 'new', '2026-02-18 14:01:46'),
(17, 'Tester', 'test@test.com', NULL, 'text', 'new', '2026-02-18 14:01:46'),
(18, 'Tester', 'test@test.com', NULL, 'x', 'new', '2026-02-18 14:01:47'),
(19, 'Tester', 'test@test.com', NULL, 'text', 'new', '2026-02-18 14:01:47'),
(20, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(21, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(22, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(23, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(24, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(25, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(26, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(27, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(28, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(29, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(30, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(31, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(32, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(33, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(34, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(35, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(36, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(37, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(38, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 07:59:53'),
(39, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:23'),
(40, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:23'),
(41, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:56'),
(42, 'Spam Bot', 'spam@itpark.com', NULL, 'This is automated spam.', 'new', '2026-02-21 08:06:56'),
(43, 'John Doe', 'john@verified.com', '0912345678', 'Legitimate message.', 'new', '2026-02-21 08:48:39'),
(44, 'John Doe', 'john@verified.com', '0912345678', 'Legitimate message.', 'new', '2026-02-21 08:49:41'),
(45, 'John Doe', 'john@verified.com', '0912345678', 'Legitimate message.', 'new', '2026-02-21 08:52:56');

--
-- Dumping data for table `subscribers`
--
INSERT INTO `subscribers` (`id`, `email`, `status`, `subscribed_at`, `unsubscribed_at`) VALUES
(1, 'hayaltamrat@gmail.com', 'active', '2025-12-19 08:07:31', NULL),
(4, 'hayaltamrat1@gmail.com', 'active', '2025-12-19 08:13:22', NULL),
(5, 'hayaltamrat4@gmail.com', 'active', '2026-01-03 11:18:11', NULL),
(6, 'hayaltamrat5@gmail.com', 'active', '2026-01-05 06:08:14', NULL),
(7, 'berekettamrat2015@gmail.com', 'active', '2026-01-05 06:19:46', NULL),
(8, 'hayalt5@gmail.com', 'active', '2026-01-05 07:35:38', NULL),
(9, 'hayaltamrat6@gmail.com', 'active', '2026-01-05 07:38:04', NULL),
(10, 'hayaltamrat123@gmail.com', 'active', '2026-01-05 07:39:35', NULL),
(11, 'astu@nathayblog.com', 'active', '2026-01-05 08:53:24', NULL),
(12, 'berekettamrat20115@gmail.com', 'active', '2026-01-05 08:55:14', NULL),
(13, 'astuw@nathayblog.com', 'active', '2026-01-05 09:03:44', NULL),
(14, 'kidoastu1993@gmail.com', 'active', '2026-01-05 09:11:40', NULL),
(15, 'kidoastu19293@gmail.com', 'active', '2026-01-05 09:31:45', NULL),
(16, 'worket2@gmail.com', 'active', '2026-01-05 09:38:34', NULL),
(17, 'worketh20172@gmail.com', 'active', '2026-01-05 09:39:59', NULL),
(18, 'hager@temechain.com', 'active', '2026-01-05 10:01:00', NULL),
(19, 'bereketeab550@gmail.com', 'active', '2026-01-05 10:22:08', NULL),
(20, 'berekettamrat20154@gmail.com', 'active', '2026-01-06 04:38:05', NULL),
(21, 'fekadualemu208@gmail.com', 'active', '2026-01-08 07:13:49', NULL),
(22, 'super@gmail.com', 'active', '2026-01-09 04:56:42', NULL),
(23, 'somchaibinl@gmail.com', 'active', '2026-01-09 15:27:10', NULL),
(24, 'natha@gmail.com', 'active', '2026-01-09 18:55:42', NULL),
(25, 'onertrr@gmail.com', 'active', '2026-01-11 07:04:03', NULL),
(26, 'alemu.abera@ethiopianitpark.et', 'active', '2026-01-12 11:33:37', NULL),
(27, 'kedirahmed19963384@gmail.com', 'active', '2026-01-12 12:17:52', NULL),
(28, 'matthewarop@gmail.com', 'active', '2026-01-13 06:12:35', NULL),
(29, 'sirajdeldebo96@gmail.com', 'active', '2026-01-14 10:25:37', NULL),
(30, 'hayaltamrat8@gmail.com', 'active', '2026-01-15 10:31:21', NULL),
(31, 'mchala04@gmail.com', 'active', '2026-01-18 00:53:59', NULL),
(32, 'hayaltamrat23@gmail.com', 'active', '2026-01-19 16:24:52', NULL),
(33, 'hayaltamrat3@gmail.com', 'active', '2026-01-19 16:32:37', NULL),
(34, 'tsehayutilahun@gmail.com', 'active', '2026-01-20 08:25:12', NULL),
(35, 'kirubelmulugeta3@gmail.com', 'active', '2026-01-24 05:37:40', NULL),
(36, 'na@gmail.com', 'active', '2026-01-29 19:48:18', NULL),
(37, 'na1@gmail.com', 'active', '2026-01-29 19:48:35', NULL);

--
-- Dumping data for table `audit_logs`
--
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 10:15:10'),
(2, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 10:15:11'),
(3, 3, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '127.0.0.1', '2026-01-02 10:22:58'),
(4, 3, 'CREATE', 'User', NULL, '{\"fname\":\"hayal\",\"lname\":\"tamrat\",\"user_name\":\"hayalt\",\"email\":\"hayaltamrat@gmail.com\",\"phone\":\"+25191222112\",\"department_id\":\"1\",\"role_id\":\"1\"}', '127.0.0.1', '2026-01-02 10:27:54'),
(5, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 10:28:18'),
(6, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 10:28:23'),
(7, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"6\"}', '127.0.0.1', '2026-01-02 11:31:54'),
(8, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-02 11:33:43'),
(9, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-02 11:35:03'),
(10, 3, 'UPDATE', 'User', NULL, '{\"fname\":\"some one\",\"lname\":\"some one\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-02 11:35:17'),
(11, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 11:41:15'),
(12, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 11:41:57'),
(13, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-02 11:45:34'),
(14, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 12:43:34'),
(15, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 12:45:41'),
(16, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 12:59:24'),
(17, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:02:54'),
(18, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 13:12:26'),
(19, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:14:49'),
(20, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"onerrr@gmail.com\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:26:28'),
(21, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 13:26:45'),
(22, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:28:03'),
(23, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"onerrr@gmail.com\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:28:07'),
(24, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"onerrr@gmail.com\",\"attempts\":2}', '127.0.0.1', '2026-01-02 13:28:11'),
(25, 128, 'LOGOUT', 'User', '128', NULL, '127.0.0.1', '2026-01-02 13:35:54'),
(26, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 13:36:02'),
(27, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:48:55'),
(28, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":2}', '127.0.0.1', '2026-01-02 13:48:58'),
(29, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":3}', '127.0.0.1', '2026-01-02 13:49:01'),
(30, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":4}', '127.0.0.1', '2026-01-02 13:49:04'),
(31, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":5}', '127.0.0.1', '2026-01-02 13:49:08'),
(32, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 13:53:53'),
(33, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 13:53:57'),
(34, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":1}', '127.0.0.1', '2026-01-02 13:54:22'),
(35, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":2}', '127.0.0.1', '2026-01-02 13:54:26'),
(36, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":3}', '127.0.0.1', '2026-01-02 13:54:29'),
(37, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":4}', '127.0.0.1', '2026-01-02 13:54:32'),
(38, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":5}', '127.0.0.1', '2026-01-02 13:54:35'),
(39, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-02 14:03:48'),
(40, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-02 14:03:51'),
(41, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":1}', '127.0.0.1', '2026-01-02 14:03:59'),
(42, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":2}', '127.0.0.1', '2026-01-02 14:04:02'),
(43, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":3}', '127.0.0.1', '2026-01-02 14:04:05'),
(44, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":4}', '127.0.0.1', '2026-01-02 14:04:08'),
(45, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"hayalt\",\"attempts\":5}', '127.0.0.1', '2026-01-02 14:04:12'),
(46, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-02 14:21:23'),
(47, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-02 14:21:48'),
(48, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-02 14:22:45'),
(49, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-03 10:34:17'),
(50, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-03 11:09:08'),
(51, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-03 11:09:25'),
(52, 35, 'CREATE', 'Media', '6', '{\"title\":\"our leaders \",\"count\":4}', '127.0.0.1', '2026-01-03 11:10:52'),
(53, 35, 'DELETE', 'Media', '9', NULL, '127.0.0.1', '2026-01-03 11:11:02'),
(54, 3, 'CREATE', 'User', NULL, '{\"fname\":\"yossef\",\"lname\":\"knfe\",\"user_name\":\"yossef\",\"email\":\"yosef@gmail.com\",\"phone\":\"0913566735\",\"department_id\":\"2\",\"role_id\":\"4\"}', '127.0.0.1', '2026-01-03 14:04:12'),
(55, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-03 14:04:19'),
(56, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-03 14:04:51'),
(57, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-03 14:05:07'),
(58, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 14:05:17'),
(59, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-03 14:05:47'),
(60, 3, 'LOGIN', 'User', '3', '{\"username\":\"onerrr@gmail.com\"}', '127.0.0.1', '2026-01-03 14:05:56'),
(61, 3, 'LOGOUT', 'User', '3', NULL, '127.0.0.1', '2026-01-03 14:06:21'),
(62, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 14:06:32'),
(63, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-03 14:06:51'),
(64, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-03 17:53:30'),
(65, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"yossef\",\"attempts\":1}', '127.0.0.1', '2026-01-03 17:54:00'),
(66, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-03 17:54:09'),
(67, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-03 17:54:29'),
(68, NULL, 'LOGIN_FAILED', 'User', NULL, '{\"username\":\"yossef\",\"attempts\":2}', '127.0.0.1', '2026-01-03 17:54:41'),
(69, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 17:55:01'),
(70, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-03 18:17:13'),
(71, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 07:15:06'),
(72, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-04 07:15:28'),
(73, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:15:41'),
(74, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:21:19'),
(75, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:21:21'),
(76, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:29:35'),
(77, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 07:29:40'),
(78, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-04 07:30:26'),
(79, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:30:31'),
(80, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:43:30'),
(81, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:43:31'),
(82, 35, 'LOGOUT', 'User', '35', NULL, '127.0.0.1', '2026-01-04 07:47:57'),
(83, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 07:48:10'),
(84, 36, 'LOGOUT', 'User', '36', NULL, '127.0.0.1', '2026-01-04 07:53:42'),
(85, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '127.0.0.1', '2026-01-04 07:53:48'),
(86, 36, 'LOGIN', 'User', '36', '{\"username\":\"yossef\"}', '127.0.0.1', '2026-01-04 08:29:21'),
(87, 3, 'LOGOUT', 'User', '3', NULL, '196.189.144.152', '2026-01-05 05:55:25'),
(88, 35, 'LOGIN', 'User', '35', '{\"username\":\"hayalt\"}', '196.189.144.152', '2026-01-05 11:47:33'),
(128, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-01-30 07:56:46'),
(129, 84, 'LOGOUT', 'User', '84', NULL, '::1', '2026-01-30 08:04:03'),
(130, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-01-30 08:04:06'),
(131, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:50:29'),
(132, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:52:43'),
(133, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:59:07'),
(134, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 11:59:37'),
(135, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:01:43'),
(136, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:15:17'),
(137, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:26:29'),
(138, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:34:36'),
(139, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:50:08'),
(140, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 12:51:19'),
(141, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 14:00:44'),
(142, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-02 14:20:22'),
(143, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-03 06:10:45'),
(144, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-16 12:39:46'),
(145, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-16 17:45:49'),
(146, 83, 'CREATE', 'User', NULL, '{\"fname\":\"content\",\"lname\":\"tets1\",\"user_name\":\"contenttest1\",\"email\":\"contenttest1@gmail.com\",\"phone\":\"0917266671\",\"department_id\":\"1\",\"role_id\":\"3\"}', '::ffff:127.0.0.1', '2026-02-16 19:16:16'),
(147, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-16 19:16:22'),
(148, 90, 'LOGIN', 'User', '90', '{\"username\":\"contenttest1\"}', '::ffff:127.0.0.1', '2026-02-16 19:16:47'),
(149, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-16 19:18:43'),
(150, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-16 20:24:22'),
(151, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 06:47:55'),
(152, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:29:41'),
(153, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 07:34:22'),
(154, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:34:25'),
(155, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 07:38:28'),
(156, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:39:49'),
(157, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 07:57:44'),
(158, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 07:57:46'),
(159, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 08:18:21'),
(160, 83, 'LOGOUT', 'User', '83', NULL, '::ffff:127.0.0.1', '2026-02-17 08:29:11'),
(161, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 08:29:13'),
(162, 83, 'CREATE', 'News', '7', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:46:00'),
(163, 83, 'CREATE', 'News', '8', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:47:40'),
(164, 83, 'CREATE', 'News', '9', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:48:01'),
(165, 83, 'CREATE', 'News', '10', '{\"title\":\"Test News\"}', '::ffff:127.0.0.1', '2026-02-17 08:49:05'),
(166, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 09:10:37'),
(167, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-17 09:10:44'),
(168, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 09:10:47'),
(169, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-17 10:54:14'),
(170, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 10:54:18'),
(171, 83, 'CREATE', 'News', '11', '{\"title\":\"test\"}', '::1', '2026-02-17 11:09:25'),
(172, 83, 'UPDATE', 'News', '11', '{\"title\":\"test\"}', '::1', '2026-02-17 11:09:53'),
(173, 83, 'CREATE', 'Media', '9', '{\"title\":\"Field Test Singular\",\"count\":1}', '::1', '2026-02-17 11:22:24'),
(174, 83, 'CREATE', 'Media', '10', '{\"title\":\"Field Test Plural\",\"count\":1}', '::1', '2026-02-17 11:22:24'),
(175, 83, 'CREATE', 'Media', '11', '{\"title\":\"Field Test Singular\",\"count\":1}', '::1', '2026-02-17 11:22:43'),
(176, 83, 'CREATE', 'Media', '12', '{\"title\":\"Field Test Plural\",\"count\":1}', '::1', '2026-02-17 11:22:43'),
(177, 83, 'CREATE', 'Media', '13', '{\"title\":\"Field Test Singular\",\"count\":1}', '::1', '2026-02-17 11:27:40'),
(178, 83, 'CREATE', 'Media', '14', '{\"title\":\"Field Test Plural\",\"count\":1}', '::1', '2026-02-17 11:27:40'),
(179, 83, 'CREATE', 'Media', '15', '{\"title\":\"test\",\"count\":1}', '::1', '2026-02-17 11:32:01'),
(180, 83, 'DELETE', 'Media', '15', NULL, '::1', '2026-02-17 11:32:08'),
(181, 83, 'DELETE', 'Media', '14', NULL, '::1', '2026-02-17 11:33:27'),
(182, 83, 'UPDATE', 'Media', '13', '{\"title\":\"Field Test Singular\"}', '::1', '2026-02-17 11:33:50'),
(183, 83, 'DELETE', 'Media', '13', NULL, '::1', '2026-02-17 11:33:57'),
(184, 83, 'DELETE', 'Media', '11', NULL, '::1', '2026-02-17 11:39:10'),
(185, 83, 'DELETE', 'Media', '12', NULL, '::1', '2026-02-17 11:39:13'),
(186, 83, 'DELETE', 'Media', '10', NULL, '::1', '2026-02-17 11:49:50'),
(187, 83, 'DELETE', 'Media', '9', NULL, '::1', '2026-02-17 11:49:53'),
(188, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 12:45:43'),
(189, 83, 'DELETE', 'News', '10', NULL, '::1', '2026-02-17 12:47:16'),
(190, 83, 'DELETE', 'News', '9', NULL, '::1', '2026-02-17 12:47:19'),
(191, 83, 'DELETE', 'News', '8', NULL, '::1', '2026-02-17 12:47:22'),
(192, 83, 'DELETE', 'News', '7', NULL, '::1', '2026-02-17 12:47:24'),
(193, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 12:47:58'),
(194, 83, 'CREATE', 'Event', '2', '{\"title\":\"test\"}', '::1', '2026-02-17 12:54:52'),
(195, 83, 'DELETE', 'Event', '2', NULL, '::1', '2026-02-17 13:01:04'),
(196, 83, 'CREATE', 'Event', '3', '{\"title\":\"test\"}', '::1', '2026-02-17 13:01:32'),
(197, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:05:37'),
(198, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:19:40'),
(199, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:20:51'),
(200, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:21:20'),
(201, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:21:34'),
(202, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:21:44'),
(203, 83, 'UPDATE', 'News', '11', '{\"title\":\"test2\"}', '::1', '2026-02-17 13:22:07'),
(204, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-17 13:47:33'),
(205, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:48:55'),
(206, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:50:57'),
(207, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:52:06'),
(208, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:53:50'),
(209, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:54:12'),
(210, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 13:55:41'),
(211, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-17 14:05:12'),
(212, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 14:05:15'),
(213, 83, 'UPDATE', 'Event', '3', '{\"title\":\"test\"}', '::1', '2026-02-17 14:06:00'),
(214, 83, 'UPDATE', 'Event', '3', '{\"title\":\"test\"}', '::1', '2026-02-17 14:06:40'),
(215, 83, 'DELETE', 'Event', '3', NULL, '::1', '2026-02-17 14:06:56'),
(216, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-17 14:27:13'),
(217, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 06:11:32'),
(218, 83, 'DELETE', 'News', '11', NULL, '::1', '2026-02-18 06:12:04'),
(219, 83, 'CREATE', 'User', NULL, '{\"fname\":\"test\",\"lname\":\"test\",\"user_name\":\"test@gmail.com\",\"email\":\"test@gmail.com\",\"phone\":\"98893219831298\",\"department_id\":\"1\",\"role_id\":\"1\"}', '::1', '2026-02-18 07:01:04'),
(220, 83, 'UPDATE', 'User', NULL, '{\"fname\":\"test\",\"lname\":\"some one\",\"user_name\":\"test@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}', '::1', '2026-02-18 07:01:55'),
(221, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":1}', '::1', '2026-02-18 07:02:04'),
(222, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '::1', '2026-02-18 07:03:45'),
(223, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":1}', '::1', '2026-02-18 07:03:46'),
(224, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 08:28:04'),
(225, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 11:24:27'),
(226, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 12:29:16'),
(227, 83, 'CREATE', 'User', NULL, '{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771417756741@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771417756741\"}', '::1', '2026-02-18 12:29:16'),
(228, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 12:47:08'),
(229, 83, 'CREATE', 'User', NULL, '{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771418828658@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771418828658\"}', '::1', '2026-02-18 12:47:08'),
(230, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-18 12:48:41'),
(231, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-18 12:52:40'),
(232, 83, 'CREATE', 'User', NULL, '{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771419160931@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771419160931\"}', '::1', '2026-02-18 12:52:41'),
(233, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '::1', '2026-02-18 13:21:53'),
(234, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-18 14:22:46'),
(235, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 07:52:24'),
(236, 83, 'CREATE', 'User', NULL, '{\"fname\":\"tets\",\"lname\":\"tets\",\"user_name\":\"tets27\",\"email\":\"tets113@gmail.com\",\"phone\":\"0917122712\",\"department_id\":\"2\",\"role_id\":\"4\"}', '::1', '2026-02-19 07:53:52'),
(237, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 07:54:03'),
(238, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 07:54:05'),
(239, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 07:55:37'),
(240, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 07:57:12'),
(241, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 08:18:38'),
(242, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 08:18:44'),
(243, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 08:18:47'),
(244, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 08:29:23'),
(245, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-19 08:46:14'),
(246, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 08:48:16'),
(247, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 08:50:33'),
(248, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 08:50:38'),
(249, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 08:59:15'),
(250, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 08:59:50'),
(251, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 09:00:11'),
(252, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 09:03:31'),
(253, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 09:03:34'),
(254, 1002, 'LOGOUT', 'User', '1002', NULL, '::1', '2026-02-19 09:06:21'),
(255, 1002, 'LOGIN', 'User', '1002', '{\"username\":\"tets27\"}', '::1', '2026-02-19 09:06:28'),
(256, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-19 10:38:50'),
(257, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-19 10:38:55'),
(258, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 06:55:15'),
(259, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 12:04:18'),
(260, 83, 'CREATE', 'User', NULL, '{\"fname\":\"contet\",\"lname\":\"contet\",\"user_name\":\"contet1\",\"email\":\"contet1@gmail.com\",\"phone\":\"+251913566735\",\"department_id\":\"1\",\"role_id\":\"3\"}', '::1', '2026-02-20 12:05:05'),
(261, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-20 12:05:10'),
(262, 1003, 'LOGIN', 'User', '1003', '{\"username\":\"contet1\"}', '::1', '2026-02-20 12:05:13'),
(263, 1003, 'LOGOUT', 'User', '1003', NULL, '::1', '2026-02-20 12:37:06'),
(264, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 12:37:14'),
(265, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-20 12:54:10'),
(266, 1003, 'LOGIN', 'User', '1003', '{\"username\":\"contet1\"}', '::1', '2026-02-20 12:54:14'),
(267, 1003, 'LOGOUT', 'User', '1003', NULL, '::1', '2026-02-20 13:00:46'),
(268, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 13:00:52'),
(269, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-02-20 13:10:37'),
(270, 83, 'DELETE', 'Comment', '8', NULL, '::1', '2026-02-20 13:58:21'),
(271, 83, 'DELETE', 'Comment', '10', NULL, '::1', '2026-02-20 13:58:26'),
(272, 83, 'DELETE', 'Comment', '15', NULL, '::1', '2026-02-20 13:58:31'),
(273, 83, 'APPROVE', 'Comment', '169', NULL, '::1', '2026-02-20 14:02:06'),
(274, 83, 'APPROVE', 'Comment', '169', NULL, '::1', '2026-02-20 14:02:46'),
(275, 83, 'APPROVE', 'Comment', '174', NULL, '::1', '2026-02-20 14:05:53'),
(276, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 16:35:44'),
(277, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-02-20 18:05:50'),
(278, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-02-20 18:05:56'),
(279, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:40:47'),
(280, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:41:47'),
(281, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:42:25'),
(282, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 07:52:02'),
(283, 84, 'LOGIN', 'User', '84', '{\"username\":\"test_admin\"}', '::1', '2026-02-26 09:51:22'),
(284, 84, 'LOGOUT', 'User', '84', NULL, '::1', '2026-02-26 09:51:24'),
(285, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::ffff:127.0.0.1', '2026-03-05 03:39:32'),
(286, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-05 03:42:22'),
(287, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 07:04:02'),
(288, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 09:57:41'),
(289, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 11:24:38'),
(290, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 12:01:07'),
(291, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 12:32:28'),
(292, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 12:48:21'),
(293, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:03:25'),
(294, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-03-26 13:06:45'),
(295, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:06:47'),
(296, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:21:25'),
(297, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 13:45:44'),
(298, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":0}', '::1', '2026-03-26 14:05:09'),
(299, 83, 'UPDATE_STATUS', 'User', NULL, '{\"status\":1}', '::1', '2026-03-26 14:05:10'),
(300, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 14:09:16'),
(301, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 14:15:49'),
(302, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 15:26:00'),
(303, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 15:43:46'),
(304, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 16:54:27'),
(305, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 17:32:22'),
(306, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-26 18:50:00'),
(307, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 06:16:36'),
(308, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 06:35:28'),
(309, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 06:53:34'),
(310, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 07:17:58'),
(311, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 12:34:27'),
(312, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 13:21:41'),
(313, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-03-27 13:21:41'),
(314, 83, 'LOGOUT', 'User', '83', NULL, '::1', '2026-03-27 13:21:41'),
(315, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 13:22:07'),
(316, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-27 14:07:00'),
(317, 83, 'LOGIN', 'User', '83', '{\"username\":\"nathan27\"}', '::1', '2026-03-30 07:11:41');

--
-- Dumping data for table `active_sessions`
--
INSERT INTO `active_sessions` (`id`, `user_id`, `jti`, `ip_address`, `user_agent`, `created_at`, `last_activity`) VALUES
(28, 83, 'b808c2e6-1dc0-4db6-b5f6-19a4af2b49f4', '::1', 'Mozilla/5.0 (Windows NT 10.0;

-- ========================================================
-- SECTION 3: DATABASE VIEWS
-- ========================================================

--
-- View: v_booking_workflow_summary
--
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
  (SELECT u.user_name 
   FROM booking_workflow_history bwh 
   LEFT JOIN users u ON bwh.action_by = u.user_id
   WHERE bwh.booking_id = sb.id 
   ORDER BY bwh.action_timestamp DESC 
   LIMIT 1) AS last_action_by_name,
  (SELECT COUNT(*) 
   FROM booking_workflow_history bwh 
   WHERE bwh.booking_id = sb.id) AS total_transitions,
  (SELECT TIMESTAMPDIFF(MINUTE, sb.created_at, MIN(bwh.action_timestamp))
   FROM booking_workflow_history bwh 
   WHERE bwh.booking_id = sb.id 
   AND bwh.action = 'approved') AS minutes_to_approval
FROM service_bookings sb
LEFT JOIN services s ON sb.service_id = s.id;

--
-- View: v_workflow_metrics
--
CREATE OR REPLACE VIEW `v_workflow_metrics` AS
SELECT 
  DATE(bwh.action_timestamp) AS metric_date,
  bwh.action,
  COUNT(*) AS action_count,
  AVG(TIMESTAMPDIFF(MINUTE, sb.created_at, bwh.action_timestamp)) AS avg_minutes_from_submission,
  bwh.action_role,
  SUM(CASE WHEN bwh.to_status = 'approved' THEN 1 ELSE 0 END) AS approvals,
  SUM(CASE WHEN bwh.to_status = 'rejected' THEN 1 ELSE 0 END) AS rejections,
  SUM(CASE WHEN bwh.to_status = 'changes_requested' THEN 1 ELSE 0 END) AS change_requests
FROM booking_workflow_history bwh
LEFT JOIN service_bookings sb ON bwh.booking_id = sb.id
GROUP BY metric_date, bwh.action, bwh.action_role
ORDER BY metric_date DESC, bwh.action;

-- ========================================================
-- SECTION 4: STORED PROCEDURES
-- ========================================================

DROP PROCEDURE IF EXISTS `sp_record_workflow_transition`;
DROP PROCEDURE IF EXISTS `sp_validate_transition`;

DELIMITER //

CREATE PROCEDURE `sp_record_workflow_transition`(
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
  
  SELECT reference_number INTO v_reference_number
  FROM service_bookings
  WHERE id = p_booking_id;
  
  SELECT r.role_name INTO v_role
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.role_id
  WHERE u.user_id = p_action_by;
  
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

CREATE PROCEDURE `sp_validate_transition`(
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
  
  SET p_is_valid = 0;
  SET p_error_message = 'Unknown validation error';
  
  SELECT allowed_roles, requires_note, is_active
  INTO v_allowed_roles, v_requires_note, v_is_active
  FROM workflow_state_rules
  WHERE from_state = p_from_state
    AND to_state = p_to_state
  LIMIT 1;
  
  IF v_allowed_roles IS NULL THEN
    SET p_error_message = CONCAT('Invalid transition: ', p_from_state, ' -> ', p_to_state);
    SET p_is_valid = 0;
  ELSEIF v_is_active = 0 THEN
    SET p_error_message = 'This transition is currently disabled';
    SET p_is_valid = 0;
  ELSEIF FIND_IN_SET(p_user_role, v_allowed_roles) = 0 THEN
    SET p_error_message = CONCAT('Role ', p_user_role, ' not authorized for this transition');
    SET p_is_valid = 0;
  ELSEIF v_requires_note = 1 AND p_has_note = 0 THEN
    SET p_error_message = 'A note/reason is required for this action';
    SET p_is_valid = 0;
  ELSE
    SET p_is_valid = 1;
    SET p_error_message = 'Valid transition';
  END IF;
END //

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- End of unified db_barber script

const fs = require('fs');
const path = require('path');

const modelsDir = path.resolve(__dirname, '../models');
const scriptsDir = path.resolve(__dirname, '../scripts');
const migrationsDir = path.resolve(__dirname, '../migrations');

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

const current = read(path.join(modelsDir, 'db_barber_current.sql'));
const main = read(path.join(modelsDir, 'db_barber.sql'));
const complete = read(path.join(modelsDir, 'complete_barber_schema.sql'));
const workflow = read(path.join(modelsDir, 'booking_workflow_additions.sql'));
const seedData = read(path.join(modelsDir, 'seed_data.sql'));
const seedLetter = read(path.join(modelsDir, 'seed_letter_minimal.sql'));
const createServices = read(path.join(scriptsDir, 'create_service_tables.sql'));
const createRatings = read(path.join(scriptsDir, 'create_service_ratings_table.sql'));
const complaintAssigneesScript = read(path.join(scriptsDir, 'migration-complaint-assignees.sql'));
const availabilityScript = read(path.join(migrationsDir, 'availability_migration.sql'));

// Table definitions carefully curated with the full superset of columns and correct indexes
const tableSchemas = {
  roles: `CREATE TABLE IF NOT EXISTS \`roles\` (
  \`role_id\` int(11) NOT NULL,
  \`role_name\` varchar(50) NOT NULL,
  \`status\` tinyint(1) DEFAULT 1,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`role_id\`),
  UNIQUE KEY \`role_name\` (\`role_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  organization_types: `CREATE TABLE IF NOT EXISTS \`organization_types\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  departments: `CREATE TABLE IF NOT EXISTS \`departments\` (
  \`department_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`department_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  employee_positions: `CREATE TABLE IF NOT EXISTS \`employee_positions\` (
  \`position_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`position_name\` varchar(100) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`department_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`position_id\`),
  KEY \`department_id\` (\`department_id\`),
  CONSTRAINT \`fk_ep_department\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`department_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  categories: `CREATE TABLE IF NOT EXISTS \`categories\` (
  \`category_id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`category_name\` varchar(100) NOT NULL,
  \`description\` text DEFAULT NULL,
  PRIMARY KEY (\`category_id\`),
  UNIQUE KEY \`category_id\` (\`category_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  service_categories: `CREATE TABLE IF NOT EXISTS \`service_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`category_name\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`icon\` varchar(50) DEFAULT NULL,
  \`category_icon\` varchar(50) DEFAULT NULL,
  \`image_url\` varchar(255) DEFAULT NULL,
  \`category_image\` varchar(255) DEFAULT NULL,
  \`status\` enum('active','inactive') DEFAULT 'active',
  \`display_order\` int(11) DEFAULT 0,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`category_name\` (\`category_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  employees: `CREATE TABLE IF NOT EXISTS \`employees\` (
  \`employee_id\` int(11) NOT NULL,
  \`name\` varchar(100) NOT NULL,
  \`fname\` varchar(50) DEFAULT NULL,
  \`lname\` varchar(50) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`sex\` enum('M','F','Other') DEFAULT NULL,
  \`role_id\` int(11) DEFAULT NULL,
  \`department_id\` int(11) DEFAULT NULL,
  \`supervisor_id\` int(11) DEFAULT NULL,
  \`hire_date\` date DEFAULT NULL,
  \`status\` enum('active','inactive','suspended') DEFAULT 'active',
  \`profile_image\` varchar(500) DEFAULT NULL,
  \`bio\` text DEFAULT NULL,
  \`specialization\` varchar(255) DEFAULT NULL,
  \`years_experience\` int(11) DEFAULT 0,
  \`rating_avg\` decimal(3,2) DEFAULT 0.00,
  \`total_bookings\` int(11) DEFAULT 0,
  \`completed_bookings\` int(11) DEFAULT 0,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`employee_id\`),
  KEY \`role_id\` (\`role_id\`),
  KEY \`department_id\` (\`department_id\`),
  KEY \`idx_emp_status\` (\`status\`),
  KEY \`idx_emp_email\` (\`email\`),
  CONSTRAINT \`fk_emp_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`role_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_emp_dept\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`department_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  users: `CREATE TABLE IF NOT EXISTS \`users\` (
  \`user_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`employee_id\` int(11) DEFAULT NULL,
  \`user_name\` varchar(50) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`role_id\` int(11) DEFAULT NULL,
  \`status\` enum('1','0') DEFAULT '1',
  \`online_flag\` tinyint(1) DEFAULT 0,
  \`avatar_url\` varchar(255) DEFAULT NULL,
  \`failed_login_attempts\` int(11) DEFAULT 0,
  \`account_locked_until\` datetime DEFAULT NULL,
  \`reset_token\` varchar(255) DEFAULT NULL,
  \`reset_token_expires\` datetime DEFAULT NULL,
  \`redemption_token\` varchar(255) DEFAULT NULL,
  \`redemption_token_expires\` datetime DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`user_id\`),
  UNIQUE KEY \`user_name\` (\`user_name\`),
  KEY \`employee_id\` (\`employee_id\`),
  KEY \`role_id\` (\`role_id\`),
  CONSTRAINT \`fk_user_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_user_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`role_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  organization_structure: `CREATE TABLE IF NOT EXISTS \`organization_structure\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`organization_id\` int(11) DEFAULT NULL,
  \`parent_id\` int(11) DEFAULT NULL,
  \`employee_id\` int(11) DEFAULT NULL,
  \`position_id\` int(11) DEFAULT NULL,
  \`department_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`organization_id\` (\`organization_id\`),
  KEY \`parent_id\` (\`parent_id\`),
  KEY \`employee_id\` (\`employee_id\`),
  KEY \`position_id\` (\`position_id\`),
  KEY \`department_id\` (\`department_id\`),
  CONSTRAINT \`fk_os_org_type\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization_types\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_os_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`organization_structure\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_os_emp\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_os_pos\` FOREIGN KEY (\`position_id\`) REFERENCES \`employee_positions\` (\`position_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_os_dept\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`department_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  services: `CREATE TABLE IF NOT EXISTS \`services\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`service_name\` varchar(255) NOT NULL,
  \`service_slug\` varchar(255) NOT NULL,
  \`category_id\` int(11) DEFAULT NULL,
  \`barber_id\` int(11) DEFAULT NULL,
  \`short_description\` varchar(500) DEFAULT NULL,
  \`description\` text DEFAULT NULL,
  \`price\` decimal(10,2) NOT NULL,
  \`discount_price\` decimal(10,2) DEFAULT NULL,
  \`duration\` int(11) NOT NULL DEFAULT 30,
  \`duration_minutes\` int(11) NOT NULL DEFAULT 30,
  \`is_available\` tinyint(1) DEFAULT 1,
  \`status\` enum('active','inactive') DEFAULT 'active',
  \`is_featured\` tinyint(1) DEFAULT 0,
  \`image_url\` varchar(500) DEFAULT NULL,
  \`service_image\` varchar(500) DEFAULT NULL,
  \`service_icon\` varchar(50) DEFAULT NULL,
  \`max_customers_per_slot\` int(11) DEFAULT 1,
  \`preparation_time\` int(11) DEFAULT 0,
  \`cleanup_time\` int(11) DEFAULT 0,
  \`booking_buffer_time\` int(11) DEFAULT 0,
  \`service_type\` varchar(50) DEFAULT 'standard',
  \`created_by\` int(11) DEFAULT NULL,
  \`updated_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`service_slug\` (\`service_slug\`),
  KEY \`category_id\` (\`category_id\`),
  KEY \`barber_id\` (\`barber_id\`),
  CONSTRAINT \`fk_services_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`service_categories\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_services_barber\` FOREIGN KEY (\`barber_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  service_barber_assignments: `CREATE TABLE IF NOT EXISTS \`service_barber_assignments\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`service_id\` int(11) NOT NULL,
  \`barber_id\` int(11) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`service_barber_unique\` (\`service_id\`,\`barber_id\`),
  KEY \`barber_id\` (\`barber_id\`),
  CONSTRAINT \`fk_sba_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_sba_barber\` FOREIGN KEY (\`barber_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  availability_slots: `CREATE TABLE IF NOT EXISTS \`availability_slots\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`barber_id\` int(11) DEFAULT NULL,
  \`service_id\` int(11) DEFAULT NULL,
  \`available_date\` date NOT NULL,
  \`start_time\` time NOT NULL,
  \`end_time\` time NOT NULL,
  \`slot_status\` enum('available','booked','blocked') DEFAULT 'available',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`barber_id\` (\`barber_id\`),
  KEY \`service_id\` (\`service_id\`),
  KEY \`idx_date_status\` (\`available_date\`,\`slot_status\`),
  CONSTRAINT \`fk_avail_barber\` FOREIGN KEY (\`barber_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_avail_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  service_bookings: `CREATE TABLE IF NOT EXISTS \`service_bookings\` (
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`service_id\` int(11) NOT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`barber_id\` int(11) DEFAULT NULL,
  \`availability_slot_id\` int(11) DEFAULT NULL,
  \`customer_name\` varchar(100) NOT NULL,
  \`customer_email\` varchar(100) NOT NULL,
  \`customer_phone\` varchar(20) DEFAULT NULL,
  \`appointment_date\` date NOT NULL,
  \`appointment_time\` time NOT NULL,
  \`status\` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  \`booking_status\` enum('pending','approved','rejected','confirmed','cancelled','completed') DEFAULT 'pending',
  \`approval_status\` enum('waiting','pending','approved','rejected','changes_requested','cancelled') DEFAULT 'pending',
  \`requires_approval\` tinyint(1) DEFAULT 1,
  \`workflow_state\` varchar(50) DEFAULT 'waiting',
  \`rejection_reason\` text DEFAULT NULL,
  \`booking_note\` text DEFAULT NULL,
  \`reference_number\` varchar(50) DEFAULT NULL,
  \`queue_status\` enum('not_started','queued','serving','completed','cancelled') DEFAULT 'queued',
  \`reminder_sent\` tinyint(1) DEFAULT 0,
  \`created_by\` int(11) DEFAULT NULL,
  \`updated_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`service_id\` (\`service_id\`),
  KEY \`customer_id\` (\`customer_id\`),
  KEY \`barber_id\` (\`barber_id\`),
  KEY \`availability_slot_id\` (\`availability_slot_id\`),
  KEY \`idx_booking_ref\` (\`reference_number\`),
  KEY \`idx_booking_date\` (\`appointment_date\`),
  KEY \`idx_approval_created\` (\`approval_status\`,\`created_at\`),
  CONSTRAINT \`fk_sb_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`),
  CONSTRAINT \`fk_sb_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_sb_barber\` FOREIGN KEY (\`barber_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_sb_slot\` FOREIGN KEY (\`availability_slot_id\`) REFERENCES \`availability_slots\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  queues: `CREATE TABLE IF NOT EXISTS \`queues\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`booking_id\` bigint(20) unsigned NOT NULL,
  \`reference_number\` varchar(50) DEFAULT NULL,
  \`queue_position\` int(11) NOT NULL,
  \`estimated_wait_time\` int(11) DEFAULT 0,
  \`queue_status\` enum('not_started','queued','waiting','serving','completed','cancelled') DEFAULT 'queued',
  \`status\` enum('waiting','serving','completed','cancelled','queued','not_started') DEFAULT 'waiting',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`booking_id\` (\`booking_id\`),
  KEY \`idx_queue_ref\` (\`reference_number\`),
  KEY \`idx_queue_pos\` (\`queue_position\`),
  CONSTRAINT \`fk_queues_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`service_bookings\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  booking_reviews: `CREATE TABLE IF NOT EXISTS \`booking_reviews\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`booking_id\` bigint(20) unsigned NOT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`service_id\` int(11) DEFAULT NULL,
  \`barber_id\` int(11) DEFAULT NULL,
  \`reviewed_by\` int(11) DEFAULT NULL,
  \`review_status\` varchar(50) DEFAULT 'pending',
  \`moved_to_queue\` tinyint(1) DEFAULT 0,
  \`queue_position\` int(11) DEFAULT NULL,
  \`confirmed_date\` date DEFAULT NULL,
  \`confirmed_time\` time DEFAULT NULL,
  \`reviewed_at\` datetime DEFAULT NULL,
  \`rejection_reason\` text DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`booking_id\` (\`booking_id\`),
  KEY \`customer_id\` (\`customer_id\`),
  KEY \`service_id\` (\`service_id\`),
  KEY \`barber_id\` (\`barber_id\`),
  KEY \`reviewed_by\` (\`reviewed_by\`),
  CONSTRAINT \`fk_br_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`service_bookings\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_br_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_br_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_br_barber\` FOREIGN KEY (\`barber_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_br_reviewer\` FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  service_ratings: `CREATE TABLE IF NOT EXISTS \`service_ratings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`booking_id\` bigint(20) unsigned NOT NULL,
  \`service_id\` int(11) NOT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`rating\` int(11) DEFAULT NULL,
  \`review\` text DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`booking_id\` (\`booking_id\`),
  KEY \`service_id\` (\`service_id\`),
  KEY \`customer_id\` (\`customer_id\`),
  CONSTRAINT \`fk_sr_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`service_bookings\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_sr_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_sr_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  service_reviews: `CREATE TABLE IF NOT EXISTS \`service_reviews\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`service_id\` int(11) NOT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`booking_id\` bigint(20) unsigned DEFAULT NULL,
  \`barber_id\` int(11) DEFAULT NULL,
  \`rating\` int(11) NOT NULL,
  \`review_title\` varchar(255) DEFAULT NULL,
  \`review_text\` text DEFAULT NULL,
  \`status\` enum('pending','approved','rejected') DEFAULT 'approved',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`service_id\` (\`service_id\`),
  KEY \`customer_id\` (\`customer_id\`),
  KEY \`booking_id\` (\`booking_id\`),
  KEY \`barber_id\` (\`barber_id\`),
  CONSTRAINT \`fk_sreviews_service\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_sreviews_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_sreviews_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`service_bookings\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_sreviews_barber\` FOREIGN KEY (\`barber_id\`) REFERENCES \`employees\` (\`employee_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  workflow_state_rules: `CREATE TABLE IF NOT EXISTS \`workflow_state_rules\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`from_state\` varchar(50) NOT NULL,
  \`to_state\` varchar(50) NOT NULL,
  \`allowed_roles\` varchar(255) NOT NULL COMMENT 'Comma-separated role names',
  \`requires_note\` tinyint(1) DEFAULT 0 COMMENT 'Whether note/reason is required',
  \`is_active\` tinyint(1) DEFAULT 1,
  \`description\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`unique_transition\` (\`from_state\`,\`to_state\`),
  KEY \`idx_from_state\` (\`from_state\`),
  KEY \`idx_to_state\` (\`to_state\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Approval workflow state transition rules';`,

  booking_workflow_history: `CREATE TABLE IF NOT EXISTS \`booking_workflow_history\` (
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`booking_id\` bigint(20) unsigned NOT NULL,
  \`reference_number\` varchar(50) DEFAULT NULL,
  \`from_status\` varchar(50) DEFAULT NULL COMMENT 'Previous approval_status',
  \`to_status\` varchar(50) NOT NULL COMMENT 'New approval_status',
  \`action\` enum('submitted','approved','rejected','changes_requested','resubmitted','cancelled','auto_approved') NOT NULL,
  \`action_by\` int(11) DEFAULT NULL COMMENT 'User ID who performed the action',
  \`action_role\` varchar(50) DEFAULT NULL COMMENT 'Role of user (Admin, Manager, Customer)',
  \`notes\` text DEFAULT NULL COMMENT 'Approval notes, rejection reason, or change requests',
  \`internal_note\` text DEFAULT NULL COMMENT 'Internal notes not visible to customer',
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`user_agent\` varchar(500) DEFAULT NULL,
  \`action_timestamp\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`idx_booking_id\` (\`booking_id\`),
  KEY \`idx_reference_number\` (\`reference_number\`),
  KEY \`idx_action\` (\`action\`),
  KEY \`idx_action_by\` (\`action_by\`),
  KEY \`idx_action_timestamp\` (\`action_timestamp\`),
  CONSTRAINT \`fk_workflow_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`service_bookings\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_workflow_user\` FOREIGN KEY (\`action_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Booking approval workflow history and state transitions';`,

  complaints: `CREATE TABLE IF NOT EXISTS \`complaints\` (
  \`complaint_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`title\` varchar(150) NOT NULL,
  \`category_id\` bigint(20) unsigned DEFAULT NULL,
  \`description\` text NOT NULL,
  \`status\` enum('Pending','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Pending',
  \`priority\` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  \`tracking_number\` varchar(50) DEFAULT NULL,
  \`resolution_notes\` text DEFAULT NULL,
  \`is_escalated\` tinyint(1) DEFAULT 0,
  \`assigned_department_id\` int(11) DEFAULT NULL,
  \`assigned_to_user_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`complaint_id\`),
  KEY \`user_id\` (\`user_id\`),
  KEY \`category_id\` (\`category_id\`),
  KEY \`assigned_department_id\` (\`assigned_department_id\`),
  KEY \`assigned_to_user_id\` (\`assigned_to_user_id\`),
  KEY \`idx_tracking_num\` (\`tracking_number\`),
  CONSTRAINT \`fk_complaint_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_complaint_cat\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`category_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_complaint_dept\` FOREIGN KEY (\`assigned_department_id\`) REFERENCES \`departments\` (\`department_id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_complaint_assigned_user\` FOREIGN KEY (\`assigned_to_user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  complaint_assignees: `CREATE TABLE IF NOT EXISTS \`complaint_assignees\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`complaint_id\` int(11) NOT NULL,
  \`assignee_id\` int(11) NOT NULL,
  \`assigned_by\` int(11) DEFAULT NULL,
  \`assigned_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`unassigned_at\` timestamp NULL DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`complaint_id\` (\`complaint_id\`),
  KEY \`assignee_id\` (\`assignee_id\`),
  KEY \`assigned_by\` (\`assigned_by\`),
  CONSTRAINT \`fk_ca_complaint\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`complaint_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_ca_assignee\` FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_ca_assigned_by\` FOREIGN KEY (\`assigned_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  complaint_comments: `CREATE TABLE IF NOT EXISTS \`complaint_comments\` (
  \`comment_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`complaint_id\` int(11) NOT NULL,
  \`user_id\` int(11) NOT NULL,
  \`comment_text\` text NOT NULL,
  \`is_internal\` tinyint(1) DEFAULT 0,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`comment_id\`),
  KEY \`complaint_id\` (\`complaint_id\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`fk_cc_complaint\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`complaint_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_cc_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  complaint_history: `CREATE TABLE IF NOT EXISTS \`complaint_history\` (
  \`history_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`complaint_id\` int(11) NOT NULL,
  \`changed_by\` int(11) DEFAULT NULL,
  \`old_status\` varchar(50) DEFAULT NULL,
  \`new_status\` varchar(50) DEFAULT NULL,
  \`change_notes\` text DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`history_id\`),
  KEY \`complaint_id\` (\`complaint_id\`),
  KEY \`changed_by\` (\`changed_by\`),
  CONSTRAINT \`fk_ch_complaint\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`complaint_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_ch_user\` FOREIGN KEY (\`changed_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  complaint_feedback: `CREATE TABLE IF NOT EXISTS \`complaint_feedback\` (
  \`feedback_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`complaint_id\` int(11) NOT NULL,
  \`user_id\` int(11) NOT NULL,
  \`rating\` int(11) DEFAULT NULL,
  \`comments\` text DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`feedback_id\`),
  KEY \`complaint_id\` (\`complaint_id\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`fk_cf_complaint\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`complaint_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_cf_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  complaint_attachments: `CREATE TABLE IF NOT EXISTS \`complaint_attachments\` (
  \`attachment_id\` int(11) NOT NULL AUTO_INCREMENT,
  \`complaint_id\` int(11) NOT NULL,
  \`file_name\` varchar(255) NOT NULL,
  \`file_path\` varchar(500) NOT NULL,
  \`file_size\` int(11) DEFAULT NULL,
  \`file_type\` varchar(100) DEFAULT NULL,
  \`uploaded_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`attachment_id\`),
  KEY \`complaint_id\` (\`complaint_id\`),
  KEY \`uploaded_by\` (\`uploaded_by\`),
  CONSTRAINT \`fk_ca_attach_complaint\` FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\` (\`complaint_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_ca_uploaded_by\` FOREIGN KEY (\`uploaded_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  cms_menus: `CREATE TABLE IF NOT EXISTS \`cms_menus\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(100) NOT NULL,
  \`path\` varchar(255) DEFAULT NULL,
  \`icon\` text DEFAULT NULL,
  \`color\` varchar(50) DEFAULT NULL,
  \`parent_id\` int(11) DEFAULT NULL,
  \`order_index\` int(11) DEFAULT 0,
  \`is_section\` tinyint(1) DEFAULT 0,
  \`is_dropdown\` tinyint(1) DEFAULT 0,
  \`is_active\` tinyint(1) DEFAULT 1,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`parent_id\` (\`parent_id\`),
  CONSTRAINT \`fk_menu_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`cms_menus\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  role_menu_permissions: `CREATE TABLE IF NOT EXISTS \`role_menu_permissions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`role_id\` int(11) NOT NULL,
  \`menu_id\` int(11) NOT NULL,
  \`can_view\` tinyint(1) DEFAULT 1,
  \`can_create\` tinyint(1) DEFAULT 0,
  \`can_edit\` tinyint(1) DEFAULT 0,
  \`can_delete\` tinyint(1) DEFAULT 0,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`role_menu_unique\` (\`role_id\`,\`menu_id\`),
  KEY \`menu_id\` (\`menu_id\`),
  CONSTRAINT \`fk_rmp_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`role_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_rmp_menu\` FOREIGN KEY (\`menu_id\`) REFERENCES \`cms_menus\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  user_menu_permissions: `CREATE TABLE IF NOT EXISTS \`user_menu_permissions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`menu_id\` int(11) NOT NULL,
  \`permission_type\` enum('allow','deny') NOT NULL DEFAULT 'allow',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`user_menu_unique\` (\`user_id\`,\`menu_id\`),
  KEY \`menu_id\` (\`menu_id\`),
  CONSTRAINT \`fk_ump_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_ump_menu\` FOREIGN KEY (\`menu_id\`) REFERENCES \`cms_menus\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  active_sessions: `CREATE TABLE IF NOT EXISTS \`active_sessions\` (
  \`user_id\` int(11) NOT NULL,
  \`jti\` varchar(255) NOT NULL,
  \`last_activity\` datetime NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`user_id\`),
  CONSTRAINT \`fk_as_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  approvalhierarchy: `CREATE TABLE IF NOT EXISTS \`approvalhierarchy\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`step_name\` varchar(100) NOT NULL,
  \`approver_role\` varchar(50) DEFAULT NULL,
  \`approver_user_id\` int(11) DEFAULT NULL,
  \`step_order\` int(11) NOT NULL DEFAULT 1,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`approver_user_id\` (\`approver_user_id\`),
  CONSTRAINT \`fk_ah_user\` FOREIGN KEY (\`approver_user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  audit_logs: `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`action\` varchar(100) NOT NULL,
  \`entity\` varchar(100) DEFAULT NULL,
  \`entity_id\` int(11) DEFAULT NULL,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`user_agent\` text DEFAULT NULL,
  \`details\` text DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  KEY \`idx_audit_action\` (\`action\`),
  KEY \`idx_audit_created\` (\`created_at\`),
  CONSTRAINT \`fk_al_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  blocked_ips: `CREATE TABLE IF NOT EXISTS \`blocked_ips\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`ip_address\` varchar(45) NOT NULL,
  \`reason\` varchar(255) DEFAULT NULL,
  \`blocked_until\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`ip_address\` (\`ip_address\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  contact_messages: `CREATE TABLE IF NOT EXISTS \`contact_messages\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`email\` varchar(100) NOT NULL,
  \`subject\` varchar(200) DEFAULT NULL,
  \`message\` text NOT NULL,
  \`status\` enum('unread','read','replied') DEFAULT 'unread',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  subscribers: `CREATE TABLE IF NOT EXISTS \`subscribers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`email\` varchar(150) NOT NULL,
  \`status\` enum('active','unsubscribed') DEFAULT 'active',
  \`subscribed_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  system_settings: `CREATE TABLE IF NOT EXISTS \`system_settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`setting_key\` varchar(100) NOT NULL,
  \`setting_value\` text DEFAULT NULL,
  \`description\` varchar(255) DEFAULT NULL,
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`setting_key\` (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  revoked_tokens: `CREATE TABLE IF NOT EXISTS \`revoked_tokens\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`token\` text NOT NULL,
  \`expires_at\` datetime NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  notifications: `CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`message\` text NOT NULL,
  \`type\` varchar(50) DEFAULT 'general',
  \`is_read\` tinyint(1) DEFAULT 0,
  \`reference_id\` int(11) DEFAULT NULL,
  \`reference_type\` varchar(50) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`fk_notif_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
};

const tableOrder = [
  'roles',
  'organization_types',
  'departments',
  'employee_positions',
  'categories',
  'service_categories',
  'employees',
  'users',
  'organization_structure',
  'services',
  'service_barber_assignments',
  'availability_slots',
  'service_bookings',
  'queues',
  'booking_reviews',
  'service_ratings',
  'service_reviews',
  'workflow_state_rules',
  'booking_workflow_history',
  'complaints',
  'complaint_assignees',
  'complaint_comments',
  'complaint_history',
  'complaint_feedback',
  'complaint_attachments',
  'cms_menus',
  'role_menu_permissions',
  'user_menu_permissions',
  'active_sessions',
  'approvalhierarchy',
  'audit_logs',
  'blocked_ips',
  'contact_messages',
  'subscribers',
  'system_settings',
  'revoked_tokens',
  'notifications'
];

console.log(`Configured ${tableOrder.length} tables in dependency order.`);

module.exports = { tableSchemas, tableOrder };

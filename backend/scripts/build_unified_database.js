const fs = require('fs');
const path = require('path');
const { tableSchemas, tableOrder } = require('./schema_definitions');

const modelsDir = path.resolve(__dirname, '../models');
const scriptsDir = path.resolve(__dirname, '../scripts');

const archiveDir = path.join(modelsDir, 'archive_split_sql');

function readSource(filename) {
  const p1 = path.join(modelsDir, filename);
  if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf8');
  const p2 = path.join(archiveDir, filename);
  if (fs.existsSync(p2)) return fs.readFileSync(p2, 'utf8');
  return '';
}

const mainSql = readSource('db_barber_backup_original.sql') || readSource('db_barber.sql');
const currentSql = readSource('db_barber_current.sql');
const seedDataSql = readSource('seed_data.sql');
const seedLetterSql = readSource('seed_letter_minimal.sql');
const workflowSql = readSource('booking_workflow_additions.sql');
const completeSql = readSource('complete_barber_schema.sql');

// Extract raw INSERT INTO / INSERT IGNORE INTO statements for a table
function extractInserts(content, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '(?:INSERT(?:\\s+IGNORE)?\\s+INTO\\s+`?' + escaped + '`?[\\s\\S]*?;)';
  const regex = new RegExp(pattern, 'gi');
  return content.match(regex) || [];
}

// Build consolidated SQL
let output = `-- ========================================================
-- Barber Management System (db_barber) Unified Database Script
-- Consolidated and Deduplicated Schema & Data
-- Auto-generated: ${new Date().toISOString()}
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS \`db_barber\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE \`db_barber\`;

SET FOREIGN_KEY_CHECKS = 0;

`;

// Section 1: Drop & Create Tables
output += `-- ========================================================\n`;
output += `-- SECTION 1: TABLE STRUCTURES (37 Tables)\n`;
output += `-- ========================================================\n\n`;

for (const tableName of tableOrder) {
  const schema = tableSchemas[tableName];
  if (!schema) {
    console.error(`Missing schema definition for: ${tableName}`);
    continue;
  }
  output += `-- --------------------------------------------------------\n`;
  output += `-- Table structure for table \`${tableName}\`\n`;
  output += `-- --------------------------------------------------------\n`;
  output += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
  output += schema + `\n\n`;
}

output += `-- ========================================================\n`;
output += `-- SECTION 2: SEED DATA & INITIAL RECORDS\n`;
output += `-- ========================================================\n\n`;

// 1. Roles
output += `--\n-- Dumping data for table \`roles\`\n--\n`;
output += `INSERT IGNORE INTO \`roles\` (\`role_id\`, \`role_name\`, \`status\`, \`created_at\`, \`updated_at\`) VALUES
(1, 'Admin', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(2, 'Barber', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(3, 'Customer', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(4, 'Manager', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(5, 'Receptionist', 1, '2026-03-01 00:00:00', '2026-03-01 00:00:00')
ON DUPLICATE KEY UPDATE \`role_name\` = VALUES(\`role_name\`), \`status\` = VALUES(\`status\`);\n\n`;

// Helper to pull clean insert block from main/current dumps
function getFirstInsert(content, tableName) {
  const inserts = extractInserts(content, tableName);
  return inserts.length > 0 ? inserts[0] : null;
}

// 2. Organization Types
const orgTypesInsert = getFirstInsert(mainSql, 'organization_types');
if (orgTypesInsert) {
  output += `--\n-- Dumping data for table \`organization_types\`\n--\n`;
  output += orgTypesInsert + '\n\n';
}

// 3. Departments
const deptInsert = getFirstInsert(mainSql, 'departments');
if (deptInsert) {
  output += `--\n-- Dumping data for table \`departments\`\n--\n`;
  output += deptInsert + '\n\n';
}

// 4. Employee Positions
const empPosInsert = getFirstInsert(mainSql, 'employee_positions');
if (empPosInsert) {
  output += `--\n-- Dumping data for table \`employee_positions\`\n--\n`;
  output += empPosInsert + '\n\n';
}

// 5. Categories
const catInserts = extractInserts(seedDataSql, 'categories');
if (catInserts.length > 0) {
  output += `--\n-- Dumping data for table \`categories\`\n--\n`;
  output += catInserts.join('\n\n') + '\n\n';
}

// 6. Service Categories
const scInserts = extractInserts(seedDataSql, 'service_categories');
if (scInserts.length > 0) {
  output += `--\n-- Dumping data for table \`service_categories\`\n--\n`;
  output += scInserts.join('\n\n') + '\n\n';
}

// 7. Employees
const empInserts = extractInserts(mainSql, 'employees');
if (empInserts.length > 0) {
  output += `--\n-- Dumping data for table \`employees\`\n--\n`;
  // Combine or use the full dump from db_barber.sql (the 60 employees)
  output += empInserts[empInserts.length - 1] + '\n\n';
}

// 8. Users
// User data: ensure Admin (user_id = 1) exists with correct password hash and role
output += `--\n-- Dumping data for table \`users\`\n--\n`;
output += `INSERT IGNORE INTO \`users\` (\`user_id\`, \`employee_id\`, \`user_name\`, \`password\`, \`role_id\`, \`status\`, \`online_flag\`, \`avatar_url\`, \`created_at\`, \`updated_at\`) VALUES
(1, 1, 'admin', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 1, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(2, 2, 'barber1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 2, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(3, 3, 'customer1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 3, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(4, 4, 'manager1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 4, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00'),
(5, 5, 'receptionist1', '$2b$10$7K3VvLfx53.pP59eYfUze.n3Xv.r5Z7b2Vf00Wv7.n4sR2.z6q4l.', 5, '1', 0, NULL, '2026-03-01 00:00:00', '2026-03-01 00:00:00')
ON DUPLICATE KEY UPDATE \`role_id\` = VALUES(\`role_id\`), \`status\` = VALUES(\`status\`);\n\n`;

// 9. Organization Structure
const orgStructInsert = getFirstInsert(mainSql, 'organization_structure');
if (orgStructInsert) {
  output += `--\n-- Dumping data for table \`organization_structure\`\n--\n`;
  output += orgStructInsert + '\n\n';
}

// 10. Services
const servicesInserts = extractInserts(seedDataSql, 'services');
if (servicesInserts.length > 0) {
  output += `--\n-- Dumping data for table \`services\`\n--\n`;
  output += servicesInserts.join('\n\n') + '\n\n';
}

// 11. Workflow State Rules
const workflowInserts = extractInserts(workflowSql, 'workflow_state_rules');
if (workflowInserts.length > 0) {
  output += `--\n-- Dumping data for table \`workflow_state_rules\`\n--\n`;
  output += workflowInserts.join('\n\n') + '\n\n';
}

// 12. CMS Menus
// Parse menus from db_barber.sql and seed_data.sql without duplicate IDs
const menuInsertsMain = extractInserts(mainSql, 'cms_menus');
const menuInsertsSeed = extractInserts(seedDataSql, 'cms_menus');
output += `--\n-- Dumping data for table \`cms_menus\`\n--\n`;
if (menuInsertsMain.length > 0) {
  // Use the comprehensive 41-menu insert from db_barber.sql
  output += menuInsertsMain[menuInsertsMain.length - 1] + '\n\n';
}
if (menuInsertsSeed.length > 0) {
  for (const s of menuInsertsSeed) {
    output += s + '\n\n';
  }
}

// 13. Role Menu Permissions
const rmpMain = extractInserts(mainSql, 'role_menu_permissions');
const rmpSeed = extractInserts(seedDataSql, 'role_menu_permissions');
output += `--\n-- Dumping data for table \`role_menu_permissions\`\n--\n`;
if (rmpMain.length > 0) {
  output += rmpMain[rmpMain.length - 1] + '\n\n';
}
if (rmpSeed.length > 0) {
  for (const s of rmpSeed) {
    output += s + '\n\n';
  }
}

// 14. User Menu Permissions
const umpMain = getFirstInsert(mainSql, 'user_menu_permissions');
if (umpMain) {
  output += `--\n-- Dumping data for table \`user_menu_permissions\`\n--\n`;
  output += umpMain + '\n\n';
}

// 15. System Settings
const settingsMain = getFirstInsert(mainSql, 'system_settings');
const settingsSeed = extractInserts(seedDataSql, 'system_settings');
output += `--\n-- Dumping data for table \`system_settings\`\n--\n`;
if (settingsMain) {
  output += settingsMain + '\n\n';
}
if (settingsSeed.length > 0) {
  for (const s of settingsSeed) {
    output += s + '\n\n';
  }
}

// 16. Contact Messages
const contactInsert = getFirstInsert(mainSql, 'contact_messages');
if (contactInsert) {
  output += `--\n-- Dumping data for table \`contact_messages\`\n--\n`;
  output += contactInsert + '\n\n';
}

// 17. Subscribers
const subInsert = getFirstInsert(mainSql, 'subscribers');
if (subInsert) {
  output += `--\n-- Dumping data for table \`subscribers\`\n--\n`;
  output += subInsert + '\n\n';
}

// 18. Audit Logs
const auditInsert = getFirstInsert(mainSql, 'audit_logs');
if (auditInsert) {
  output += `--\n-- Dumping data for table \`audit_logs\`\n--\n`;
  output += auditInsert + '\n\n';
}

// 19. Active Sessions
const sessionInsert = getFirstInsert(mainSql, 'active_sessions');
if (sessionInsert) {
  output += `--\n-- Dumping data for table \`active_sessions\`\n--\n`;
  output += sessionInsert + '\n\n';
}

// Section 3: Views
output += `-- ========================================================\n`;
output += `-- SECTION 3: DATABASE VIEWS\n`;
output += `-- ========================================================\n\n`;

output += `--\n-- View: v_booking_workflow_summary\n--\n`;
output += `CREATE OR REPLACE VIEW \`v_booking_workflow_summary\` AS
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
LEFT JOIN services s ON sb.service_id = s.id;\n\n`;

output += `--\n-- View: v_workflow_metrics\n--\n`;
output += `CREATE OR REPLACE VIEW \`v_workflow_metrics\` AS
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
ORDER BY metric_date DESC, bwh.action;\n\n`;

// Section 4: Stored Procedures
output += `-- ========================================================\n`;
output += `-- SECTION 4: STORED PROCEDURES\n`;
output += `-- ========================================================\n\n`;

output += `DROP PROCEDURE IF EXISTS \`sp_record_workflow_transition\`;
DROP PROCEDURE IF EXISTS \`sp_validate_transition\`;

DELIMITER //

CREATE PROCEDURE \`sp_record_workflow_transition\`(
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

CREATE PROCEDURE \`sp_validate_transition\`(
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
`;

const targetFile = path.join(modelsDir, 'db_barber.sql');
fs.writeFileSync(targetFile, output, 'utf8');

console.log('Successfully generated unified SQL file:');
console.log('  Target:', targetFile);
console.log('  Total size:', (output.length / 1024).toFixed(1), 'KB');
console.log('  Total lines:', output.split('\n').length);
console.log('  Total tables:', tableOrder.length);

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, 'models');
const scriptsDir = path.resolve(__dirname, 'scripts');
const migrationsDir = path.resolve(__dirname, 'migrations');

const outputPath = path.join(baseDir, 'db_barber_unified.sql');

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

function extractCreateTable(content, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the full CREATE TABLE block for a specific table, with or without backticks
  const pattern = '(CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?`?' + escaped + '`?[\\s\\S]*?ENGINE=InnoDB[\\s\\S]*?;)';
  const regex = new RegExp(pattern, 'g');
  const matches = content.match(regex);
  if (!matches || matches.length === 0) return null;
  // Return the last match (most recent definition)
  return matches[matches.length - 1];
}

function extractInsertData(content, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = 'INSERT INTO\\s+`?' + escaped + '`?[\\s\\S]*?;';
  const regex = new RegExp(pattern, 'g');
  return content.match(regex) || [];
}

// Read all source files
const current = read(path.join(baseDir, 'db_barber_current.sql'));
const main = read(path.join(baseDir, 'db_barber.sql'));
const seed = read(path.join(baseDir, 'seed_letter_minimal.sql'));
const serviceTables = read(path.join(scriptsDir, 'create_service_tables.sql'));
const ratingsTable = read(path.join(scriptsDir, 'create_service_ratings_table.sql'));
const complaintAssignees = read(path.join(scriptsDir, 'migration-complaint-assignees.sql'));
const availability = read(path.join(migrationsDir, 'availability_migration.sql'));

const allSources = [current, main, seed, serviceTables, ratingsTable, complaintAssignees, availability];

// Tables we need in order
const tableOrder = [
  'roles', 'departments', 'organization_types', 'categories',
  'employees', 'users', 'organization_structure', 'employee_positions',
  'service_categories', 'services', 'availability_slots', 'service_bookings',
  'queues', 'booking_reviews', 'service_ratings',
  'complaints', 'complaint_assignees', 'complaint_comments',
  'complaint_history', 'complaint_feedback', 'complaint_attachments',
  'cms_menus', 'role_menu_permissions', 'user_menu_permissions',
  'active_sessions', 'approvalhierarchy', 'audit_logs', 'blocked_ips',
  'contact_messages', 'subscribers', 'system_settings', 'revoked_tokens'
];

// Get best CREATE TABLE for each table (prefer current.sql, then main.sql, then scripts)
function getBestCreate(tableName) {
  // Priority: current.sql > main.sql > serviceTables > ratingsTable > complaintAssignees > availability > seed
  const priority = [current, main, serviceTables, ratingsTable, complaintAssignees, availability, seed];
  
  for (const source of priority) {
    if (!source) continue;
    const create = extractCreateTable(source, tableName);
    if (create) return create;
  }
  return null;
}

// Get all unique INSERT data for a table
function getAllInserts(tableName) {
  const seen = new Set();
  const result = [];
  
  for (const source of allSources) {
    if (!source) continue;
    const inserts = extractInsertData(source, tableName);
    for (const insert of inserts) {
      const normalized = insert.replace(/\s+/g, ' ').trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(insert);
      }
    }
  }
  return result;
}

// Build unified SQL
let sql = `-- ==========================================
-- Unified db_barber Database Script
-- Generated for XAMPP / phpMyAdmin import
-- ==========================================

CREATE DATABASE IF NOT EXISTS \`db_barber\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE \`db_barber\`;

`;

const seenTables = new Set();

for (const tableName of tableOrder) {
  const create = getBestCreate(tableName);
  if (create) {
    // Deduplicate CREATE TABLE blocks
    const normalized = create.replace(/\s+/g, ' ').trim();
    if (!seenTables.has(normalized)) {
      seenTables.add(normalized);
      
      sql += `-- ==========================================\n`;
      sql += `-- Table structure for table \`${tableName}\`\n`;
      sql += `-- ==========================================\n\n`;
      
      // Ensure DROP TABLE is present
      if (!create.includes('DROP TABLE IF EXISTS')) {
        sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      }
      
      sql += create + '\n\n';
    }
  }
  
  const inserts = getAllInserts(tableName);
  if (inserts.length > 0) {
    sql += `--\n`;
    sql += `-- Dumping data for table \`${tableName}\`\n`;
    sql += `--\n\n`;
    for (const insert of inserts) {
      sql += insert + '\n\n';
    }
  }
}

sql += `SET FOREIGN_KEY_CHECKS=1;

-- Dump completed
`;

fs.writeFileSync(outputPath, sql);

const tableCount = (sql.match(/CREATE TABLE/g) || []).length;
const insertCount = (sql.match(/INSERT INTO/g) || []).length;
const uniqueTables = tableOrder.filter(t => sql.includes(`CREATE TABLE.*${t}`)).length;
console.log('Unified SQL written to:', outputPath);
console.log('Total lines:', sql.split('\n').length);
console.log('CREATE TABLE statements:', tableCount);
console.log('INSERT INTO statements:', insertCount);
console.log('Unique tables included:', uniqueTables);

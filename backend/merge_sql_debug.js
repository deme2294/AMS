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
  const pattern = '(CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?`?' + escaped + '`?[\\s\\S]*?ENGINE=InnoDB[\\s\\S]*?;)';
  const regex = new RegExp(pattern, 'g');
  const matches = content.match(regex);
  if (!matches || matches.length === 0) return null;
  console.log(`  extractCreateTable(${tableName}) found ${matches.length} matches, using last`);
  return matches[matches.length - 1];
}

const current = read(path.join(baseDir, 'db_barber_current.sql'));
const main = read(path.join(baseDir, 'db_barber.sql'));
const seed = read(path.join(baseDir, 'seed_letter_minimal.sql'));
const serviceTables = read(path.join(scriptsDir, 'create_service_tables.sql'));
const ratingsTable = read(path.join(scriptsDir, 'create_service_ratings_table.sql'));
const complaintAssignees = read(path.join(scriptsDir, 'migration-complaint-assignees.sql'));
const availability = read(path.join(migrationsDir, 'availability_migration.sql'));

const allSources = [current, main, seed, serviceTables, ratingsTable, complaintAssignees, availability];

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

function getBestCreate(tableName) {
  const priority = [current, main, serviceTables, ratingsTable, complaintAssignees, availability, seed];
  for (let i = 0; i < priority.length; i++) {
    const source = priority[i];
    if (!source) continue;
    const create = extractCreateTable(source, tableName);
    if (create) {
      console.log(`  getBestCreate(${tableName}) returned from source ${i}`);
      return create;
    }
  }
  console.log(`  getBestCreate(${tableName}) returned null`);
  return null;
}

let sql = `-- Unified db_barber Database Script
CREATE DATABASE IF NOT EXISTS \`db_barber\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE \`db_barber\`;

`;

const seenTables = new Set();

for (const tableName of tableOrder) {
  console.log(`Processing: ${tableName}`);
  const create = getBestCreate(tableName);
  if (create) {
    const normalized = create.replace(/\s+/g, ' ').trim();
    if (!seenTables.has(normalized)) {
      seenTables.add(normalized);
      sql += `-- Table: ${tableName}\n\n`;
      if (!create.includes('DROP TABLE IF EXISTS')) {
        sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      }
      sql += create + '\n\n';
      console.log(`  ADDED to SQL`);
    } else {
      console.log(`  DUPLICATE - skipped`);
    }
  }
}

sql += `SET FOREIGN_KEY_CHECKS=1;\n`;

fs.writeFileSync(outputPath, sql);
console.log('\nDone. Total CREATE TABLE:', (sql.match(/CREATE TABLE/g) || []).length);

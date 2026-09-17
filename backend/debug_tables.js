const fs = require('fs');
const path = require('path');

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

function extractCreateTable(content, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '(CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?`?' + escaped + '`?[\\s\\S]*?ENGINE=InnoDB[\\s\\S]*?;)';
  const regex = new RegExp(pattern, 'g');
  const matches = content.match(regex);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

const baseDir = path.resolve(__dirname, 'models');
const scriptsDir = path.resolve(__dirname, 'scripts');
const migrationsDir = path.resolve(__dirname, 'migrations');

const current = read(path.join(baseDir, 'db_barber_current.sql'));
const main = read(path.join(baseDir, 'db_barber.sql'));
const seed = read(path.join(baseDir, 'seed_letter_minimal.sql'));
const serviceTables = read(path.join(scriptsDir, 'create_service_tables.sql'));
const ratingsTable = read(path.join(scriptsDir, 'create_service_ratings_table.sql'));
const complaintAssignees = read(path.join(scriptsDir, 'migration-complaint-assignees.sql'));
const availability = read(path.join(migrationsDir, 'availability_migration.sql'));

const sources = [
  { name: 'current', content: current },
  { name: 'main', content: main },
  { name: 'seed', content: seed },
  { name: 'serviceTables', content: serviceTables },
  { name: 'ratingsTable', content: ratingsTable },
  { name: 'complaintAssignees', content: complaintAssignees },
  { name: 'availability', content: availability },
];

const tables = ['service_bookings', 'complaints', 'service_ratings', 'services', 'queues', 'booking_reviews'];

for (const tableName of tables) {
  console.log(`\n=== ${tableName} ===`);
  for (const source of sources) {
    const create = extractCreateTable(source.content, tableName);
    if (create) {
      const normalized = create.replace(/\s+/g, ' ').trim();
      console.log(`  ${source.name}: ${create.substring(0, 80)}... (normalized length: ${normalized.length})`);
    }
  }
}

const fs = require('fs');
const path = require('path');

const modelsDir = path.resolve(__dirname, '../models');
const archiveDir = path.join(modelsDir, 'archive_split_sql');

if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

const filesToArchive = [
  'booking_workflow_additions.sql',
  'complete_barber_schema.sql',
  'db_barber_current.sql',
  'db_barber_merged.sql',
  'db_barber_merged_final.sql',
  'db_barber_unified.sql',
  'db_barber_unified_temp.sql',
  'seed_data.sql',
  'seed_letter_minimal.sql',
  'current_dump.txt'
];

// Backup original db_barber.sql
const origDbBarber = path.join(modelsDir, 'db_barber.sql');
const backupDbBarber = path.join(archiveDir, 'db_barber_backup_original.sql');
if (fs.existsSync(origDbBarber) && !fs.existsSync(backupDbBarber)) {
  fs.copyFileSync(origDbBarber, backupDbBarber);
  console.log(`Backed up original db_barber.sql -> ${backupDbBarber}`);
}

for (const f of filesToArchive) {
  const src = path.join(modelsDir, f);
  const dest = path.join(archiveDir, f);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Archived: ${f} -> archive_split_sql/${f}`);
  }
}

console.log('Archiving complete.');

const fs = require('fs');
const content = fs.readFileSync('models/db_barber.sql', 'utf8');
const tableName = 'service_bookings';
const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = '(CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?`?' + escaped + '`?[\\s\\S]*?ENGINE=InnoDB[\\s\\S]*?;)';
const regex = new RegExp(pattern, 'g');
const matches = content.match(regex);
console.log('Matches for service_bookings in db_barber.sql:', matches ? matches.length : 0);
if (matches) {
  for (let i = 0; i < matches.length; i++) {
    const normalized = matches[i].replace(/\s+/g, ' ').trim();
    console.log('Match', i, 'length:', matches[i].length, 'normalized length:', normalized.length);
    console.log('First 100 chars:', normalized.substring(0, 100));
  }
}

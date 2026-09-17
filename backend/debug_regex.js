const fs = require('fs');
const content = fs.readFileSync('scripts/create_service_tables.sql', 'utf8');
const tableName = 'services';
const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = '(CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?`?' + escaped + '`?[\\s\\S]*?ENGINE=InnoDB[\\s\\S]*?;)';
const regex = new RegExp(pattern, 'g');
const matches = content.match(regex);
console.log('Pattern:', pattern);
console.log('Matches found:', matches ? matches.length : 0);
if (matches) {
  console.log('First match length:', matches[0].length);
  console.log(matches[0].substring(0, 300));
}

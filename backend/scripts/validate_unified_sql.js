const fs = require('fs');
const path = require('path');

const targetSql = path.resolve(__dirname, '../models/db_barber.sql');
const content = fs.readFileSync(targetSql, 'utf8');

const creates = [...content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/gi)].map(m => m[1]);
const drops = [...content.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/gi)].map(m => m[1]);
const inserts = [...new Set([...content.matchAll(/INSERT\s+(?:IGNORE\s+)?INTO\s+`?([a-zA-Z0-9_]+)`?/gi)].map(m => m[1]))];
const views = [...content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+`?([a-zA-Z0-9_]+)`?/gi)].map(m => m[1]);
const procs = [...content.matchAll(/CREATE\s+PROCEDURE\s+`?([a-zA-Z0-9_]+)`?/gi)].map(m => m[1]);

console.log('=== Validation Report for db_barber.sql ===');
console.log('File size:', (content.length / 1024).toFixed(1), 'KB');
console.log('Lines:', content.split('\n').length);
console.log('Total CREATE TABLE statements:', creates.length);
console.log('Total DROP TABLE statements:', drops.length);
console.log('Unique tables created:', new Set(creates).size);
console.log('Tables with INSERT data (' + inserts.length + '):', inserts.join(', '));
console.log('Views (' + views.length + '):', views.join(', '));
console.log('Procedures (' + procs.length + '):', procs.join(', '));

// Check for duplicates in CREATE TABLE
const duplicates = creates.filter((item, index) => creates.indexOf(item) !== index);
if (duplicates.length > 0) {
  console.error('ERROR: Duplicate CREATE TABLE statements detected:', duplicates);
} else {
  console.log('SUCCESS: Zero duplicate CREATE TABLE statements!');
}

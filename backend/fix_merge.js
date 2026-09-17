const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const inputPath = path.join(modelsDir, 'db_barber_merged.sql');
const outputPath = path.join(modelsDir, 'db_barber_merged_final.sql');

const content = fs.readFileSync(inputPath, 'utf8');

// Remove duplicate CREATE TABLE blocks - keep only first occurrence of each table
const createTableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?\s*\(/gi;
const seenTables = new Set();
const lines = content.split('\n');
const result = [];

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const match = line.match(createTableRegex);
  
  if (match) {
    const tableName = match[1];
    if (seenTables.has(tableName)) {
      // Skip this CREATE TABLE block - find its end and remove
      let depth = 0;
      let inString = false;
      let stringChar = '';
      let j = i;
      
      while (j < lines.length) {
        const currentLine = lines[j];
        for (let c = 0; c < currentLine.length; c++) {
          const char = currentLine[c];
          if (!inString && (char === "'" || char === '"')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar) {
            inString = false;
          } else if (!inString) {
            if (char === '(') depth++;
            if (char === ')') {
              depth--;
              if (depth === 0) {
                i = j;
                break;
              }
            }
          }
        }
        if (j >= i && depth === 0) break;
        j++;
      }
      i = j + 1;
      continue;
    } else {
      seenTables.add(tableName);
    }
  }
  
  result.push(line);
  i++;
}

const final = result.join('\n');
fs.writeFileSync(outputPath, final, 'utf8');
console.log('Clean merged SQL file created at:', outputPath);
console.log('Total size:', Buffer.byteLength(final, 'utf8'), 'bytes');

const tableCount = (final.match(/CREATE TABLE/g) || []).length;
console.log('Total CREATE TABLE statements:', tableCount);

const tableNames = [];
const regex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/gi;
let m;
while ((m = regex.exec(final)) !== null) {
  if (!tableNames.includes(m[1])) {
    tableNames.push(m[1]);
  }
}
console.log('Unique tables:', tableNames.join(', '));

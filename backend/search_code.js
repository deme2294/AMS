const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(filePath, query);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.sql')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(query)) {
          console.log(`Found "${query}" in: ${filePath}`);
        }
      }
    }
  }
}

console.log('Searching for "booking_reviews"...');
searchDir(path.resolve(__dirname, '..'), 'booking_reviews');
searchDir(path.resolve(__dirname, '..'), 'booking_review');
console.log('Search complete.');
process.exit(0);

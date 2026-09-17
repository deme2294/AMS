const fs = require('fs');
const path = require('path');

const dirs = [
  'uploads/service-categories',
  'uploads/services'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${fullPath}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${fullPath}`);
  }
});

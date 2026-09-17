const db = require('./models/db.js');

db.query(`
  SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_NAME = 'availability_slots' AND COLUMN_NAME = 'barber_id'
`, (err, results) => {
  if (err) {
    console.error('Error checking constraints:', err);
    process.exit(1);
  }
  
  console.log('Barber ID constraints:');
  console.table(results);
  process.exit(0);
});

const db = require('./models/db.js');

db.query('SHOW TABLES LIKE "availability_slots"', (err, results) => {
  if (err) {
    console.error('Error checking table:', err);
    process.exit(1);
  }
  
  console.log('availability_slots table exists:', results.length > 0);
  
  if (results.length > 0) {
    db.query('DESCRIBE availability_slots', (err, columns) => {
      if (err) {
        console.error('Error describing table:', err);
      } else {
        console.log('Table columns:');
        console.table(columns);
      }
      process.exit(0);
    });
  } else {
    console.log('Table does not exist!');
    process.exit(0);
  }
});

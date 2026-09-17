const db = require('../models/db.js');
console.log('Modifying booking_reviews table to make reviewed_by and barber_id nullable...');

const queries = [
  'ALTER TABLE booking_reviews MODIFY reviewed_by INT NULL',
  'ALTER TABLE booking_reviews MODIFY barber_id INT NULL'
];

async function run() {
  for (const q of queries) {
    try {
      await db.promise().query(q);
      console.log(`Success: ${q}`);
    } catch (err) {
      console.error(`Error executing "${q}":`, err.message);
    }
  }
  process.exit(0);
}

run();

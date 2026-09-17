const db = require('./models/db.js');
db.query('DESCRIBE booking_reviews', (err, results) => {
  if (err) console.error(err);
  else console.log(results);
  process.exit(0);
});

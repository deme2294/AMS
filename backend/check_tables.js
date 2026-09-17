const db = require('./models/db.js');
console.log('Checking service tables...');
db.query('SHOW TABLES LIKE "service_categories"', (err, results) => {
  console.log('service_categories table exists:', results.length > 0);
  db.query('SHOW TABLES LIKE "services"', (err, results) => {
    console.log('services table exists:', results.length > 0);
    db.query('SELECT COUNT(*) as cat_count FROM service_categories', (err, results) => {
      console.log('Categories count:', results[0].cat_count);
      db.query('SELECT COUNT(*) as serv_count FROM services', (err, results) => {
        console.log('Services count:', results[0].serv_count);
        process.exit(0);
      });
    });
  });
});

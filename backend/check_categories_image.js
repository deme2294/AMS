const db = require('./models/db.js');
db.query("SELECT * FROM service_categories LIMIT 3", (err, results) => {
  console.log('Current categories:');
  results.forEach(c => {
    console.log(`- ID: ${c.id}, Name: ${c.category_name}, Image: ${c.image}`);
  });
  process.exit(0);
});

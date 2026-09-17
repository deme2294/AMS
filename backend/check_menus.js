const db = require('./models/db.js');
console.log('Checking menu items related to services...');
db.query('SELECT * FROM menus WHERE title LIKE "%service%" OR path LIKE "%service%"', (err, results) => {
  console.log('Service menu items:', results);
  db.query('SELECT * FROM menus ORDER BY id DESC LIMIT 20', (err, results) => {
    console.log('Recent menu items:', JSON.stringify(results, null, 2));
    process.exit(0);
  });
});

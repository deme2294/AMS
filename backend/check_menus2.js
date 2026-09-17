const db = require('./models/db.js');
console.log('Checking if menus table exists...');
db.query('SHOW TABLES LIKE "menus"', (err, results) => {
  console.log('menus table exists:', results.length > 0);
  if (results.length > 0) {
    db.query('SELECT * FROM menus ORDER BY id DESC LIMIT 10', (err, results) => {
      console.log('Recent menu items:', JSON.stringify(results, null, 2));
      db.query('SELECT COUNT(*) as count FROM menus', (err, results) => {
        console.log('Total menus:', results[0].count);
        process.exit(0);
      });
    });
  } else {
    console.log('menus table does not exist');
    process.exit(0);
  }
});

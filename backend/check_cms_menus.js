const db = require('./models/db.js');
db.query('SHOW TABLES LIKE "cms_menus"', (err, results) => {
  console.log('cms_menus table exists:', results.length > 0);
  if (results.length > 0) {
    db.query('SELECT COUNT(*) as count FROM cms_menus', (err, results) => {
      console.log('Total menu items:', results[0].count);
      db.query('SELECT * FROM cms_menus ORDER BY id ASC LIMIT 20', (err, results) => {
        console.log('Menu items:', results);
        process.exit(0);
      });
    });
  } else {
    console.log('cms_menus table NOT found!');
    process.exit(0);
  }
});

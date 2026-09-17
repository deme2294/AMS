const db = require('./models/db.js');
db.query('SHOW TABLES', (err, results) => {
  console.log('All tables in database:');
  results.forEach(r => console.log(' -', Object.values(r)[0]));
  
  // Check specific tables
  const requiredTables = ['cms_menus', 'role_menu_permissions', 'service_categories', 'services', 'service_bookings'];
  console.log('\nChecking required tables:');
  requiredTables.forEach(table => {
    db.query(`SHOW TABLES LIKE "${table}"`, (err, res) => {
      console.log(`${table}: ${res.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    });
  });
  setTimeout(() => process.exit(0), 500);
});

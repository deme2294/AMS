const db = require('./models/db.js');
const adminUserIds = [3, 18, 21, 24, 27]; // from earlier query
db.query(`
  SELECT * FROM user_menu_permissions 
  WHERE user_id IN (?) AND menu_id IN (100, 101, 102)
`, [adminUserIds], (err, results) => {
  console.log('User-specific overrides for Services menu:');
  if (results.length === 0) {
    console.log('No overrides found.');
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  process.exit(0);
});

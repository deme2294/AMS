const db = require('./models/db.js');
console.log('Checking role_menu_permissions for menu IDs 100, 101, 102...');
db.query(`
  SELECT r.role_name, mp.* 
  FROM role_menu_permissions mp
  JOIN roles r ON mp.role_id = r.role_id
  WHERE mp.menu_id IN (100, 101, 102)
  ORDER BY mp.menu_id, r.role_name
`, (err, results) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('Role permissions for Services menu:');
  if (results.length === 0) {
    console.log('NONE - No role has permission for Services menu!');
  } else {
    results.forEach(r => {
      console.log(` - Menu ID ${r.menu_id}: ${r.role_name} (role_id=${r.role_id})`);
    });
  }
  process.exit(0);
});

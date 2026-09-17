const db = require('./models/db.js');
console.log('Checking role_menu_permissions for Services menu (IDs 100, 101, 102)...');
db.query(`
  SELECT r.role_name, m.title, mp.menu_id 
  FROM role_menu_permissions mp
  JOIN roles r ON mp.role_id = r.role_id
  JOIN cms_menus m ON mp.menu_id = m.id
  WHERE mp.menu_id IN (100, 101, 102)
  ORDER BY r.role_name, mp.menu_id
`, (err, results) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('Permissions granted:');
  results.forEach(r => {
    console.log(` - ${r.role_name} can access "${r.title}" (menu_id: ${r.menu_id})`);
  });
  
  if (results.length === 0) {
    console.log('No permissions found for Services menu items!');
  }
  
  // Also check which roles exist
  db.query('SELECT role_id, role_name FROM roles', (err, roles) => {
    console.log('\nAvailable roles:');
    roles.forEach(r => console.log(` - ${r.role_id}: ${r.role_name}`));
    process.exit(0);
  });
});

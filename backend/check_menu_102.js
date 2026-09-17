const db = require('./models/db.js');
db.query('SELECT id, title, path, is_section, is_dropdown, is_active FROM cms_menus WHERE id = 102', (err, results) => {
  console.log('Menu ID 102 (All Services):');
  console.log(results[0]);
  db.query('SELECT * FROM role_menu_permissions WHERE menu_id = 102', (err, perms) => {
    console.log('\nPermissions for menu 102:');
    console.log(perms);
    db.query('SELECT r.role_name FROM roles r JOIN role_menu_permissions mp ON r.role_id = mp.role_id WHERE mp.menu_id = 102', (err, roles) => {
      console.log('\nRoles with access:');
      console.log(roles.map(r => r.role_name));
      process.exit(0);
    });
  });
});

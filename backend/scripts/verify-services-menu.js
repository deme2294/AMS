const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_barber'
  });

  console.log('=== Services Menu Structure ===\n');
  
  // Get Services section and its children
  const [menus] = await conn.query(
    "SELECT id, title, path, parent_id, order_index, is_active FROM cms_menus WHERE parent_id = 100 OR id = 100 ORDER BY order_index"
  );
  
  console.table(menus);
  
  // Verify permissions
  console.log('\n=== Menu Permissions ===\n');
  const [perms] = await conn.query(
    "SELECT m.title, r.role_name, rm.menu_id FROM role_menu_permissions rm JOIN cms_menus m ON rm.menu_id = m.id JOIN roles r ON rm.role_id = r.role_id WHERE m.path = '/service-submission'"
  );
  
  console.table(perms);
  
  await conn.end();
  console.log('\n✓ Verification complete!');
})();

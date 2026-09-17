const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'db_barber'});
  console.log('Connected');
  const [result] = await conn.query("UPDATE cms_menus SET parent_id = 100, order_index = 3 WHERE path = '/service-submission'");
  console.log('Updated:', result.affectedRows);
  const [menus] = await conn.query("SELECT id, title, path, parent_id, order_index FROM cms_menus WHERE parent_id = 100 ORDER BY order_index");
  console.table(menus);
  await conn.end();
})();

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_barber'
  });
  const [rows] = await db.query('SELECT * FROM cms_menus ORDER BY id ASC');
  console.log('Current cms_menus rows:');
  console.table(rows);
  await db.end();
})();

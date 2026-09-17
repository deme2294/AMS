const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_barber'
  });
  const [rows] = await db.query('SHOW COLUMNS FROM cms_menus');
  console.log(rows.map(r => `${r.Field} (${r.Type}) Key: ${r.Key}`).join('\n'));
  await db.end();
})();

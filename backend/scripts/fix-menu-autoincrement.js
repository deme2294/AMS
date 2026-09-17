const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_barber'
  });
  try {
    await db.query('ALTER TABLE cms_menus MODIFY COLUMN id INT(11) NOT NULL AUTO_INCREMENT');
    console.log('✅ cms_menus.id is now AUTO_INCREMENT');
  } catch (err) {
    console.error('❌ Error altering table:', err.message);
  }
  await db.end();
})();

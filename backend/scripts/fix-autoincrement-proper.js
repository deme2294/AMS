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
    // 1. Ensure id column has unique values - find max
    const [maxRes] = await db.query("SELECT MAX(id) as max_id FROM cms_menus");
    const maxId = maxRes[0].max_id || 0;
    console.log(`Current max id: ${maxId}`);

    // 2. Alter to AUTO_INCREMENT and set next value
    await db.query('ALTER TABLE cms_menus MODIFY COLUMN id INT(11) NOT NULL AUTO_INCREMENT');
    await db.query(`ALTER TABLE cms_menus AUTO_INCREMENT = ${maxId + 1}`);
    console.log(`✅ Fixed auto_increment. Next id will be ${maxId + 1}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  await db.end();
})();

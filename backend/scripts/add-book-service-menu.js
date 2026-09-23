/**
 * Script: Add 'Book Service' Menu Item
 * Adds menu item for '/services/book/12' under Services and Bookings
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_barber',
};

const ICON_BOOKING = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>';

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to database:', config.database);

  try {
    const [existing] = await conn.query('SELECT * FROM cms_menus WHERE path = ?', ['/services/book/12']);
    let menuId;

    if (existing.length === 0) {
      const [maxRes] = await conn.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cms_menus');
      const nextId = maxRes[0].next_id;

      await conn.query(
        `INSERT INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextId, 'Book Service', '/services/book/12', ICON_BOOKING, 'blue', 100, 4, 0, 0, 1]
      );
      menuId = nextId;
      console.log('✅ Inserted "Book Service" into cms_menus with ID:', menuId);
    } else {
      menuId = existing[0].id;
      console.log('ℹ️ Menu already exists with ID:', menuId);
    }

    // Assign permissions to all roles 1, 2, 3, 4, 5
    for (const roleId of [1, 2, 3, 4, 5]) {
      const [perm] = await conn.query(
        'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
        [roleId, menuId]
      );
      if (perm.length === 0) {
        await conn.query(
          'INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 0)',
          [roleId, menuId]
        );
        console.log(`   ✓ Granted role ${roleId} access to Book Service`);
      }
    }

    console.log('🎉 Done successfully!');
  } finally {
    await conn.end();
  }
}

run().catch(console.error);

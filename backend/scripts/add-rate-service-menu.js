/**
 * Script: Add 'Rate Service' Menu Item
 * Adds menu item for '/rate-service/15' under Services (parent_id: 100)
 * and grants permissions to all roles (1, 2, 3, 4, 5)
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_barber',
};

const ICON_STAR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>';

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to database:', config.database);

  try {
    const [existing] = await conn.query('SELECT * FROM cms_menus WHERE path = ?', ['/rate-service/15']);
    let menuId;

    if (existing.length === 0) {
      const [maxRes] = await conn.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cms_menus');
      const nextId = maxRes[0].next_id;

      await conn.query(
        `INSERT INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextId, 'Rate Service', '/rate-service/15', ICON_STAR, 'yellow', 100, 5, 0, 0, 1]
      );
      menuId = nextId;
      console.log('✅ Inserted "Rate Service" into cms_menus with ID:', menuId);
    } else {
      menuId = existing[0].id;
      console.log('ℹ️ Menu already exists with ID:', menuId);
    }

    // Assign permissions to all roles 1 (Admin), 2 (Manager), 3 (Barber), 4 (Receptionist), 5 (Customer)
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
        console.log(`   ✓ Granted role ${roleId} access to Rate Service`);
      }
    }

    console.log('🎉 Rate Service menu setup complete!');
  } finally {
    await conn.end();
  }
}

run().catch(console.error);

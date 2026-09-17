/**
 * Seed Script: Component Library Menu
 * Run: node scripts/seed-components-menu.js
 *
 * Inserts the "Component Library" menu item under the Settings section (id=7)
 * and grants role_id=1 (Admin) permission to access it.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'db_barber',
};

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>`;

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to database:', config.database);

  try {
    // 1. Check if menu already exists
    const [existing] = await conn.execute(
      "SELECT id FROM cms_menus WHERE path = '/admin/components' LIMIT 1"
    );

    let menuId;
    if (existing.length > 0) {
      menuId = existing[0].id;
      console.log(`ℹ️  Menu already exists with id=${menuId}. Skipping INSERT.`);
    } else {
      // 2. Insert menu item — placed under Settings section (parent_id=7)
      const [result] = await conn.execute(
        `INSERT INTO cms_menus (title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Component Library', '/admin/components', ICON, 'violet', 7, 83, 0, 0, 1]
      );
      menuId = result.insertId;
      console.log(`✅ Inserted menu: "Component Library" with id=${menuId}`);
    }

    // 3. Grant Admin (role_id=1) permission
    const [permCheck] = await conn.execute(
      'SELECT * FROM role_menu_permissions WHERE role_id = 1 AND menu_id = ?',
      [menuId]
    );
    if (permCheck.length > 0) {
      console.log('ℹ️  Admin permission already exists. Skipping.');
    } else {
      await conn.execute(
        'INSERT INTO role_menu_permissions (role_id, menu_id) VALUES (1, ?)',
        [menuId]
      );
      console.log('✅ Granted Admin (role_id=1) access to Component Library.');
    }

    // 4. Print summary
    const [menuRow] = await conn.execute(
      'SELECT * FROM cms_menus WHERE id = ?', [menuId]
    );
    console.log('\n📋 Menu Entry:');
    console.table(menuRow.map(r => ({ id: r.id, title: r.title, path: r.path, color: r.color, active: r.is_active })));

    console.log('\n🎉 Done! Restart your backend server and refresh the browser.');
    console.log("   You'll see 'Component Library' in the Settings section of the sidebar.");

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await conn.end();
  }
}

run();

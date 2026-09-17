/**
 * Script: Add 'Add Service' Menu Item
 * Adds a child menu item 'Add Service' under 'All Services' in the sidebar navigation
 * Run: node scripts/add-add-service-menu.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_barber',
};

const ICON_ADD_SERVICE = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>';

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to database:', config.database);

  try {
    // Find the 'All Services' parent menu item
    const [allServicesMenu] = await conn.query(
      "SELECT id FROM cms_menus WHERE path = '/services' AND is_section = 0 LIMIT 1"
    );

    if (allServicesMenu.length === 0) {
      console.log('❌ "All Services" menu item not found. Please run seed-service-menus.js first.');
      await conn.end();
      return;
    }

    const parentMenuId = allServicesMenu[0].id;
    console.log('ℹ️  Found "All Services" menu item with id:', parentMenuId);

    // Check if 'Add Service' menu item already exists
    const [existing] = await conn.query(
      "SELECT id FROM cms_menus WHERE path = '/service-submission' AND parent_id = ? LIMIT 1",
      [parentMenuId]
    );

    if (existing.length > 0) {
      console.log('ℹ️  "Add Service" menu item already exists (id=' + existing[0].id + ')');
      await conn.end();
      return;
    }

    // Get next available ID
    const [maxRes] = await conn.query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cms_menus");
    const nextId = maxRes[0].next_id;

    // Insert the 'Add Service' menu item
    await conn.query(
      `INSERT INTO cms_menus 
       (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        'Add Service',
        '/service-submission',
        ICON_ADD_SERVICE,
        'green',
        parentMenuId,
        3,
        0,
        0,
        1
      ]
    );
    console.log('✅ Created "Add Service" menu item (id=' + nextId + ', path=/service-submission)');

    // Grant Admin permission
    const ADMIN_ROLE_ID = 1;
    const BARBER_ROLE_ID = 2;

    const [perm1] = await conn.query(
      'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
      [ADMIN_ROLE_ID, nextId]
    );
    if (perm1.length === 0) {
      await conn.execute(
        'INSERT INTO role_menu_permissions (role_id, menu_id) VALUES (?, ?)',
        [ADMIN_ROLE_ID, nextId]
      );
      console.log('   ✓ Granted Admin (role ' + ADMIN_ROLE_ID + ') access');
    }

    // Grant Barber permission
    const [perm2] = await conn.query(
      'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
      [BARBER_ROLE_ID, nextId]
    );
    if (perm2.length === 0) {
      await conn.execute(
        'INSERT INTO role_menu_permissions (role_id, menu_id) VALUES (?, ?)',
        [BARBER_ROLE_ID, nextId]
      );
      console.log('   ✓ Granted Barber (role ' + BARBER_ROLE_ID + ') access');
    }

    console.log('\n📋 Updated Services menu structure:');
    const [menus] = await conn.query(
      `SELECT id, title, path, parent_id, order_index 
       FROM cms_menus 
       WHERE parent_id = ? OR id = ?
       ORDER BY order_index ASC`,
      [parentMenuId, parentMenuId]
    );
    console.table(menus.map(m => ({
      id: m.id, 
      title: m.title, 
      path: m.path || '(section)', 
      parent: m.parent_id, 
      order: m.order_index
    })));

    console.log('\n🎉 Menu item added successfully. Restart backend and refresh browser.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await conn.end();
  }
}

run();

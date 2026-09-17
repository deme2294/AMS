/**
 * Seed Script: Service Management Menu Items
 * Run: node scripts/seed-service-menus.js
 *
 * This script explicitly sets IDs to avoid AUTO_INCREMENT issues.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_barber',
};

const ICONS = {
  section: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>',
  category: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>',
  service: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>',
};

const SECTION_LABEL = 'Services';

// Menu items to insert
const MENU_ITEMS = [
  {
    id: 100,
    title: SECTION_LABEL,
    path: '',
    icon: ICONS.section,
    color: 'sky',
    parent_id: null,
    order_index: 90,
    is_section: 1,
    is_dropdown: 0,
    is_active: 1,
  },
  {
    id: 101,
    title: 'Categories',
    path: '/services/categories',
    icon: ICONS.category,
    color: 'blue',
    parent_id: 100,
    order_index: 1,
    is_section: 0,
    is_dropdown: 0,
    is_active: 1,
  },
  {
    id: 102,
    title: 'All Services',
    path: '/services',
    icon: ICONS.service,
    color: 'indigo',
    parent_id: 100,
    order_index: 2,
    is_section: 0,
    is_dropdown: 0,
    is_active: 1,
  },
];

const ADMIN_ROLE_ID = 1;
const BARBER_ROLE_ID = 2;

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to database:', config.database);

  try {
    // Get next available ID
    const [maxRes] = await conn.query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cms_menus");
    let nextAutoId = maxRes[0].next_id;

    for (const item of MENU_ITEMS) {
      // Check if already exists by path (skip section with empty path by title)
      let whereClause = item.path ? 'path = ?' : 'title = ? AND parent_id IS NULL';
      let params = item.path ? [item.path] : [item.title];

      const [existing] = await conn.query(
        `SELECT id FROM cms_menus WHERE ${whereClause} LIMIT 1`,
        params
      );

      if (existing.length > 0) {
        console.log(`ℹ️  Menu item "${item.title}" already exists (id=${existing[0].id})`);
        continue;
      }

      // Determine ID: use predefined ID if within range and not taken, else use nextAutoId++
      const [idCheck] = await conn.query('SELECT 1 FROM cms_menus WHERE id = ?', [item.id]);
      const finalId = idCheck.length === 0 ? item.id : (nextAutoId++);

      await conn.query(
        `INSERT INTO cms_menus 
         (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalId,
          item.title,
          item.path,
          item.icon,
          item.color,
          item.parent_id,
          item.order_index,
          item.is_section,
          item.is_dropdown,
          item.is_active
        ]
      );
      console.log(`✅ Created menu: "${item.title}" (id=${finalId}, path=${item.path || '(section)'})`);

      // Grant Admin permission
      const [perm1] = await conn.query(
        'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
        [ADMIN_ROLE_ID, finalId]
      );
      if (perm1.length === 0) {
        await conn.execute(
          'INSERT INTO role_menu_permissions (role_id, menu_id) VALUES (?, ?)',
          [ADMIN_ROLE_ID, finalId]
        );
        console.log(`   ✓ Granted Admin (role ${ADMIN_ROLE_ID}) access`);
      }

      // Grant Barber permission
      const [perm2] = await conn.query(
        'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
        [BARBER_ROLE_ID, finalId]
      );
      if (perm2.length === 0) {
        await conn.execute(
          'INSERT INTO role_menu_permissions (role_id, menu_id) VALUES (?, ?)',
          [BARBER_ROLE_ID, finalId]
        );
        console.log(`   ✓ Granted Barber (role ${BARBER_ROLE_ID}) access`);
      }
    }

    // Summary
    console.log('\n📋 Services section menu:');
    const [menus] = await conn.query(
      `SELECT id, title, path, parent_id, order_index, is_section 
       FROM cms_menus 
       WHERE id >= ? OR parent_id = ?
       ORDER BY order_index ASC`,
      [100, 100]
    );
    console.table(menus.map(m => ({
      id: m.id, title: m.title, path: m.path || '(section)', parent: m.parent_id, order: m.order_index
    })));

    console.log('\n🎉 Menu items added/verified. Restart backend and refresh browser.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await conn.end();
  }
}

run();

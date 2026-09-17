const db = require('./models/db.js');

const menuIds = [100, 101, 102];
const barberRoleId = 2;

async function grantBarberPermissions() {
  try {
    for (const menuId of menuIds) {
      const [existing] = await db.promise().query(
        'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
        [barberRoleId, menuId]
      );
      if (existing.length === 0) {
        await db.promise().query(
          'INSERT INTO role_menu_permissions (role_id, menu_id) VALUES (?, ?)',
          [barberRoleId, menuId]
        );
        console.log(`✅ Granted Barber (role ${barberRoleId}) access to menu_id ${menuId}`);
      } else {
        console.log(`ℹ️  Barber already has access to menu_id ${menuId}`);
      }
    }
    console.log('\n✅ Permission setup complete.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    db.end();
  }
}

grantBarberPermissions();

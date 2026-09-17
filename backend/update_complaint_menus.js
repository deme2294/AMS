const db = require('./models/db');

async function updateComplaintMenus() {
  try {
    // Update Manage Complaints path
    await db.promise().query(
      'UPDATE cms_menus SET path = ? WHERE id = ?',
      ['/complaints/manage', 48]
    );
    
    // Update Submit Complaint path  
    await db.promise().query(
      'UPDATE cms_menus SET path = ? WHERE id = ?',
      ['/complaints/internal', 49]
    );
    
    console.log('Complaint menu paths updated successfully:');
    console.log('- Manage Complaints: /complaints/manage');
    console.log('- Submit Complaint: /complaints/internal');
    
    // Add Analytics submenu under Complaints
    const [maxId] = await db.promise().query('SELECT MAX(id) as maxId FROM cms_menus');
    const nextId = (maxId[0]?.maxId || 0) + 1;
    
    await db.promise().query(`
      INSERT INTO cms_menus (id, title, path, parent_id, order_index, is_section, is_dropdown, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextId,
      'Complaint Analytics',
      '/complaints/analytics',
      47, // Parent: Complaints menu
      3,  // Order index
      0,  // is_section
      0,  // is_dropdown
      1   // is_active
    ]);
    
    console.log('Added Complaint Analytics submenu: /complaints/analytics');
    
  } catch (error) {
    console.error('Error updating menus:', error);
  }
  process.exit(0);
}

updateComplaintMenus();

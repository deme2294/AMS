// Script to add complaint menu items to cms_menus table
const db = require('../models/db');

async function addComplaintMenus() {
    try {
        console.log('Adding complaint menu items...');
        
        // Check if parent Complaints menu already exists
        const [existing] = await db.promise().query(
            "SELECT id FROM cms_menus WHERE title = 'Complaints' AND parent_id = 4"
        );
        
        let parentId;
        if (existing.length > 0) {
            parentId = existing[0].id;
            console.log('Parent menu already exists with ID:', parentId);
        } else {
            // Insert parent menu (Complaints dropdown)
            const [result] = await db.promise().query(
                `INSERT INTO cms_menus (title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                VALUES ('Complaints', '', 'fas fa-exclamation-circle', 'blue', 4, 3, 0, 1, 1)`
            );
            parentId = result.insertId;
            console.log('Created parent menu with ID:', parentId);
        }
        
        // Add sub-menu items
        const subMenus = [
            { title: 'Manage Complaints', path: '/interaction/complaints/manage', order: 1 },
            { title: 'Submit Complaint', path: '/interaction/complaints/submit', order: 2 }
        ];
        
        for (const menu of subMenus) {
            // Check if already exists
            const [existingSub] = await db.promise().query(
                "SELECT id FROM cms_menus WHERE path = ? AND parent_id = ?",
                [menu.path, parentId]
            );
            
            if (existingSub.length === 0) {
                await db.promise().query(
                    `INSERT INTO cms_menus (title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                    VALUES (?, ?, '', 'blue', ?, ?, 0, 0, 1)`,
                    [menu.title, menu.path, parentId, menu.order]
                );
                console.log(`Added: ${menu.title}`);
            } else {
                console.log(`Already exists: ${menu.title}`);
            }
        }
        
        console.log('\n✅ Complaint menus added successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

addComplaintMenus();
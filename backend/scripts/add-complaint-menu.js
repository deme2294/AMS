// Script to add Complaint menus to the database
const db = require('../models/db');

async function addComplaintMenus() {
    try {
        console.log('Adding Complaint menus to database...');

        // Get the max order_index to place complaint menus after Users
        const [maxOrder] = await db.promise().query(
            "SELECT MAX(order_index) as max_order FROM cms_menus"
        );
        let newOrderIndex = (maxOrder[0].max_order || 0) + 1;

        // Get the next available ID
        const [maxId] = await db.promise().query(
            "SELECT MAX(id) as max_id FROM cms_menus"
        );
        let newId = (maxId[0].max_id || 0) + 1;

        // Define the complaint menu items
        const complaintMenus = [
            {
                title: 'Manage Complaints',
                path: '/complaints/manage',
                icon: 'fas fa-exclamation-circle',
                color: 'blue'
            },
            {
                title: 'Submit Complaint',
                path: '/complaints/submit',
                icon: 'fas fa-plus-circle',
                color: 'green'
            },
            {
                title: 'Public Complaint Form',
                path: '/complaints/public',
                icon: 'fas fa-globe',
                color: 'purple'
            }
        ];

        // Insert each menu item
        for (const menu of complaintMenus) {
            // Check if the menu already exists
            const [existing] = await db.promise().query(
                "SELECT id FROM cms_menus WHERE path = ?",
                [menu.path]
            );

            if (existing.length > 0) {
                console.log(`✅ Menu already exists: ${menu.title} (${menu.path})`);
                continue;
            }

            // Insert the menu with explicit ID
            const [result] = await db.promise().query(
                `INSERT INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newId,
                    menu.title,
                    menu.path,
                    menu.icon,
                    menu.color,
                    null, // No parent (root level)
                    newOrderIndex,
                    0, // Not a section header
                    0, // Not a dropdown
                    1  // Active
                ]
            );

            console.log(`✅ Menu added: ${menu.title} (${menu.path})`);
            console.log(`   Menu ID: ${newId}`);
            console.log(`   Order: ${newOrderIndex}`);

            newId++;
            newOrderIndex++;
        }

        console.log('✅ All complaint menus processed successfully!');

    } catch (error) {
        console.error('❌ Error adding complaint menus:', error.message);
    } finally {
        process.exit(0);
    }
}

addComplaintMenus();

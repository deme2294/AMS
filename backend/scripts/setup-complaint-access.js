// Script to add Complaint menus and permissions - Admin only for Manage, all roles for Submit
const db = require('../models/db');

async function setupComplaintMenus() {
    const connection = await db.promise().getConnection();
    
    try {
        console.log('Setting up Complaint menus and permissions...\n');
        
        await connection.beginTransaction();
        
        // Check if parent dropdown already exists
        const [existingParent] = await connection.query(
            "SELECT id FROM cms_menus WHERE path = '#complaints'"
        );
        
        let parentId;
        if (existingParent.length > 0) {
            parentId = existingParent[0].id;
            console.log(`✅ Parent dropdown already exists: Complaints - ID: ${parentId}`);
        } else {
            // Get max order_index and max id
            const [maxOrder] = await connection.query("SELECT MAX(order_index) as max_order FROM cms_menus");
            const [maxId] = await connection.query("SELECT MAX(id) as max_id FROM cms_menus");
            parentId = (maxId[0].max_id || 0) + 1;
            const newOrder = (maxOrder[0].max_order || 0) + 1;
            
            await connection.query(
                `INSERT INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                 VALUES (?, 'Complaints', '#complaints', 'fas fa-exclamation-circle', 'blue', NULL, ?, 0, 1, 1)`,
                [parentId, newOrder]
            );
            console.log(`✅ Parent dropdown created: Complaints - ID: ${parentId}`);
        }
        
        // Check existing child menu items
        const [existingMenus] = await connection.query(
            "SELECT id, title, path FROM cms_menus WHERE path LIKE '/interaction/complaints%'"
        );
        
        console.log('Existing complaint menus:', existingMenus);
        
        // Define complaint menu items with correct paths - now using parentId
        const complaintMenus = [
            {
                title: 'Manage Complaints',
                path: '/interaction/complaints/manage',
                icon: 'fas fa-list-alt',
                color: 'blue'
            },
            {
                title: 'Submit Complaint',
                path: '/interaction/complaints/submit',
                icon: 'fas fa-plus-circle',
                color: 'green'
            },
            {
                title: 'Complaint Analytics',
                path: '/interaction/complaints/analytics',
                icon: 'fas fa-chart-bar',
                color: 'purple'
            }
        ];
        
        const menuIds = {};
        
        for (const menu of complaintMenus) {
            // Check if menu already exists
            const [existing] = await connection.query(
                "SELECT id FROM cms_menus WHERE path = ?",
                [menu.path]
            );
            
            if (existing.length > 0) {
                menuIds[menu.path] = existing[0].id;
                console.log(`✅ Menu already exists: ${menu.title} (${menu.path}) - ID: ${existing[0].id}`);
            } else {
                // Get max order_index
                const [maxOrder] = await connection.query(
                    "SELECT MAX(order_index) as max_order FROM cms_menus"
                );
                const newOrder = (maxOrder[0].max_order || 0) + 1;
                
                // Get max id
                const [maxId] = await connection.query(
                    "SELECT MAX(id) as max_id FROM cms_menus"
                );
                const newId = (maxId[0].max_id || 0) + 1;
                
                // Insert the menu with parentId
                await connection.query(
                    `INSERT INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newId,
                        menu.title,
                        menu.path,
                        menu.icon,
                        menu.color,
                        parentId,
                        newOrder,
                        0,
                        0,
                        1
                    ]
                );
                
                menuIds[menu.path] = newId;
                console.log(`✅ Menu added: ${menu.title} (${menu.path}) - ID: ${newId} under parent ${parentId}`);
            }
        }
        
        // Update existing child menus to use the parent dropdown
        for (const [path, menuId] of Object.entries(menuIds)) {
            await connection.query(
                "UPDATE cms_menus SET parent_id = ? WHERE id = ?",
                [parentId, menuId]
            );
            console.log(`✅ Linked menu ${menuId} to parent ${parentId}`);
        }
        
        // First, remove CEO and Manager permissions
        await connection.query("DELETE FROM role_menu_permissions WHERE role_id IN (2, 3, 4) AND menu_id IN (SELECT id FROM cms_menus WHERE path LIKE '/interaction/complaints%' OR path = '#complaints')");
        console.log("✅ Removed CEO (3) and Manager (2,4) permissions");
        
        // Remove duplicate old complaint menus (IDs 47-50)
        await connection.query("DELETE FROM cms_menus WHERE id IN (47, 48, 49, 50)");
        console.log("✅ Removed duplicate old complaint menus (IDs 47-50)");
        
        // Add permissions for the parent dropdown - Admin only (1)
        const adminRoleId = 1;
        
        // Check if parent permission exists for Admin
        const [existingParentPerm] = await connection.query(
            "SELECT * FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?",
            [adminRoleId, parentId]
        );
        
        if (existingParentPerm.length === 0) {
            await connection.query(
                "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 0, 0, 0)",
                [adminRoleId, parentId]
            );
            console.log(`✅ Added permission for role ${adminRoleId} to access Complaints dropdown (menu ${parentId})`);
        } else {
            console.log(`✅ Permission already exists for role ${adminRoleId} to access Complaints dropdown`);
        }
        
        // Add permissions for child menus - Admin only (1)
        for (const [path, menuId] of Object.entries(menuIds)) {
            // Check if permission already exists for Admin
            const [existingPerm] = await connection.query(
                "SELECT * FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?",
                [adminRoleId, menuId]
            );
            
            if (existingPerm.length === 0) {
                await connection.query(
                    "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 0, 0, 0)",
                    [adminRoleId, menuId]
                );
                console.log(`✅ Added permission for role ${adminRoleId} to access menu ${menuId} (${path})`);
            } else {
                console.log(`✅ Permission already exists for role ${adminRoleId} to access menu ${menuId}`);
            }
        }
        
        // Add Submit Complaint permission for all roles (2, 3, 4, 5)
        const nonAdminRoles = [2, 3, 4, 5];
        const submitComplaintMenuId = menuIds['/interaction/complaints/submit'];
        
        for (const roleId of nonAdminRoles) {
            // Check if permission already exists
            const [existingPerm] = await connection.query(
                "SELECT * FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?",
                [roleId, submitComplaintMenuId]
            );
            
            if (existingPerm.length === 0) {
                await connection.query(
                    "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 0, 0, 0)",
                    [roleId, submitComplaintMenuId]
                );
                console.log(`✅ Added permission for role ${roleId} to access Submit Complaint`);
            } else {
                console.log(`✅ Permission already exists for role ${roleId} to access Submit Complaint`);
            }
        }
        
        await connection.commit();
        console.log('\n✅ All complaint menus and permissions set up successfully!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

setupComplaintMenus();
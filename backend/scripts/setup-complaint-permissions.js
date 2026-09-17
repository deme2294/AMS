const db = require('../models/db');

async function setupComplaintPermissions() {
    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get complaint menus
        const [complaintMenus] = await connection.query(
            "SELECT id, title, path FROM cms_menus WHERE path LIKE '/interaction/complaints%' OR path = '#complaints'"
        );
        
        console.log('Found complaint menus:', complaintMenus.map(m => `${m.title} (${m.id}) - ${m.path}`));
        
        // Get all distinct roles from users table
        const [allRoles] = await connection.query("SELECT DISTINCT role_id FROM users WHERE role_id IS NOT NULL");
        console.log('Found roles:', allRoles.map(r => r.role_id));
        
        // Roles that should have full access
        const adminManagerRoles = [1, 2, 4];
        
        // Full access for Admin and Manager roles
        for (const menu of complaintMenus) {
            for (const roleId of adminManagerRoles) {
                const [existingPerm] = await connection.query(
                    "SELECT * FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?",
                    [roleId, menu.id]
                );
                
                if (existingPerm.length === 0) {
                    await connection.query(
                        "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 1)",
                        [roleId, menu.id]
                    );
                    console.log(`✅ Added FULL access for role ${roleId} to ${menu.title}`);
                } else {
                    await connection.query(
                        "UPDATE role_menu_permissions SET can_view = 1, can_create = 1, can_edit = 1, can_delete = 1 WHERE role_id = ? AND menu_id = ?",
                        [roleId, menu.id]
                    );
                    console.log(`✅ Updated role ${roleId} FULL access to ${menu.title}`);
                }
            }
        }
        
        // Get Submit Complaint menu
        const submitMenu = complaintMenus.find(m => m.path === '/interaction/complaints/submit');
        
        // Only view access for other roles
        if (submitMenu) {
            for (const role of allRoles) {
                if (!adminManagerRoles.includes(role.role_id)) {
                    const [existingPerm] = await connection.query(
                        "SELECT * FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?",
                        [role.role_id, submitMenu.id]
                    );
                    
                    if (existingPerm.length === 0) {
                        await connection.query(
                            "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 0, 0, 0)",
                            [role.role_id, submitMenu.id]
                        );
                        console.log(`✅ Added Submit Complaint view access for role ${role.role_id}`);
                    }
                }
            }
        }
        
        // Remove other complaint permissions from non-admin/manager roles
        const otherRoles = allRoles.filter(r => !adminManagerRoles.includes(r.role_id)).map(r => r.role_id);
        
        if (otherRoles.length > 0 && submitMenu) {
            for (const roleId of otherRoles) {
                // Delete permissions for other complaint menus
                await connection.query(
                    "DELETE FROM role_menu_permissions WHERE role_id = ? AND menu_id IN (?, ?, ?)",
                    [roleId, 
                     complaintMenus.find(m => m.path === '/interaction/complaints/manage')?.id,
                     complaintMenus.find(m => m.path === '/interaction/complaints/analytics')?.id,
                     complaintMenus.find(m => m.path === '#complaints')?.id]
                );
                console.log(`✅ Removed Manage/Analytics access for role ${roleId}`);
            }
        }
        
        await connection.commit();
        console.log('\n✅ Complaint permissions set up successfully!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

setupComplaintPermissions();

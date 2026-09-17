// Script to update Complaint menu permissions - Remove Manage Complaints from non-Admins, keep Submit for all
const db = require('../models/db');

async function updateComplaintPermissions() {
    const connection = await db.promise().getConnection();
    
    try {
        console.log('Updating Complaint menu permissions...\n');
        
        // Find the Manage Complaints and Submit Complaint menus
        const [menus] = await connection.query(
            "SELECT id, title, path FROM cms_menus WHERE title LIKE '%Manage Complaint%' OR title LIKE '%Submit Complaint%'"
        );
        
        console.log('Found complaint menus:', menus);
        
        let manageComplaintsId = null;
        let submitComplaintId = null;
        
        for (const menu of menus) {
            if (menu.title.toLowerCase().includes('manage')) {
                manageComplaintsId = menu.id;
                console.log(`Manage Complaints menu ID: ${manageComplaintsId} (path: ${menu.path})`);
            } else if (menu.title.toLowerCase().includes('submit')) {
                submitComplaintId = menu.id;
                console.log(`Submit Complaint menu ID: ${submitComplaintId} (path: ${menu.path})`);
            }
        }
        
        if (!manageComplaintsId || !submitComplaintId) {
            console.error('Could not find complaint menus!');
            process.exit(1);
        }
        
        // Step 1: Remove all non-admin role permissions for Manage Complaints
        // Roles: 1 = Admin, 2 = Manager, 3 = Employee, 4 = Student, 5 = Parent
        await connection.query(
            "DELETE FROM role_menu_permissions WHERE menu_id = ? AND role_id != 1",
            [manageComplaintsId]
        );
        console.log(`✅ Removed Manage Complaints permissions for all non-admin roles`);
        
        // Step 2: Ensure Admin (role 1) has permission for Manage Complaints
        const [adminCheck] = await connection.query(
            "SELECT * FROM role_menu_permissions WHERE role_id = 1 AND menu_id = ?",
            [manageComplaintsId]
        );
        
        if (adminCheck.length === 0) {
            await connection.query(
                "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (1, ?, 1, 0, 0, 0)",
                [manageComplaintsId]
            );
            console.log(`✅ Added Admin permission for Manage Complaints`);
        } else {
            console.log(`✅ Admin already has permission for Manage Complaints`);
        }
        
        // Step 3: Make sure Submit Complaint is available for ALL roles (1, 2, 3, 4, 5)
        const allRoles = [1, 2, 3, 4, 5];
        
        for (const roleId of allRoles) {
            const [existing] = await connection.query(
                "SELECT * FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?",
                [roleId, submitComplaintId]
            );
            
            if (existing.length === 0) {
                await connection.query(
                    "INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 0, 0, 0)",
                    [roleId, submitComplaintId]
                );
                console.log(`✅ Added role ${roleId} permission for Submit Complaint`);
            } else {
                console.log(`✅ Role ${roleId} already has permission for Submit Complaint`);
            }
        }
        
        console.log('\n✅ Complaint permissions updated successfully!');
        console.log('  - Manage Complaints: Admin only');
        console.log('  - Submit Complaint: All roles');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

updateComplaintPermissions();
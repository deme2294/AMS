// Script to remove Complaint menus from the database
const db = require('../models/db');

async function removeComplaintMenus() {
    try {
        console.log('Removing Complaint menus from database...');

        // Delete complaint menu items
        const [result] = await db.promise().query(
            "DELETE FROM cms_menus WHERE path IN ('/complaints/manage', '/complaints/submit', '/complaints/public')"
        );

        console.log(`✅ Removed ${result.affectedRows} complaint menu(s) from cms_menus`);

        // Also clean up any related menu_permissions entries
        const [permResult] = await db.promise().query(
            "DELETE FROM menu_permissions WHERE menu_id NOT IN (SELECT id FROM cms_menus)"
        );

        if (permResult.affectedRows > 0) {
            console.log(`✅ Cleaned up ${permResult.affectedRows} orphaned permission(s)`);
        }

        console.log('✅ All complaint menus removed successfully!');

    } catch (error) {
        console.error('❌ Error removing complaint menus:', error.message);
    } finally {
        process.exit(0);
    }
}

removeComplaintMenus();

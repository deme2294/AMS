const db = require('../models/db');

async function addResponseMenu() {
    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check if the menu item already exists
        const [existing] = await connection.query(
            "SELECT * FROM cms_menus WHERE path = '/complaints/response' OR path = '/interaction/complaints/response'"
        );
        
        if (existing.length > 0) {
            console.log('⚠️  Response menu items already exist:', existing.map(m => ({ id: m.id, path: m.path, title: m.title })));
            await connection.rollback();
            process.exit(0);
        }
        
        // Get the complaints parent menu
        const [complaintMenus] = await connection.query(
            "SELECT id FROM cms_menus WHERE path = '/interaction/complaints/manage' OR path = '/complaints/manage' LIMIT 1"
        );
        
        let parentId = null;
        if (complaintMenus.length > 0) {
            parentId = complaintMenus[0].id;
        }
        
        // Get next available ID
        const [maxIdResult] = await connection.query('SELECT MAX(id) as max_id FROM cms_menus');
        const nextId = (maxIdResult[0].max_id || 0) + 1;
        
        // Insert the response management menu item with explicit ID
        const [result] = await connection.query(`
            INSERT INTO cms_menus (id, title, path, icon, parent_id, order_index, is_section, is_dropdown, is_active)
            VALUES (?, 'Response Management', '/complaints/response', 'MessageSquare', ?, 50, 0, 0, 1)
        `, [nextId, parentId || null]);
        
        console.log('✅ Added Response Management menu item with ID:', nextId);
        
        // Grant permission to admin (role_id = 1) and manager (role_id = 2)
        const roles = [1, 2, 4]; // admin, manager, super admin
        
        for (const roleId of roles) {
            await connection.query(`
                INSERT INTO role_menu_permissions (menu_id, role_id, can_view, can_create, can_edit, can_delete)
                VALUES (?, ?, 1, 0, 0, 0)
            `, [nextId, roleId]);
            console.log(`✅ Granted view permission to role_id ${roleId}`);
        }
        
        await connection.commit();
        console.log('\n✅ Response menu item added successfully!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

addResponseMenu();

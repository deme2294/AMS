const db = require('./models/db');

async function seed() {
    try {
        const query = (sql, params) => db.promise().query(sql, params);
        
        // 1. Insert Parent Menu "Organization" directly under "App" (id=1)
        console.log("Adding 'Organization' parent menu...");
        await query(`INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                     VALUES (60, 'Organization', NULL, '<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>', 'cyan', 1, 65, 0, 1, 1)`);
        
        // 2. Insert "Structure" menu
        console.log("Adding 'Structure' module...");
        await query(`INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                     VALUES (61, 'Structure', '/organization/structure', NULL, 'cyan', 60, 1, 0, 0, 1)`);
        
        // 3. Insert "Employee Assignments" menu
        console.log("Adding 'Employee Assignments' module...");
        await query(`INSERT IGNORE INTO cms_menus (id, title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active) 
                     VALUES (62, 'Employee Assign', '/organization/assignments', NULL, 'cyan', 60, 2, 0, 0, 1)`);
        
        // 4. Give full permissions to Admin (Role 1) and Manager (Role 4)
        console.log("Setting role-based access for Admin (1) and Manager (4)...");
        for (const role of [1, 4]) {
            for (const menu of [60, 61, 62]) {
                await query(`INSERT IGNORE INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) 
                             VALUES (?, ?, 1, 1, 1, 1)`, [role, menu]);
            }
        }
        
        console.log("✅ Successfully seeded organization menus and permissions!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Failed to seed menus:", e);
        process.exit(1);
    }
}
seed();

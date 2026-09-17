const db = require('../models/db');

async function migrate() {
    console.log("Starting DB migration for permissions...");
    try {
        await db.promise().query(`
            ALTER TABLE role_menu_permissions 
            ADD COLUMN can_view TINYINT(1) DEFAULT 1,
            ADD COLUMN can_create TINYINT(1) DEFAULT 0,
            ADD COLUMN can_edit TINYINT(1) DEFAULT 0,
            ADD COLUMN can_delete TINYINT(1) DEFAULT 0;
        `);
        console.log("Migration successful: Added CRUD columns to role_menu_permissions");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Migration already applied: Columns exist.");
        } else {
            console.error("Migration failed:", e);
        }
    }
    process.exit(0);
}

migrate();

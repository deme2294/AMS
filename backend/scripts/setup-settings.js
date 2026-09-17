const db = require('../models/db');

async function setupSettingsTable() {
    try {
        console.log('Creating system_settings table if it does not exist...');
        await db.promise().execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('Inserting default theme settings...');
        const defaults = [
            ['themeMode', 'system'],
            ['primaryColor', 'blue'],
            ['density', 'comfortable'],
            ['fontFamily', 'inter'],
            ['logoPreview', '']
        ];

        for (const [key, value] of defaults) {
            await db.promise().execute(`
                INSERT IGNORE INTO system_settings (setting_key, setting_value) 
                VALUES (?, ?)
            `, [key, value]);
        }

        console.log('System settings table ready.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up settings table:', error);
        process.exit(1);
    }
}

setupSettingsTable();

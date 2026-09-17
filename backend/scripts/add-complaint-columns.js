// Script to add missing columns to complaints table
const db = require('../models/db');

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to complaints table...\n');

        // Array of columns to add with their definitions
        const columnsToAdd = [
            { name: 'location', definition: 'VARCHAR(255)' },
            { name: 'type', definition: 'VARCHAR(20) DEFAULT "public"' }
        ];

        for (const col of columnsToAdd) {
            try {
                // Check if column exists
                const [exists] = await db.promise().query(
                    `SELECT 1 FROM information_schema.COLUMNS 
                     WHERE TABLE_SCHEMA = 'db_barber' AND TABLE_NAME = 'complaints' AND COLUMN_NAME = ?`,
                    [col.name]
                );

                if (exists.length > 0) {
                    console.log(`⚠️  Column '${col.name}' already exists, skipping...`);
                } else {
                    // Add the column
                    await db.promise().query(
                        `ALTER TABLE complaints ADD COLUMN ${col.name} ${col.definition}`
                    );
                    console.log(`✅ Added column '${col.name}'`);
                }
            } catch (e) {
                console.error(`❌ Error adding '${col.name}':`, e.message);
            }
        }

        // Verify final structure
        console.log('\nVerifying table structure:');
        const [columns] = await db.promise().query('DESCRIBE complaints');
        console.log('Current columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

addMissingColumns();
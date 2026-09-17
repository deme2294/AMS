// Script to add email column to complaints table
const db = require('../models/db');

async function addEmailColumn() {
    try {
        console.log('Adding email column to complaints table...');
        
        // Check if column exists
        const [columns] = await db.promise().query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'complaints' AND COLUMN_NAME = 'email'"
        );
        
        if (columns.length > 0) {
            console.log('✅ Email column already exists');
        } else {
            await db.promise().query(
                "ALTER TABLE complaints ADD COLUMN email VARCHAR(100) AFTER name"
            );
            console.log('✅ Email column added successfully');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addEmailColumn();
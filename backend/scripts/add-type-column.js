// Script to add type column to complaints table
const db = require('../models/db');

async function addTypeColumn() {
    try {
        console.log('Adding type column to complaints table...');
        
        // Check if column exists
        const [columns] = await db.promise().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'complaints' 
            AND COLUMN_NAME = 'type'
        `);
        
        if (columns.length > 0) {
            console.log('✅ Type column already exists');
            return;
        }
        
        // Add the column
        await db.promise().query(`
            ALTER TABLE complaints 
            ADD COLUMN type VARCHAR(20) DEFAULT 'internal'
        `);
        
        console.log('✅ Type column added successfully!');
        
        // Update existing records to have proper type values
        // Set type = 'public' where is_public = 1
        await db.promise().query(`
            UPDATE complaints 
            SET type = 'public' 
            WHERE is_public = 1
        `);
        
        // Set type = 'internal' where is_public = 0 or NULL
        await db.promise().query(`
            UPDATE complaints 
            SET type = 'internal' 
            WHERE is_public = 0 OR is_public IS NULL
        `);
        
        console.log('✅ Existing records updated with proper type values');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

addTypeColumn();
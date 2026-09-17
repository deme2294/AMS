// Script to add is_public column to complaints table
const db = require('../models/db');

async function addIsPublicColumn() {
    try {
        console.log('Adding is_public column to complaints table...\n');

        // Check if column already exists
        const [columns] = await db.promise().query("SHOW COLUMNS FROM complaints LIKE 'is_public'");
        
        if (columns.length > 0) {
            console.log('✅ Column is_public already exists');
        } else {
            // Add the column
            await db.promise().query("ALTER TABLE complaints ADD COLUMN is_public BOOLEAN DEFAULT FALSE AFTER attachment_url");
            console.log('✅ Column is_public added successfully');
        }

        // Verify the column
        const [verifyColumns] = await db.promise().query("SHOW COLUMNS FROM complaints");
        console.log('\nComplaints table columns:');
        verifyColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

addIsPublicColumn();
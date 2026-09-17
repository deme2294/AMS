// Script to add response tracking columns to the complaints table
const db = require('../models/db');

async function addResponseColumns() {
    const connection = await db.promise().getConnection();
    
    try {
        console.log('Adding response tracking columns to complaints table...\n');
        
        // Check if columns already exist
        const [columns] = await connection.query('DESCRIBE complaints');
        const columnNames = columns.map(c => c.Field);
        
        console.log('Current columns:', columnNames);
        
        // Add response_token column if it doesn't exist
        if (!columnNames.includes('response_token')) {
            await connection.query(
                'ALTER TABLE complaints ADD COLUMN response_token VARCHAR(64) NULL AFTER assigned_to'
            );
            console.log('✅ Added response_token column');
        } else {
            console.log('✅ response_token column already exists');
        }
        
        // Add assigned_response column if it doesn't exist
        if (!columnNames.includes('assigned_response')) {
            await connection.query(
                'ALTER TABLE complaints ADD COLUMN assigned_response TEXT NULL AFTER response_token'
            );
            console.log('✅ Added assigned_response column');
        } else {
            console.log('✅ assigned_response column already exists');
        }
        
        // Add response_submitted_at column if it doesn't exist
        if (!columnNames.includes('response_submitted_at')) {
            await connection.query(
                'ALTER TABLE complaints ADD COLUMN response_submitted_at TIMESTAMP NULL AFTER assigned_response'
            );
            console.log('✅ Added response_submitted_at column');
        } else {
            console.log('✅ response_submitted_at column already exists');
        }
        
        // Add admin_response column if it doesn't exist
        if (!columnNames.includes('admin_response')) {
            await connection.query(
                'ALTER TABLE complaints ADD COLUMN admin_response TEXT NULL AFTER response_submitted_at'
            );
            console.log('✅ Added admin_response column');
        } else {
            console.log('✅ admin_response column already exists');
        }
        
        // Add admin_response_at column if it doesn't exist
        if (!columnNames.includes('admin_response_at')) {
            await connection.query(
                'ALTER TABLE complaints ADD COLUMN admin_response_at TIMESTAMP NULL AFTER admin_response'
            );
            console.log('✅ Added admin_response_at column');
        } else {
            console.log('✅ admin_response_at column already exists');
        }
        
        console.log('\n✅ All response tracking columns added successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

addResponseColumns();
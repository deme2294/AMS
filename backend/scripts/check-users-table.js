// Script to check users table structure
const { query } = require('../models/complaintDb');

async function checkUsersTable() {
    try {
        console.log('Checking users table structure...\n');

        // Get table structure
        const columns = await query('DESCRIBE users');
        
        console.log('Users table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Get sample data
        console.log('\nSample users data:');
        const users = await query('SELECT * FROM users LIMIT 3');
        console.log(JSON.stringify(users, null, 2));

    } catch (error) {
        console.error('❌ Error checking users table:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsersTable();

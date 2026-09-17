// Script to test complaint database connection
const { query } = require('../models/complaintDb');

async function testComplaintConnection() {
    try {
        console.log('Testing complaint database connection...\n');

        // Test 1: Check if we can query the complaints table
        console.log('1. Testing complaints table query...');
        const complaints = await query('SELECT * FROM complaints LIMIT 5');
        console.log(`✅ Found ${complaints.length} complaints`);
        
        if (complaints.length > 0) {
            console.log('\nSample complaint:');
            console.log(JSON.stringify(complaints[0], null, 2));
        }

        // Test 2: Check categories table
        console.log('\n2. Testing categories table query...');
        const categories = await query('SELECT * FROM categories LIMIT 5');
        console.log(`✅ Found ${categories.length} categories`);

        // Test 3: Check users table
        console.log('\n3. Testing users table query...');
        const users = await query('SELECT user_id, name, email FROM users LIMIT 5');
        console.log(`✅ Found ${users.length} users`);

        // Test 4: Test the full join query
        console.log('\n4. Testing full join query...');
        const fullQuery = await query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                cat.category_name,
                assigned.name as assigned_to_name
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            LEFT JOIN users assigned ON c.assigned_to = assigned.user_id
            ORDER BY c.created_at DESC
            LIMIT 5
        `);
        console.log(`✅ Full join query returned ${fullQuery.length} results`);

        if (fullQuery.length > 0) {
            console.log('\nSample result from full join:');
            console.log(JSON.stringify(fullQuery[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing complaint connection:', error.message);
        console.error('Error details:', error);
    } finally {
        process.exit(0);
    }
}

testComplaintConnection();

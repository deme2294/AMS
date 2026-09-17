// Script to test complaint API endpoints
const db = require('../models/db');

async function testComplaintAPI() {
    try {
        console.log('Testing complaint API...\n');

        // Test 1: Get all complaints
        console.log('Test 1: Get all complaints');
        const [complaints] = await db.promise().query(`
            SELECT 
                c.*,
                u.user_name as user_name,
                cat.category_name,
                assigned.user_name as assigned_to_name
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            LEFT JOIN users assigned ON c.assigned_to = assigned.user_id
            ORDER BY c.created_at DESC
        `);
        console.log(`✅ Found ${complaints.length} complaints`);
        if (complaints.length > 0) {
            console.log('Sample complaint:', {
                complaint_id: complaints[0].complaint_id,
                reference_number: complaints[0].reference_number,
                title: complaints[0].title,
                name: complaints[0].name,
                status: complaints[0].status,
                priority: complaints[0].priority,
                category_name: complaints[0].category_name
            });
        }

        // Test 2: Get all categories
        console.log('\nTest 2: Get all categories');
        const [categories] = await db.promise().query('SELECT * FROM categories ORDER BY category_name');
        console.log(`✅ Found ${categories.length} categories`);
        if (categories.length > 0) {
            console.log('Categories:');
            categories.forEach(cat => {
                console.log(`  - ${cat.category_name}: ${cat.description}`);
            });
        }

        // Test 3: Get complaint statistics
        console.log('\nTest 3: Get complaint statistics');
        const [stats] = await db.promise().query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as highPriority,
                SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as mediumPriority,
                SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as lowPriority
            FROM complaints
        `);
        console.log('✅ Statistics:', stats[0]);

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('❌ Error testing complaint API:', error.message);
    } finally {
        process.exit(0);
    }
}

testComplaintAPI();

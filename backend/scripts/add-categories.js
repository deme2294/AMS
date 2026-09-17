// Script to add sample categories to the database
const db = require('../models/db');

async function addCategories() {
    try {
        console.log('Adding sample categories...\n');

        // Check if categories already exist
        const [catCount] = await db.promise().query("SELECT COUNT(*) as count FROM categories");
        
        if (catCount[0].count > 0) {
            console.log('✅ Categories already exist');
            const [categories] = await db.promise().query("SELECT * FROM categories");
            console.log('Existing categories:');
            categories.forEach(cat => {
                console.log(`  - ${cat.category_name}: ${cat.description}`);
            });
            return;
        }

        // Add sample categories
        await db.promise().query(`
            INSERT INTO categories (category_name, description) VALUES
            ('Technical Issue', 'Problems with website or system functionality'),
            ('Billing', 'Payment and billing related issues'),
            ('Service Quality', 'Issues with service quality or delivery'),
            ('General Inquiry', 'General questions or information requests'),
            ('Feature Request', 'Suggestions for new features or improvements'),
            ('Bug Report', 'Reports of software bugs or errors'),
            ('System Issue', 'Issues related to internal system or software'),
            ('Network Problem', 'Network connectivity and infrastructure issues'),
            ('Security Concern', 'Security vulnerabilities or suspicious activities'),
            ('Data Management', 'Data storage, backup, or retrieval issues'),
            ('User Access', 'Login, permissions, or access control problems'),
            ('Performance', 'System slowdowns, timeouts, or performance issues')
        `);
        
        console.log('✅ Sample categories added successfully!');
        
        // Show final count
        const [finalCount] = await db.promise().query("SELECT COUNT(*) as count FROM categories");
        console.log(`\nTotal categories in database: ${finalCount[0].count}`);

    } catch (error) {
        console.error('❌ Error adding categories:', error.message);
    } finally {
        process.exit(0);
    }
}

addCategories();
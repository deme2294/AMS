// Script to update categories in the database
const db = require('../models/db');

async function updateCategories() {
    try {
        console.log('Updating categories...\n');
        
        // Clear existing complaints first (due to foreign key)
        await db.promise().query("DELETE FROM complaints");
        console.log('✅ Cleared existing complaints');
        
        // Clear existing categories
        await db.promise().query("DELETE FROM categories");
        console.log('✅ Cleared existing categories');
        
        // Add new categories
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
        
        console.log('✅ Categories updated successfully!');
        
        // Show final count
        const [categories] = await db.promise().query("SELECT * FROM categories ORDER BY category_name");
        console.log('\nAll categories:');
        categories.forEach(cat => {
            console.log(`  ${cat.category_id}. ${cat.category_name} - ${cat.description}`);
        });

    } catch (error) {
        console.error('❌ Error updating categories:', error.message);
    } finally {
        process.exit(0);
    }
}

updateCategories();
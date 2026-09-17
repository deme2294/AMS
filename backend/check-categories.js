const con = require('./models/db');

console.log('Checking available categories...');

con.query('SELECT * FROM categories', (err, result) => {
    if (err) {
        console.error('Error fetching categories:', err);
        process.exit(1);
    }
    
    console.log('Available categories:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.length === 0) {
        console.log('❌ No categories found - creating default categories...');
        
        const defaultCategories = [
            { category_name: 'Service Quality', description: 'Issues related to service delivery' },
            { category_name: 'Facility Issues', description: 'Problems with physical facilities' },
            { category_name: 'Staff Behavior', description: 'Complaints about employee conduct' },
            { category_name: 'Policy Violations', description: 'Breaches of company policies' },
            { category_name: 'Safety Concerns', description: 'Health and safety issues' },
            { category_name: 'Technical Issues', description: 'IT and system problems' },
            { category_name: 'Administrative', description: 'Administrative and procedural issues' },
            { category_name: 'Other', description: 'Miscellaneous complaints' }
        ];
        
        defaultCategories.forEach((category, index) => {
            con.query('INSERT INTO categories SET ?', category, (err2, result2) => {
                if (err2) {
                    console.error(`❌ Failed to insert ${category.category_name}:`, err2);
                } else {
                    console.log(`✅ Created category: ${category.category_name} (ID: ${result2.insertId})`);
                }
                
                if (index === defaultCategories.length - 1) {
                    console.log('\n✅ Default categories created successfully');
                    process.exit();
                }
            });
        });
    } else {
        console.log(`\n✅ Found ${result.length} categories`);
        console.log('Category IDs available:', result.map(c => `${c.category_id}: ${c.category_name}`));
        process.exit();
    }
});

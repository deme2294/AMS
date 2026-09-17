const con = require('./models/db');

console.log('Checking current categories in database...');

con.query('SELECT * FROM categories ORDER BY category_name', (err, result) => {
    if (err) {
        console.error('❌ Error fetching categories:', err);
        process.exit(1);
    }
    
    console.log('Available categories for complaint system:');
    console.log('=====================================');
    result.forEach((category, index) => {
        console.log(`${index + 1}. ${category.category_name} (ID: ${category.category_id})`);
        console.log(`   Description: ${category.description}`);
        console.log('');
    });
    
    console.log(`\nTotal categories: ${result.length}`);
    console.log('\nThese categories should be available in the frontend dropdown.');
    process.exit();
});

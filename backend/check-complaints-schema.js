const con = require('./models/db');

console.log('Checking complaints table schema...');

con.query("DESCRIBE complaints", (err, result) => {
    if (err) {
        console.error('Error describing complaints table:', err);
        process.exit(1);
    }
    
    console.log('Current complaints table structure:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check for required columns
    const requiredColumns = [
        'complaint_id',
        'reference_number', 
        'user_id',
        'name',
        'email',
        'title',
        'description',
        'status',
        'priority',
        'category_id',
        'department',
        'location',
        'phone_number',
        'type',
        'is_public',
        'created_at'
    ];
    
    const existingColumns = result.map(col => col.Field);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    console.log('\n=== SCHEMA ANALYSIS ===');
    console.log('Required columns check:');
    
    if (missingColumns.length > 0) {
        console.log('❌ Missing columns:', missingColumns);
        
        console.log('\n=== ADDING MISSING COLUMNS ===');
        
        // Add missing columns one by one
        missingColumns.forEach((column, index) => {
            setTimeout(() => {
                console.log(`Adding column: ${column}`);
                
                let columnDefinition = '';
                switch(column) {
                    case 'reference_number':
                        columnDefinition = 'VARCHAR(50) UNIQUE NOT NULL';
                        break;
                    case 'user_id':
                        columnDefinition = 'INT(11) NOT NULL';
                        break;
                    case 'name':
                        columnDefinition = 'VARCHAR(255) NOT NULL';
                        break;
                    case 'email':
                        columnDefinition = 'VARCHAR(255)';
                        break;
                    case 'title':
                        columnDefinition = 'VARCHAR(255) NOT NULL';
                        break;
                    case 'description':
                        columnDefinition = 'TEXT NOT NULL';
                        break;
                    case 'status':
                        columnDefinition = 'ENUM("Pending","In Progress","Resolved","Closed") DEFAULT "Pending"';
                        break;
                    case 'priority':
                        columnDefinition = 'ENUM("Low","Medium","High") DEFAULT "Medium"';
                        break;
                    case 'category_id':
                        columnDefinition = 'INT(11)';
                        break;
                    case 'department':
                        columnDefinition = 'VARCHAR(100)';
                        break;
                    case 'location':
                        columnDefinition = 'VARCHAR(255)';
                        break;
                    case 'phone_number':
                        columnDefinition = 'VARCHAR(20)';
                        break;
                    case 'type':
                        columnDefinition = 'ENUM("internal","public") DEFAULT "internal"';
                        break;
                    case 'is_public':
                        columnDefinition = 'TINYINT(1) DEFAULT 0';
                        break;
                    case 'created_at':
                        columnDefinition = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
                        break;
                }
                
                con.query(`ALTER TABLE complaints ADD COLUMN ${column} ${columnDefinition}`, (alterErr) => {
                    if (alterErr) {
                        console.log(`❌ Failed to add ${column}:`, alterErr.message);
                    } else {
                        console.log(`✅ Added column: ${column}`);
                    }
                });
            }, index * 1000); // 1 second delay between each column
        });
        
    } else {
        console.log('✅ All required columns exist');
    }
    
    process.exit();
});

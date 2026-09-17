const con = require('./models/db');

console.log('Testing complaint insertion directly...');

// Test data matching what frontend sends
const testComplaint = {
    reference_number: `INT-${Date.now()}-TEST`,
    user_id: 83, // nathan27's user_id
    name: 'nathan27',
    title: 'Test Complaint Direct Insert',
    description: 'This is a test complaint inserted directly to verify database storage works.',
    status: 'Pending',
    priority: 'Medium',
    category_id: 1,
    department: 'IT Department',
    location: 'Test Location',
    phone_number: '+251912345678',
    type: 'internal',
    is_public: 0
};

console.log('Inserting test complaint:', testComplaint);

con.query('INSERT INTO complaints SET ?', testComplaint, (err, result) => {
    if (err) {
        console.error('❌ Insert failed:', err);
        console.error('SQL Error:', err.sqlMessage);
        process.exit(1);
    }
    
    console.log('✅ Insert successful!');
    console.log('Insert ID:', result.insertId);
    console.log('Affected rows:', result.affectedRows);
    
    // Verify the insert
    con.query('SELECT * FROM complaints WHERE complaint_id = ?', [result.insertId], (err2, rows) => {
        if (err2) {
            console.error('❌ Verification failed:', err2);
            process.exit(1);
        }
        
        console.log('✅ Verification successful!');
        console.log('Stored complaint:', JSON.stringify(rows[0], null, 2));
        process.exit();
    });
});

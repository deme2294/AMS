const con = require('./models/db');

console.log('Debugging complaint insertion process...');

// Test the exact query that the backend is using
const testComplaint = {
    reference_number: `INT-${Date.now()}-DEBUG`,
    user_id: 83, // nathan27's user_id
    name: 'nathan27',
    email: 'test@example.com',
    title: 'Debug Complaint Insertion',
    description: 'This is a debug complaint to test exact backend insertion logic.',
    status: 'Pending',
    priority: 'Medium',
    category_id: 7, // Valid category
    department: 'IT Department',
    location: 'Debug Location',
    phone_number: '+251912345678',
    type: 'internal'
};

console.log('Testing exact backend insertion query...');
console.log('Data to insert:', testComplaint);

// Test the exact query structure from backend
const query = `
    INSERT INTO complaints (
        reference_number, user_id, name, email, title, description, 
        status, priority, category_id, department, location, phone_number, type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const values = [
    testComplaint.reference_number, testComplaint.user_id, testComplaint.name, testComplaint.email, testComplaint.title, testComplaint.description,
    testComplaint.status, testComplaint.priority, testComplaint.category_id, testComplaint.department, testComplaint.location, testComplaint.phone_number, testComplaint.type
];

console.log('Query:', query);
console.log('Values:', values);

con.query(query, values, (err, result) => {
    if (err) {
        console.error('❌ Insert failed:', err);
        console.error('SQL Error:', err.sqlMessage);
        console.error('Error Code:', err.code);
        
        // Check if it's a column issue
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            console.log('🔍 Column issue detected. Let me check table structure...');
            checkTableStructure();
        }
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

function checkTableStructure() {
    console.log('\n--- Checking complaints table structure ---');
    con.query('DESCRIBE complaints', (err, result) => {
        if (err) {
            console.error('❌ Failed to describe table:', err);
            process.exit(1);
        }
        
        console.log('Table columns:');
        result.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - ${col.Default ? `Default: ${col.Default}` : 'No default'}`);
        });
        
        process.exit();
    });
}

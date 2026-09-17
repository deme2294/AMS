const con = require('./models/db');

console.log('Testing database connection and user lookup...');

// Test 1: Check if user 'nathan27' exists
con.query("SELECT user_id, user_name, email, status, failed_login_attempts, account_locked_until FROM users WHERE user_name = ? OR email = ?", ['nathan27', 'nathan27'], (err, res) => {
    if (err) {
        console.error('Database error:', err);
        process.exit(1);
    }
    
    console.log('User lookup results:');
    console.log(JSON.stringify(res, null, 2));
    
    if (res.length === 0) {
        console.log('❌ User "nathan27" not found in database');
        
        // Test 2: Show all users for debugging
        con.query("SELECT user_id, user_name, email, status FROM users LIMIT 10", (err2, res2) => {
            if (err2) {
                console.error('Error fetching users:', err2);
                process.exit(1);
            }
            
            console.log('\nAvailable users in database:');
            console.log(JSON.stringify(res2, null, 2));
            process.exit();
        });
    } else {
        console.log('✅ User found:', res[0].user_name);
        process.exit();
    }
});

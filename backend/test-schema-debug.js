const con = require('./models/db');

console.log('Testing database schema...');

// Test 1: Check users table structure
con.query("DESCRIBE users", (err, res) => {
    if (err) {
        console.error('Error describing users table:', err);
        process.exit(1);
    }
    
    console.log('Users table structure:');
    console.log(JSON.stringify(res, null, 2));
    
    // Test 2: Check if user 'nathan27' exists (corrected query)
    con.query("SELECT user_id, user_name, status, failed_login_attempts, account_locked_until FROM users WHERE user_name = ?", ['nathan27'], (err2, res2) => {
        if (err2) {
            console.error('Error looking up user:', err2);
            process.exit(1);
        }
        
        console.log('\nUser lookup results for "nathan27":');
        console.log(JSON.stringify(res2, null, 2));
        
        if (res2.length === 0) {
            console.log('❌ User "nathan27" not found');
            
            // Test 3: Show all users
            con.query("SELECT user_id, user_name, status FROM users LIMIT 10", (err3, res3) => {
                if (err3) {
                    console.error('Error fetching users:', err3);
                    process.exit(1);
                }
                
                console.log('\nAvailable users:');
                console.log(JSON.stringify(res3, null, 2));
                process.exit();
            });
        } else {
            console.log('✅ User found');
            process.exit();
        }
    });
});

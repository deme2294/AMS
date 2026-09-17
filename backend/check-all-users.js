const con = require('./models/db');

console.log('Checking all active users in database...');

con.query("SELECT user_id, user_name, status, employee_id FROM users WHERE status = '1' ORDER BY user_id", (err, res) => {
    if (err) {
        console.error('Error fetching users:', err);
        process.exit(1);
    }
    
    console.log(`Found ${res.length} active users:`);
    console.log(JSON.stringify(res, null, 2));
    
    if (res.length === 0) {
        console.log('No active users found in database');
    } else {
        console.log('\nUser credentials for testing:');
        res.forEach(user => {
            console.log(`- Username: ${user.user_name} (ID: ${user.user_id}, Status: ${user.status})`);
        });
    }
    
    process.exit();
});

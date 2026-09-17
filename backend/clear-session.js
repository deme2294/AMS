const con = require('./models/db');

console.log('Clearing active session for user nathan27...');

con.query("DELETE FROM active_sessions WHERE user_id = (SELECT user_id FROM users WHERE user_name = 'nathan27')", (err, res) => {
    if (err) {
        console.error('Error clearing session:', err);
        process.exit(1);
    }
    
    console.log(`✅ Cleared ${res.affectedRows} active session(s)`);
    
    // Also update online_flag to 0
    con.query("UPDATE users SET online_flag = 0 WHERE user_name = 'nathan27'", (err2, res2) => {
        if (err2) {
            console.error('Error updating online flag:', err2);
            process.exit(1);
        }
        
        console.log('✅ Updated online flag to 0');
        console.log('User can now login normally');
        process.exit();
    });
});

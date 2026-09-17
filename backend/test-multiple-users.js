const http = require('http');
const con = require('./models/db');

console.log('Testing authentication for multiple users...');

// Get a few test users from database
con.query("SELECT user_name FROM users WHERE status = '1' AND user_name IN ('test_admin', 'test_hr', 'nathan27', 'hayal27', 'testuser') LIMIT 5", async (err, users) => {
    if (err) {
        console.error('Error fetching users:', err);
        process.exit(1);
    }
    
    if (users.length === 0) {
        console.log('No test users found');
        process.exit(1);
    }
    
    console.log(`Testing ${users.length} users...`);
    
    // Test each user with a common test password
    const testPassword = 'password123'; // Common test password
    
    for (const user of users) {
        console.log(`\n--- Testing user: ${user.user_name} ---`);
        await testUserLogin(user.user_name, testPassword);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== AUTHENTICATION TEST COMPLETE ===');
    process.exit();
});

async function testUserLogin(username, password) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            user_name: username,
            pass: password
        });

        const options = {
            hostname: 'localhost',
            port: 5006,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Status: ${res.statusCode} - ${parsed.success ? 'SUCCESS' : 'FAILED'}`);
                    
                    if (parsed.conflict) {
                        console.log('  Session conflict detected');
                    } else if (parsed.locked) {
                        console.log('  Account locked');
                    } else if (!parsed.success) {
                        console.log(`  Reason: ${parsed.message}`);
                    }
                    
                    // Clear session for next test if needed
                    if (parsed.conflict) {
                        clearUserSession(username);
                    }
                    
                } catch (e) {
                    console.log('  Invalid response format');
                }
                
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`  Request failed: ${error.message}`);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

function clearUserSession(username) {
    con.query("DELETE FROM active_sessions WHERE user_id = (SELECT user_id FROM users WHERE user_name = ?)", [username], (err) => {
        if (err) console.error(`Error clearing session for ${username}:`, err);
    });
}

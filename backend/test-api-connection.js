const http = require('http');

console.log('Testing API connection on port 5006...');

// Test basic health endpoint
const healthOptions = {
    hostname: 'localhost',
    port: 5006,
    path: '/health',
    method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
    console.log(`Health Check Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Health Response:', data);
        
        if (res.statusCode === 200) {
            console.log('Server is responding correctly');
            testLoginEndpoint();
        } else {
            console.log('Server health check failed');
            process.exit(1);
        }
    });
});

healthReq.on('error', (error) => {
    console.error('Health check failed:', error.message);
    process.exit(1);
});

healthReq.end();

function testLoginEndpoint() {
    console.log('\nTesting login endpoint...');
    
    const postData = JSON.stringify({
        user_name: 'nathan27',
        pass: 'Astertamrat@9'
    });

    const loginOptions = {
        hostname: 'localhost',
        port: 5006,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const loginReq = http.request(loginOptions, (res) => {
        console.log(`Login Status Code: ${res.statusCode}`);
        console.log(`Response Headers:`, JSON.stringify(res.headers, null, 2));
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Login Response:', data);
            
            try {
                const parsed = JSON.parse(data);
                console.log('\n=== API TEST RESULTS ===');
                console.log(`Status: ${res.statusCode}`);
                console.log(`Success: ${parsed.success}`);
                console.log(`Message: ${parsed.message || 'No message'}`);
                
                if (parsed.conflict) {
                    console.log('Session Conflict: YES');
                    console.log('Session Info:', parsed.session);
                } else if (parsed.locked) {
                    console.log('Account Locked: YES');
                } else if (parsed.success) {
                    console.log('Authentication: SUCCESS');
                } else {
                    console.log('Authentication: FAILED');
                }
                
                console.log('\n=== RECOMMENDATIONS ===');
                if (res.statusCode === 200 && parsed.success) {
                    console.log('Backend API is working correctly');
                    console.log('Frontend should be able to login successfully');
                } else if (parsed.conflict) {
                    console.log('Clear existing session or use force logout option');
                } else {
                    console.log('Check credentials and user status in database');
                }
                
            } catch (e) {
                console.log('Invalid JSON response from server');
            }
            
            process.exit();
        });
    });

    loginReq.on('error', (error) => {
        console.error('Login request failed:', error.message);
        process.exit(1);
    });

    loginReq.write(postData);
    loginReq.end();
}

const http = require('http');

console.log('Testing frontend API call exactly as it would be made...');

// Simulate exact frontend call
const testComplaint = {
    title: 'Frontend Test Complaint',
    description: 'This is a test from frontend simulation to verify API integration.',
    category_id: 7,
    priority: 'medium',
    phone_number: '+251912345678',
    location: 'Frontend Test Location',
    subcategory: 'Test Subcategory',
    department: 'IT Department'
};

const postData = JSON.stringify(testComplaint);

console.log('Testing without authentication first (should fail)...');

// Test 1: Without authentication (should fail)
const options1 = {
    hostname: 'localhost',
    port: 5006,
    path: '/api/complaints/submit',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req1 = http.request(options1, (res) => {
    console.log(`Without auth - Status: ${res.statusCode}`);
    console.log(`Without auth - Headers:`, JSON.stringify(res.headers, null, 2));
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Without auth - Response:', data);
        
        // Test 2: With authentication
        console.log('\n--- Testing with authentication ---');
        testWithAuthentication();
    });
});

req1.on('error', (error) => {
    console.error('❌ Request 1 failed:', error.message);
    process.exit(1);
});

req1.write(postData);
req1.end();

function testWithAuthentication() {
    // First login to get token
    const loginData = JSON.stringify({
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
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    const loginReq = http.request(loginOptions, (loginRes) => {
        let loginData = '';
        loginRes.on('data', (chunk) => {
            loginData += chunk;
        });
        
        loginRes.on('end', () => {
            console.log(`Login Status: ${loginRes.statusCode}`);
            
            try {
                const loginResult = JSON.parse(loginData);
                if (loginResult.success) {
                    // Extract token from Set-Cookie header
                    const setCookieHeader = loginRes.headers['set-cookie'];
                    let token = null;
                    
                    if (setCookieHeader) {
                        const cookieString = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
                        const tokenMatch = cookieString.match(/token=([^;]+)/);
                        if (tokenMatch) {
                            token = tokenMatch[1];
                        }
                    }
                    
                    if (token) {
                        console.log('✅ Got token, testing authenticated call...');
                        testAuthenticatedCall(token);
                    } else {
                        console.log('❌ No token found');
                    }
                } else {
                    console.log('❌ Login failed:', loginResult.message);
                }
            } catch (e) {
                console.log('❌ Invalid login response');
            }
        });
    });

    loginReq.on('error', (error) => {
        console.error('❌ Login request failed:', error.message);
        process.exit(1);
    });

    loginReq.write(loginData);
    loginReq.end();
}

function testAuthenticatedCall(token) {
    const options2 = {
        hostname: 'localhost',
        port: 5006,
        path: '/api/complaints/submit',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Cookie': `token=${token}`
        }
    };

    const req2 = http.request(options2, (res) => {
        console.log(`With auth - Status: ${res.statusCode}`);
        console.log(`With auth - Headers:`, JSON.stringify(res.headers, null, 2));
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('With auth - Response:', data);
            
            try {
                const result = JSON.parse(data);
                console.log('\n=== API CALL RESULTS ===');
                console.log(`Success: ${result.success}`);
                console.log(`Message: ${result.message}`);
                console.log(`Reference: ${result.reference_number}`);
                
                if (result.success) {
                    console.log('✅ Frontend API call working!');
                } else {
                    console.log('❌ Frontend API call failed');
                }
            } catch (e) {
                console.log('❌ Invalid response format');
            }
            
            process.exit();
        });
    });

    req2.on('error', (error) => {
        console.error('❌ Request 2 failed:', error.message);
        process.exit(1);
    });

    req2.write(postData);
    req2.end();
}

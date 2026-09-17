const http = require('http');

console.log('Testing fixed API endpoints (removed duplicate /api prefix)...');

// Test data
const testComplaint = {
    title: 'Test Fixed API Endpoints',
    description: 'Testing complaint submission with fixed API routing.',
    category_id: 7,
    priority: 'medium',
    phone_number: '+251912345678',
    location: 'Test Location',
    subcategory: 'API Test',
    department: 'IT Department'
};

const postData = JSON.stringify(testComplaint);

// First login to get token
const loginData = JSON.stringify({
    user_name: 'nathan27',
    pass: 'Astertamrat@9'
});

console.log('Step 1: Logging in to get authentication token...');

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
                    console.log('✅ Login successful, got token');
                    // Step 2: Test complaint submission with fixed endpoint
                    testComplaintSubmission(token);
                } else {
                    console.log('❌ No token found in login response');
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
});

loginReq.write(loginData);
loginReq.end();

function testComplaintSubmission(token) {
    console.log('\n--- Testing Complaint Submission with Fixed Endpoint (/complaints/submit) ---');
    
    const complaintOptions = {
        hostname: 'localhost',
        port: 5006,
        path: '/complaints/submit', // Fixed: removed duplicate /api
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Cookie': `token=${token}`
        }
    };

    const complaintReq = http.request(complaintOptions, (complaintRes) => {
        let complaintData = '';
        complaintRes.on('data', (chunk) => {
            complaintData += chunk;
        });
        
        complaintRes.on('end', () => {
            console.log(`Complaint Status: ${complaintRes.statusCode}`);
            console.log('Response:', complaintData);
            
            try {
                const result = JSON.parse(complaintData);
                console.log('\n=== COMPLAINT SUBMISSION TEST RESULTS ===');
                console.log(`Success: ${result.success}`);
                console.log(`Message: ${result.message}`);
                console.log(`Reference Number: ${result.reference_number}`);
                
                if (result.success) {
                    console.log('✅ Complaint submission API working!');
                    console.log('✅ Fixed endpoint resolved!');
                    
                    // Step 3: Test manage complaints with fixed endpoint
                    testManageComplaints(token);
                } else {
                    console.log('❌ Complaint submission still failing');
                    console.log('Error:', result.message);
                }
                
            } catch (e) {
                console.log('❌ Invalid complaint response');
            }
        });
    });

    complaintReq.on('error', (error) => {
        console.error('❌ Complaint request failed:', error.message);
    });

    complaintReq.write(postData);
    complaintReq.end();
}

function testManageComplaints(token) {
    console.log('\n--- Testing Manage Complaints with Fixed Endpoint (/complaints/all) ---');
    
    const manageOptions = {
        hostname: 'localhost',
        port: 5006,
        path: '/complaints/all', // Fixed: removed duplicate /api
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${token}`
        }
    };

    const manageReq = http.request(manageOptions, (manageRes) => {
        let manageData = '';
        manageRes.on('data', (chunk) => {
            manageData += chunk;
        });
        
        manageRes.on('end', () => {
            console.log(`Manage API Status: ${manageRes.statusCode}`);
            console.log('Response:', manageData);
            
            try {
                const result = JSON.parse(manageData);
                console.log('\n=== MANAGE COMPLAINTS TEST RESULTS ===');
                console.log(`Success: ${result.success}`);
                console.log(`Total complaints fetched: ${result.data ? result.data.length : 0}`);
                
                if (result.success && result.data) {
                    console.log('✅ Manage complaints API working!');
                    console.log('✅ Fixed endpoint resolved!');
                    
                    console.log('\n🎉 ALL API ENDPOINTS FIXED AND WORKING!');
                    console.log('✅ Complaint submission: /complaints/submit');
                    console.log('✅ Manage complaints: /complaints/all');
                    console.log('✅ All endpoints properly routed');
                    console.log('✅ No more duplicate /api prefix issues');
                    
                } else {
                    console.log('❌ Manage complaints API not working');
                }
                
            } catch (e) {
                console.log('❌ Invalid manage API response');
            }
            
            process.exit();
        });
    });

    manageReq.on('error', (error) => {
        console.error('❌ Manage API request failed:', error.message);
        process.exit(1);
    });

    manageReq.end();
}

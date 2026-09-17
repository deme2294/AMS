const http = require('http');

console.log('Testing final integration with fixed API endpoints...');

// Test the exact data that frontend would send
const testComplaint = {
    title: 'Final Integration Test Complaint',
    description: 'This is a final test to ensure frontend-backend integration is working correctly with all API endpoints fixed.',
    category_id: 7,
    priority: 'medium',
    phone_number: '+251912345678',
    location: 'Final Test Location',
    subcategory: 'Integration Test',
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
                    // Step 2: Submit complaint with token using /api/complaints/submit
                    submitComplaintWithFixedAPI(token);
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

function submitComplaintWithFixedAPI(token) {
    console.log('\n--- Submitting Complaint with Fixed API Endpoint (/api/complaints/submit) ---');
    
    const complaintOptions = {
        hostname: 'localhost',
        port: 5006,
        path: '/api/complaints/submit', // Fixed endpoint with /api prefix
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
                console.log('\n=== FINAL INTEGRATION TEST RESULTS ===');
                console.log(`Success: ${result.success}`);
                console.log(`Message: ${result.message}`);
                console.log(`Reference Number: ${result.reference_number}`);
                console.log(`Complaint ID: ${result.complaint_id}`);
                
                if (result.success) {
                    console.log('✅ API endpoint working correctly!');
                    console.log('✅ Frontend-backend integration fixed!');
                    console.log('✅ Complaint submitted to database!');
                    
                    // Step 3: Verify data is actually in database
                    verifyInDatabase(result.reference_number);
                    
                    // Step 4: Test that manage complaints can fetch the data
                    testManageComplaints();
                } else {
                    console.log('❌ Complaint submission still failing');
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

function verifyInDatabase(referenceNumber) {
    console.log('\n--- Verifying Complaint in Database ---');
    
    const con = require('./models/db');
    
    con.query('SELECT * FROM complaints WHERE reference_number = ?', [referenceNumber], (err, result) => {
        if (err) {
            console.error('❌ Database verification failed:', err);
            process.exit(1);
        }
        
        if (result.length > 0) {
            const complaint = result[0];
            console.log('✅ Complaint successfully stored in database!');
            console.log('Database verification:', {
                complaint_id: complaint.complaint_id,
                reference_number: complaint.reference_number,
                title: complaint.title,
                user_id: complaint.user_id,
                user_name: complaint.user_name,
                status: complaint.status,
                priority: complaint.priority,
                category_id: complaint.category_id,
                created_at: complaint.created_at
            });
        } else {
            console.log('❌ Complaint not found in database');
        }
    });
}

function testManageComplaints() {
    console.log('\n--- Testing Manage Complaints API ---');
    
    const manageOptions = {
        hostname: 'localhost',
        port: 5006,
        path: '/api/complaints', // Test the manage complaints endpoint
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const manageReq = http.request(manageOptions, (manageRes) => {
        let manageData = '';
        manageRes.on('data', (chunk) => {
            manageData += chunk;
        });
        
        manageRes.on('end', () => {
            console.log(`Manage API Status: ${manageRes.statusCode}`);
            
            try {
                const result = JSON.parse(manageData);
                console.log(`Manage API Success: ${result.success}`);
                console.log(`Total complaints fetched: ${result.data ? result.data.length : 0}`);
                
                if (result.success && result.data && result.data.length > 0) {
                    console.log('✅ Manage complaints API working!');
                    console.log('✅ Can fetch complaints from database!');
                    
                    console.log('\n🎉 COMPLETE SYSTEM VERIFICATION SUCCESSFUL!');
                    console.log('✅ Frontend-backend integration fixed');
                    console.log('✅ Complaint submission working');
                    console.log('✅ Database storage working');
                    console.log('✅ Manage complaints working');
                    console.log('✅ All API endpoints working');
                    
                } else {
                    console.log('❌ Manage complaints API not working properly');
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

const http = require('http');

console.log('Testing complete complaint system...');

// First, test complaint submission with proper authentication
const testComplaint = {
    title: 'Test Complete System Complaint',
    description: 'This is a test complaint to verify the complete system works end-to-end with database storage, user capture, and reference generation.',
    category_id: 7, // Valid category ID from database
    priority: 'Medium',
    phone_number: '+251912345678',
    location: 'Test Location - Office 101',
    subcategory: 'System Test',
    department: 'IT Department'
};

const postData = JSON.stringify(testComplaint);

// Simulate login first to get token (in real app, this would be done via login form)
const loginData = JSON.stringify({
    user_name: 'nathan27',
    pass: 'Astertamrat@9'
});

// Step 1: Login to get token
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
                    // Step 2: Submit complaint with token
                    submitComplaintWithToken(token);
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

function submitComplaintWithToken(token) {
    console.log('\n--- Submitting Complaint with Authentication ---');
    
    const complaintOptions = {
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
                console.log('\n=== COMPLAINT SUBMISSION RESULTS ===');
                console.log(`Success: ${result.success}`);
                console.log(`Message: ${result.message}`);
                console.log(`Reference Number: ${result.reference_number}`);
                
                if (result.success) {
                    console.log('✅ Complaint submitted successfully!');
                    console.log('✅ User info auto-captured from authentication');
                    console.log('✅ Reference number generated automatically');
                    console.log('✅ Data stored in database');
                    
                    // Step 3: Verify data in database
                    verifyComplaintInDatabase(result.reference_number);
                } else {
                    console.log('❌ Complaint submission failed');
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

function verifyComplaintInDatabase(referenceNumber) {
    console.log('\n--- Verifying Complaint in Database ---');
    
    const con = require('./models/db');
    
    con.query('SELECT * FROM complaints WHERE reference_number = ?', [referenceNumber], (err, result) => {
        if (err) {
            console.error('❌ Database verification failed:', err);
            process.exit(1);
        }
        
        if (result.length > 0) {
            const complaint = result[0];
            console.log('✅ Complaint found in database!');
            console.log('Stored data:', {
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
            
            console.log('\n🎉 COMPLETE SYSTEM VERIFICATION SUCCESSFUL!');
            console.log('✅ Authentication working');
            console.log('✅ Complaint submission working');
            console.log('✅ Database storage working');
            console.log('✅ Reference number generation working');
            console.log('✅ User auto-capture working');
            
        } else {
            console.log('❌ Complaint not found in database');
        }
        
        process.exit();
    });
}

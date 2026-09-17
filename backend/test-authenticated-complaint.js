const http = require('http');

console.log('Testing authenticated complaint submission...');

// Test data for complaint submission
const testComplaint = {
    title: 'Test Complaint from Authenticated User',
    description: 'This is a test complaint submitted by authenticated user to verify the system is working correctly.',
    category_id: 1,
    priority: 'medium',
    phone_number: '+251912345678',
    location: 'Test Location - Office 101',
    subcategory: 'Test Subcategory',
    department: 'IT Department'
};

const postData = JSON.stringify(testComplaint);

const options = {
    hostname: 'localhost',
    port: 5006,
    path: '/api/complaints/submit',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': 'token=your-auth-token-here' // This would normally be set by login
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response Headers:`, JSON.stringify(res.headers, null, 2));
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response Body:', data);
        
        try {
            const parsed = JSON.parse(data);
            console.log('\n=== AUTHENTICATED COMPLAINT TEST RESULTS ===');
            console.log(`Status: ${res.statusCode}`);
            console.log(`Success: ${parsed.success}`);
            console.log(`Message: ${parsed.message}`);
            
            if (parsed.success) {
                console.log(`Reference Number: ${parsed.reference_number}`);
                console.log('✅ Authenticated complaint submission working correctly');
            } else {
                console.log('❌ Complaint submission failed');
                if (parsed.message.includes('not authenticated')) {
                    console.log('🔐 Authentication issue - token may be invalid');
                } else if (parsed.message.includes('required')) {
                    console.log('📝 Validation issue - missing required fields');
                } else {
                    console.log('🐛 Server error - check backend logs');
                }
            }
            
        } catch (e) {
            console.log('❌ Invalid JSON response from server');
        }
        
        process.exit();
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    process.exit(1);
});

req.write(postData);
req.end();

// test-browser-form-submission.js
// Test script to simulate browser form submission

const http = require('http');

const API_BASE = 'http://localhost:5011';

// Simulate browser form submission
function simulateBrowserFormSubmission() {
    return new Promise((resolve, reject) => {
        const formData = {
            title: 'Browser Form Test',
            description: 'This is a test complaint submitted from browser form simulation',
            name: 'Browser User',
            email: 'browser@example.com',
            phone_number: '+251912345678',
            category_id: null,
            priority: 'Medium'
        };

        const postData = JSON.stringify(formData);

        const options = {
            hostname: 'localhost',
            port: 5005,
            path: '/api/complaints/public-submit',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Origin': 'http://localhost:5005',
                'Referer': 'http://localhost:5005/complaint-frontend.html'
            }
        };

        console.log('📤 Sending request to:', `${API_BASE}/api/complaints/public-submit`);
        console.log('📤 Request headers:', JSON.stringify(options.headers, null, 2));
        console.log('📤 Request body:', JSON.stringify(formData, null, 2));

        const req = http.request(options, (res) => {
            console.log('\n📥 Response status:', res.statusCode);
            console.log('📥 Response headers:', JSON.stringify(res.headers, null, 2));
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('\n📥 Response body:', data);
                try {
                    const jsonData = JSON.parse(data);
                    console.log('\n✅ Parsed JSON response:', JSON.stringify(jsonData, null, 2));
                    resolve(jsonData);
                } catch (e) {
                    console.log('\n❌ Failed to parse JSON response');
                    resolve(null);
                }
            });
        });

        req.on('error', (err) => {
            console.error('\n❌ Request failed:', err.message);
            reject(err);
        });

        req.setTimeout(5000, () => {
            console.error('\n❌ Request timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Run test
async function runTest() {
    console.log('🧪 Testing Browser Form Submission\n');
    console.log('='.repeat(50));
    
    try {
        const result = await simulateBrowserFormSubmission();
        
        if (result && result.success) {
            console.log('\n✅ Browser form submission test passed!');
            console.log('Reference number:', result.reference_number);
        } else {
            console.log('\n❌ Browser form submission test failed!');
        }
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    }
}

runTest();

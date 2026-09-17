// test-public-complaint-api.js
// Test script to verify public complaint API endpoints are working

const http = require('http');

const API_BASE = 'http://localhost:5011';

// Test 1: Check if server is running
function testServerHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get(`${API_BASE}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('✅ Server Health Check:', res.statusCode);
                console.log('Response:', data);
                resolve(res.statusCode === 200);
            });
        });
        req.on('error', (err) => {
            console.error('❌ Server Health Check Failed:', err.message);
            reject(err);
        });
        req.setTimeout(5000, () => {
            console.error('❌ Server Health Check Timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Test 2: Get public categories
function testGetPublicCategories() {
    return new Promise((resolve, reject) => {
        const req = http.get(`${API_BASE}/api/complaints/public-categories`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('\n✅ Get Public Categories:', res.statusCode);
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Response:', JSON.stringify(jsonData, null, 2));
                    resolve(res.statusCode === 200 && jsonData.success);
                } catch (e) {
                    console.log('Response:', data);
                    resolve(false);
                }
            });
        });
        req.on('error', (err) => {
            console.error('❌ Get Public Categories Failed:', err.message);
            reject(err);
        });
        req.setTimeout(5000, () => {
            console.error('❌ Get Public Categories Timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Test 3: Submit public complaint
function testSubmitPublicComplaint() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            title: 'Test Complaint from API Test',
            description: 'This is a test complaint submitted via API test script',
            name: 'Test User',
            email: 'test@example.com',
            phone_number: '+251912345678',
            priority: 'Medium'
        });

        const options = {
            hostname: 'localhost',
            port: 5005,
            path: '/api/complaints/public-submit',
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
                console.log('\n✅ Submit Public Complaint:', res.statusCode);
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Response:', JSON.stringify(jsonData, null, 2));
                    resolve(res.statusCode === 200 && jsonData.success);
                } catch (e) {
                    console.log('Response:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ Submit Public Complaint Failed:', err.message);
            reject(err);
        });

        req.setTimeout(5000, () => {
            console.error('❌ Submit Public Complaint Timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Run all tests
async function runTests() {
    console.log('🧪 Testing Public Complaint API Endpoints\n');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Server Health
        const healthOk = await testServerHealth();
        if (!healthOk) {
            console.error('\n❌ Server is not running. Please start the server first.');
            process.exit(1);
        }

        // Test 2: Get Public Categories
        const categoriesOk = await testGetPublicCategories();
        if (!categoriesOk) {
            console.error('\n❌ Failed to get public categories.');
        }

        // Test 3: Submit Public Complaint
        const submitOk = await testSubmitPublicComplaint();
        if (!submitOk) {
            console.error('\n❌ Failed to submit public complaint.');
        }

        console.log('\n' + '='.repeat(50));
        if (healthOk && categoriesOk && submitOk) {
            console.log('✅ All tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Please check the errors above.');
        }
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        process.exit(1);
    }
}
runTests();

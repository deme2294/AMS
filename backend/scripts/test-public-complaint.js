// Test script to verify public complaint API
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5005;

const testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone_number: '+251912345678',
    title: 'Test Complaint from API',
    description: 'This is a test complaint submitted via API',
    category_id: 7,
    priority: 'Medium',
    location: 'Addis Ababa',
    subcategory: 'Technical'
};

const postData = JSON.stringify(testData);

const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: '/api/complaints/public/submit',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

console.log('Testing Public Complaint API...');
console.log('URL: http://' + API_HOST + ':' + API_PORT + options.path);
console.log('Data:', JSON.stringify(testData, null, 2));
console.log('');

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        
        try {
            const json = JSON.parse(data);
            if (json.success) {
                console.log('\n✅ SUCCESS: Complaint submitted!');
                console.log('Reference Number:', json.reference_number);
            } else {
                console.log('\n❌ FAILED:', json.message);
            }
        } catch (e) {
            console.log('\n❌ ERROR: Could not parse response');
        }
    });
});

req.on('error', (error) => {
    console.log('❌ CONNECTION ERROR:', error.message);
    console.log('\nMake sure the backend server is running: node server.js');
});

req.write(postData);
req.end();
const http = require('http');

console.log('Testing backend API directly...');

const postData = JSON.stringify({
    user_name: 'nathan27',
    pass: 'Astertamrat@9'
});

const options = {
    hostname: 'localhost',
    port: 5005,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response Body:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('Parsed Response:', parsed);
        } catch (e) {
            console.log('Response is not valid JSON');
        }
        process.exit();
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
    process.exit(1);
});

req.write(postData);
req.end();

const http = require('http');

console.log('Testing API on port 5006...');

const postData = JSON.stringify({
    user_name: 'nathan27',
    pass: 'Astertamrat@9'
});

const options = {
    hostname: 'localhost',
    port: 5006,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('✅ Login Result:', parsed.success ? 'SUCCESS' : 'FAILED');
            if (parsed.conflict) {
                console.log('⚠️ Session conflict detected');
            }
        } catch (e) {
            console.log('❌ Invalid JSON response');
        }
        process.exit();
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
    process.exit(1);
});

req.write(postData);
req.end();

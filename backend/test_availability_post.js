const http = require('http');

// Test data matching the frontend payload format
const testData = {
  service_id: 1,
  barber_id: null,
  available_date: '2026-06-15',
  start_time: '09:00:00',
  end_time: '10:00:00',
  max_bookings: 1,
  slot_status: 'available'
};

const payload = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/api/availability',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Testing availability POST endpoint...');
console.log('Endpoint: POST http://localhost:5005/api/availability');
console.log('Payload:', testData);
console.log('\n---Response---\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    try {
      console.log('Response Body:');
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log('Response Body:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.write(payload);
req.end();

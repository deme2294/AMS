const jwt = require('jsonwebtoken');
const http = require('http');

// Create a test JWT token using the actual user ID from the database
const token = jwt.sign(
  { user_id: 9001, role_id: 1 },
  'Hayaltamrat@27',  // JWT_SECRET from .env
  { expiresIn: '1h' }
);

console.log('Generated test token');

// Test data
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
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${token}`
  }
};

console.log('\nTesting availability POST with authentication...');
console.log('Payload:', testData);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n✅ Status Code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('📋 Response:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

req.write(payload);
req.end();

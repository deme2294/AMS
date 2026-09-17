const http = require('http');

// Test data - create availability slot without a specific barber
const testData = {
  service_id: 1,
  barber_id: null,  // No specific barber
  available_date: '2026-06-15',
  start_time: '09:00',
  end_time: '10:00',
  max_bookings: 2,
  slot_status: 'available'
};

const options = {
  hostname: 'localhost',
  port: 5007,
  path: '/api/availability',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'connect.sid=your_session_id_here'  // You may need a valid session
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log(data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();

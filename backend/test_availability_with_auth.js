const con = require("./models/db");
const http = require('http');

// First, get a valid user/token from the database
const testWithAuth = async () => {
  try {
    // Get admin user
    const [users] = await con.promise().query(
      "SELECT user_id FROM users WHERE status = 'active' LIMIT 1"
    );
    
    if (users.length === 0) {
      console.error("No active users found in database");
      process.exit(1);
    }
    
    console.log("Found user ID:", users[0].user_id);
    
    // Create a test JWT token (you may need to use the actual JWT_SECRET from .env)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { user_id: users[0].user_id, role_id: 1 },
      process.env.JWT_SECRET || 'Hayaltamrat@27',
      { expiresIn: '1h' }
    );
    
    console.log("Generated test token");
    
    // Now test the POST with token
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

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nStatus Code:', res.statusCode);
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch {
          console.log('Response:', data);
        }
        con.end();
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      con.end();
      process.exit(1);
    });

    req.write(payload);
    req.end();

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

testWithAuth();

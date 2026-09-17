const db = require('./models/db.js');
// Find admin users
db.query(`
  SELECT u.user_id, u.user_name, u.role_id, r.role_name 
  FROM users u 
  JOIN roles r ON u.role_id = r.role_id 
  WHERE r.role_name = 'Admin' OR r.role_id = 1
  LIMIT 5
`, (err, results) => {
  console.log('Admin users in system:');
  if (results.length === 0) {
    console.log('No admin users found!');
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  
  // Also check barber role
  db.query(`
    SELECT r.role_id, r.role_name, COUNT(u.user_id) as user_count
    FROM roles r
    LEFT JOIN users u ON r.role_id = u.role_id
    GROUP BY r.role_id
  `, (err, roles) => {
    console.log('\nAll roles and user counts:');
    console.table(roles);
    process.exit(0);
  });
});

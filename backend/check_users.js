const con = require("./models/db");

const check = async () => {
  try {
    // Check users table
    const [users] = await con.promise().query("SELECT user_id, username, role_id, status FROM users LIMIT 5");
    console.log("Users in database:");
    console.table(users);
    
    // Check if roles table exists
    const [roles] = await con.promise().query("SELECT * FROM roles LIMIT 5");
    console.log("\nRoles:");
    console.table(roles);
    
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
};

check();

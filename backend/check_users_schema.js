const con = require("./models/db");

const check = async () => {
  try {
    // Describe users table
    const [desc] = await con.promise().query("DESCRIBE users");
    console.log("Users table schema:");
    console.table(desc.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
    
    // Get some user records
    const [users] = await con.promise().query("SELECT * FROM users LIMIT 3");
    console.log("\nSample users:");
    console.table(users);
    
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
};

check();

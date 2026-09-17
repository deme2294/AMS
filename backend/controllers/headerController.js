const con = require("../models/db");


const getdepartment = async (req, res) => {
  try {
    const sql = "SELECT name FROM departments";
    con.query(sql, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      // Send result as JSON.
      res.json(results);
    });
  } catch (error) {
    console.error("Error in getdepartment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserRoles = async (req, res) => {
  try {
    // Assuming that the current user's ID is available in req.user_id from verifyToken middleware
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(400).json({ error: "User ID not provided" });
    }
    const sql = `
      SELECT r.role_name
      FROM roles r
      INNER JOIN users u ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `;
    con.query(sql, [user_id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "User role not found" });
      }
      res.json(results[0]);
    });
  } catch (error) {
    console.error("Error in getUserRole:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {

  getUserRoles,
  getdepartment
};


// controllers/userController.js

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const con = require("../models/db");

// Add new user (Create Employee -> Create User)
const addUser = async (req, res) => {
  const { fname, lname, email, phone, department_id, role_id, user_name, password } = req.body;

  if (!user_name || !password || !email || !fname || !lname) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // 1. Phone Validation (Optional but must be valid if provided)
  const phoneRegex = /^(\+251|0)[79]\d{8}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Invalid phone number format. Use +251 9... or 09..." });
  }

  // 2. Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address format" });
  }

  // Strong password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password does not meet security requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters (@$!%*?&)."
    });
  }

  let connection;
  try {
    // Get a dedicated connection from the pool for the transaction
    connection = await con.promise().getConnection();
    await connection.beginTransaction();

    // Check if user_name already exists to avoid partial inserts
    const [existingUsers] = await connection.query("SELECT user_id FROM users WHERE user_name = ?", [user_name]);
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if employee email already exists
    const [existingEmp] = await connection.query("SELECT employee_id FROM employees WHERE email = ?", [email]);
    if (existingEmp.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Employee with this email already exists" });
    }

    // 1. Create Employee
    const empName = `${fname} ${lname}`;
    const [empResult] = await connection.query(
      "INSERT INTO employees (name, fname, lname, email, phone, department_id, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [empName, fname, lname, email, phone, department_id, role_id]
    );
    const employee_id = empResult.insertId;

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    const [userResult] = await connection.query(
      "INSERT INTO users (employee_id, user_name, password, role_id, status) VALUES (?, ?, ?, ?, '1')",
      [employee_id, user_name, hashedPassword, role_id]
    );

    await connection.commit();

    console.log(`User created: ${user_name} (User ID: ${userResult.insertId}, Employee ID: ${employee_id})`);
    res.status(201).json({ message: "User created successfully", user_id: userResult.insertId });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Error adding user" });
  } finally {
    if (connection) connection.release();
  }
};

const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { fname, lname, user_name, phone, department_id, role_id, password } = req.body;

  // Phone Validation
  const phoneRegex = /^(\+251|0)[79]\d{8}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Invalid phone number format. Use +251 9... or 09..." });
  }

  let connection;
  try {
    connection = await con.promise().getConnection();
    await connection.beginTransaction();

    // Retrieve the employee_id from the users table
    const [usersData] = await connection.query("SELECT employee_id FROM users WHERE user_id = ?", [user_id]);
    if (!usersData || usersData.length === 0) {
      await connection.rollback();
      console.error("User not found for update, user_id:", user_id);
      return res.status(404).json({ message: "User not found" });
    }
    const employee_id = usersData[0].employee_id;

    if (employee_id) {
      await connection.query(
        "UPDATE employees SET fname = ?, lname = ?, phone = ?, department_id = ? WHERE employee_id = ?",
        [fname, lname, phone, department_id, employee_id]
      );
    }

    let updateUserSql = "UPDATE users SET user_name = ?, role_id = ?";
    const queryParams = [user_name, role_id];

    if (password && password.trim() !== "") {
      // Strong password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        await connection.rollback();
        return res.status(400).json({
          message: "New password does not meet security requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters (@$!%*?&)."
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateUserSql += ", password = ?";
      queryParams.push(hashedPassword);
    }

    updateUserSql += " WHERE user_id = ?";
    queryParams.push(user_id);

    await connection.query(updateUserSql, queryParams);
    await connection.commit();

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  } finally {
    if (connection) connection.release();
  }
};

// Get all roles
const getAllRoles = (req, res) => {
  con.query("SELECT * FROM roles", (err, results) => {
    if (err) {
      console.error("Error retrieving roles:", err);
      return res.status(500).json({ message: "Error retrieving roles" });
    }
    res.json(results);
  });
};

// Get all departments
const getDepartment = (req, res) => {
  con.query("SELECT * FROM departments", (err, results) => {
    if (err) {
      console.error("Error retrieving department:", err);
      return res.status(500).json({ message: "Error retrieving department" });
    }
    res.json(results);
  });
};

// Get all users (including employee details)
const getAllUsers = (req, res) => {
  const query = `
    SELECT u.user_id, u.user_name, u.role_id, u.status, u.created_at,
           e.name, e.fname, e.lname, e.email, e.phone, e.department_id,
           r.role_name
    FROM users u 
    LEFT JOIN employees e ON u.employee_id = e.employee_id
    LEFT JOIN roles r ON u.role_id = r.role_id
    ORDER BY u.created_at DESC
  `;
  con.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving users:", err);
      return res.status(500).json({ message: "Error retrieving users" });
    }
    res.json(results);
  });
};

// Change user status active (1) or inactive (0)
const changeUserStatus = (req, res) => {
  const { user_id } = req.params;
  const { status } = req.body;

  if (status != 0 && status != 1) {
    return res.status(400).json({ message: "Invalid status. Use 0 for inactive and 1 for active." });
  }

  con.query("UPDATE users SET status = ? WHERE user_id = ?", [String(status), user_id], (err, result) => {
    if (err) {
      console.error("Error updating user status:", err);
      return res.status(500).json({ message: "Error updating user status" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User status updated successfully" });
  });
};

// Delete user
const deleteUser = (req, res) => {
  const { user_id } = req.params;

  // First fetch the user to get the avatar_url
  con.query("SELECT avatar_url FROM users WHERE user_id = ?", [user_id], (fetchErr, results) => {
    if (fetchErr) {
      console.error("Error fetching user for deletion:", fetchErr);
      return res.status(500).json({ message: "Error fetching user" });
    }

    const avatarUrl = results.length > 0 ? results[0].avatar_url : null;

    con.query("DELETE FROM users WHERE user_id = ?", [user_id], (err, result) => {
      if (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ message: "Error deleting user" });
      }

      if (result.affectedRows === 0) {
        console.error("User not found for deletion, user_id:", user_id);
        return res.status(404).json({ message: "User not found" });
      }

      // If deletion from DB was successful, delete the avatar file
      if (avatarUrl) {
        const filePath = path.join(__dirname, "..", avatarUrl);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.error(`Error deleting avatar file ${filePath}:`, unlinkErr);
          } else {
            console.log(`Deleted avatar file: ${filePath}`);
          }
        });
      }

      console.log("User deleted successfully, user_id:", user_id);
      res.json({ message: "User deleted successfully" });
    });
  });
};

// Get user role for current user
const getUserRoles = (req, res) => {
  try {
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
        console.error("Database query error for user roles:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "User role not found" });
      }
      res.json(results[0]);
    });
  } catch (error) {
    console.error("Error in getUserRoles:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addUser,
  getUserRoles,
  getAllRoles,
  getDepartment,
  getAllUsers,
  changeUserStatus,
  updateUser,
  deleteUser
};
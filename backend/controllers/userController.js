// controllers/userController.js

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const con = require("../models/db");

// 1. Add new user (Creates Employee Profile + User Account in transaction)
const addUser = async (req, res) => {
  const { fname, lname, email, phone, department_id, role_id, user_name, password, status = '1' } = req.body;

  if (!user_name || !password || !email || !fname || !lname) {
    return res.status(400).json({ message: "Missing required fields (username, password, email, first name, last name)" });
  }

  // Phone Validation (Optional but must be valid if provided)
  const phoneRegex = /^(\+251|0)[79]\d{8}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Invalid phone number format. Use +251 9... or 09..." });
  }

  // Email Validation
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
    connection = await con.promise().getConnection();
    await connection.beginTransaction();

    // Check if user_name already exists
    const [existingUsers] = await connection.query("SELECT user_id FROM users WHERE LOWER(user_name) = LOWER(?)", [user_name.trim()]);
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: `Username "${user_name.trim()}" already exists` });
    }

    // Check if employee email already exists
    const [existingEmp] = await connection.query("SELECT employee_id FROM employees WHERE LOWER(email) = LOWER(?)", [email.trim()]);
    if (existingEmp.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: `An employee/user with email "${email.trim()}" already exists` });
    }

    // 1. Create Employee Profile
    const empName = `${fname.trim()} ${lname.trim()}`;
    const [empResult] = await connection.query(
      "INSERT INTO employees (name, fname, lname, email, phone, department_id, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        empName,
        fname.trim(),
        lname.trim(),
        email.trim(),
        phone ? phone.trim() : null,
        department_id ? Number(department_id) : null,
        role_id ? Number(role_id) : null
      ]
    );
    const employee_id = empResult.insertId;

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User Account
    const userStatus = status == 0 || status === '0' ? '0' : '1';
    const [userResult] = await connection.query(
      "INSERT INTO users (employee_id, user_name, password, role_id, status, failed_login_attempts) VALUES (?, ?, ?, ?, ?, 0)",
      [employee_id, user_name.trim(), hashedPassword, role_id ? Number(role_id) : null, userStatus]
    );

    await connection.commit();

    console.log(`User created: ${user_name} (User ID: ${userResult.insertId}, Employee ID: ${employee_id})`);
    return res.status(201).json({
      success: true,
      message: `User "${user_name.trim()}" created successfully`,
      user_id: userResult.insertId,
      employee_id
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error adding user:", error);
    return res.status(500).json({ message: "Error adding user", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// 2. Update existing user
const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { fname, lname, user_name, email, phone, department_id, role_id, password, status } = req.body;

  // Phone Validation
  const phoneRegex = /^(\+251|0)[79]\d{8}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Invalid phone number format. Use +251 9... or 09..." });
  }

  // Email Validation if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address format" });
    }
  }

  let connection;
  try {
    connection = await con.promise().getConnection();
    await connection.beginTransaction();

    // Retrieve user and employee info
    const [usersData] = await connection.query("SELECT user_id, employee_id, user_name, role_id FROM users WHERE user_id = ?", [user_id]);
    if (!usersData || usersData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    const currentUser = usersData[0];
    const employee_id = currentUser.employee_id;

    // Check username uniqueness if changed
    if (user_name && user_name.trim().toLowerCase() !== currentUser.user_name.toLowerCase()) {
      const [existingUser] = await connection.query(
        "SELECT user_id FROM users WHERE LOWER(user_name) = LOWER(?) AND user_id != ?",
        [user_name.trim(), user_id]
      );
      if (existingUser.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: `Username "${user_name.trim()}" is already taken.` });
      }
    }

    // Check email uniqueness if email provided and linked to employee
    if (email && employee_id) {
      const [existingEmail] = await connection.query(
        "SELECT employee_id FROM employees WHERE LOWER(email) = LOWER(?) AND employee_id != ?",
        [email.trim(), employee_id]
      );
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: `Email "${email.trim()}" is already in use by another employee.` });
      }
    }

    // Update employee profile if employee record exists
    if (employee_id) {
      const fullName = fname && lname ? `${fname.trim()} ${lname.trim()}` : undefined;
      await connection.query(
        `UPDATE employees SET
           fname = COALESCE(?, fname),
           lname = COALESCE(?, lname),
           name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           department_id = COALESCE(?, department_id),
           role_id = COALESCE(?, role_id)
         WHERE employee_id = ?`,
        [
          fname ? fname.trim() : null,
          lname ? lname.trim() : null,
          fullName || null,
          email ? email.trim() : null,
          phone ? phone.trim() : null,
          department_id !== undefined ? (department_id ? Number(department_id) : null) : null,
          role_id !== undefined ? (role_id ? Number(role_id) : null) : null,
          employee_id
        ]
      );
    }

    // Prepare User table update
    let updateUserSql = "UPDATE users SET user_name = COALESCE(?, user_name), role_id = COALESCE(?, role_id)";
    const queryParams = [
      user_name ? user_name.trim() : null,
      role_id !== undefined ? (role_id ? Number(role_id) : null) : null
    ];

    if (status !== undefined) {
      updateUserSql += ", status = ?";
      queryParams.push(status == 1 || status === '1' ? '1' : '0');
    }

    if (password && password.trim() !== "") {
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

    return res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Error updating user", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// 3. Assign or Change User Role (Dedicated Dynamic Role Assignment Endpoint)
const assignRole = async (req, res) => {
  const { user_id } = req.params;
  const { role_id } = req.body;

  if (!role_id) {
    return res.status(400).json({ message: "Target role_id is required" });
  }

  let connection;
  try {
    connection = await con.promise().getConnection();
    await connection.beginTransaction();

    // Check if role exists
    const [roles] = await connection.query("SELECT role_id, role_name, status FROM roles WHERE role_id = ?", [role_id]);
    if (!roles.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Selected role does not exist" });
    }

    // Check user exists
    const [users] = await connection.query("SELECT user_id, employee_id, user_name FROM users WHERE user_id = ?", [user_id]);
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Update user role
    await connection.query("UPDATE users SET role_id = ? WHERE user_id = ?", [role_id, user_id]);

    // If linked to employee, update employee role as well
    if (users[0].employee_id) {
      await connection.query("UPDATE employees SET role_id = ? WHERE employee_id = ?", [role_id, users[0].employee_id]);
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Role "${roles[0].role_name}" assigned to user "${users[0].user_name}" successfully.`,
      role_id: Number(role_id),
      role_name: roles[0].role_name
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error assigning role:", err);
    return res.status(500).json({ message: "Error assigning role", error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// 4. Get all users (enriched with department, role, online status, lock status)
const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.user_name, u.role_id, u.status, u.online_flag,
             u.failed_login_attempts, u.account_locked_until, u.created_at, u.updated_at,
             u.employee_id,
             e.name, e.fname, e.lname, e.email, e.phone, e.department_id,
             r.role_name,
             d.name AS department_name
      FROM users u 
      LEFT JOIN employees e ON u.employee_id = e.employee_id
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      ORDER BY u.created_at DESC
    `;
    const [results] = await con.promise().query(query);
    return res.json(results);
  } catch (err) {
    console.error("Error retrieving users:", err);
    return res.status(500).json({ message: "Error retrieving users", error: err.message });
  }
};

// 5. Get single user by ID
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const query = `
      SELECT u.user_id, u.user_name, u.role_id, u.status, u.online_flag,
             u.failed_login_attempts, u.account_locked_until, u.created_at, u.updated_at,
             u.employee_id,
             e.name, e.fname, e.lname, e.email, e.phone, e.department_id,
             r.role_name,
             d.name AS department_name
      FROM users u 
      LEFT JOIN employees e ON u.employee_id = e.employee_id
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE u.user_id = ?
    `;
    const [results] = await con.promise().query(query, [user_id]);
    if (!results.length) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(results[0]);
  } catch (err) {
    console.error("Error retrieving user:", err);
    return res.status(500).json({ message: "Error retrieving user", error: err.message });
  }
};

// 6. Change user status active (1) or inactive (0)
const changeUserStatus = async (req, res) => {
  const { user_id } = req.params;
  const { status } = req.body;

  if (status != 0 && status != 1) {
    return res.status(400).json({ message: "Invalid status. Use 0 for inactive and 1 for active." });
  }

  try {
    const [result] = await con.promise().query(
      "UPDATE users SET status = ? WHERE user_id = ?",
      [String(status), user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ success: true, message: `User status changed to ${status == 1 ? 'Active' : 'Inactive'}` });
  } catch (err) {
    console.error("Error updating user status:", err);
    return res.status(500).json({ message: "Error updating user status", error: err.message });
  }
};

// 7. Unlock user account
const unlockUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [result] = await con.promise().query(
      "UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE user_id = ?",
      [user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ success: true, message: "User account unlocked successfully" });
  } catch (err) {
    console.error("Error unlocking user account:", err);
    return res.status(500).json({ message: "Error unlocking user account", error: err.message });
  }
};

// 8. Delete user (with self-deletion guard and cleanup)
const deleteUser = async (req, res) => {
  const { user_id } = req.params;
  const currentUserId = req.user ? Number(req.user.user_id) : null;

  // Prevent self-deletion
  if (currentUserId && currentUserId === Number(user_id)) {
    return res.status(400).json({
      message: "Security violation: You cannot delete your own active administrator account."
    });
  }

  try {
    const db = con.promise();

    // Check user existence and get avatar
    const [users] = await db.query("SELECT avatar_url, user_name FROM users WHERE user_id = ?", [user_id]);
    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const avatarUrl = users[0].avatar_url;

    // Clean up user overrides if table exists
    try {
      await db.query("DELETE FROM user_menu_permissions WHERE user_id = ?", [user_id]);
    } catch (ignored) {}

    // Delete user record
    await db.query("DELETE FROM users WHERE user_id = ?", [user_id]);

    // Delete avatar file if stored locally
    if (avatarUrl) {
      const filePath = path.join(__dirname, "..", avatarUrl);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== 'ENOENT') {
          console.error(`Error deleting avatar file ${filePath}:`, unlinkErr);
        }
      });
    }

    console.log(`User deleted: ${users[0].user_name} (ID: ${user_id}) by Admin ID: ${currentUserId}`);
    return res.json({ success: true, message: `User "${users[0].user_name}" deleted successfully` });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

// 9. Get all departments
const getDepartment = (req, res) => {
  con.query("SELECT * FROM departments ORDER BY name ASC", (err, results) => {
    if (err) {
      console.error("Error retrieving departments:", err);
      return res.status(500).json({ message: "Error retrieving departments" });
    }
    res.json(results);
  });
};

// 10. Get all roles
const getAllRoles = (req, res) => {
  con.query("SELECT * FROM roles ORDER BY role_id ASC", (err, results) => {
    if (err) {
      console.error("Error retrieving roles:", err);
      return res.status(500).json({ message: "Error retrieving roles" });
    }
    res.json(results);
  });
};

// 11. Get user role for current user
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
  updateUser,
  assignRole,
  getAllUsers,
  getUserById,
  changeUserStatus,
  unlockUser,
  deleteUser,
  getDepartment,
  getAllRoles,
  getUserRoles
};
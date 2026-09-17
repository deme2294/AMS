// employeeController.js
// importing db connection
const con = require("../models/db");
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const util = require("util");
// Function to add a new employee and create a corresponding user

const addEmployee = async (req, res) => {
    const {
        name, role_id, department_id, supervisor_id, fname, lname, email, phone, sex
    } = req.body;

    try {
        // 1. Format Validation
        const phoneRegex = /^(\+251|0)[1-9]\d{8}$/;
        if (phone && !phoneRegex.test(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format. Use +251 9... or 09...' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format' });
        }

        // Promisify the query method for easier async handling
        const query = util.promisify(con.query).bind(con);

        // SECURITY: Duplicate Detection - Check if employee already exists
        // Check by Email
        if (email) {
            const existingEmail = await query('SELECT employee_id, fname, lname FROM employees WHERE email = ?', [email]);
            if (existingEmail.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Duplicate record detected: An employee with email "${email}" already exists (${existingEmail[0].fname} ${existingEmail[0].lname}).`,
                    duplicate_field: 'email'
                });
            }
        }

        // Check by Phone
        if (phone) {
            const existingPhone = await query('SELECT employee_id, fname, lname FROM employees WHERE phone = ?', [phone]);
            if (existingPhone.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Duplicate record detected: An employee with phone number "${phone}" already exists (${existingPhone[0].fname} ${existingPhone[0].lname}).`,
                    duplicate_field: 'phone'
                });
            }
        }

        // Insert the new employee into the employees table
        const employeeResult = await query(
            'INSERT INTO employees (name, role_id, department_id, supervisor_id, fname, lname, email, phone, sex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, role_id, department_id || null, supervisor_id || null, fname, lname, email, phone, sex]
        );

        // Check if the employee insertion was successful
        if (!employeeResult || !employeeResult.insertId) {
            console.error("Employee insertion failed.");
            return res.status(500).json({ message: "Failed to insert employee data into the database." });
        }

        // Get the employee ID of the newly created employee
        const employee_id = employeeResult.insertId;

        // Set up default username and password for the new user
        const defaultUsername = email; // Username set as employee's email
        const defaultPassword = 'itp@123'; // Default password
        const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Hash the password for security

        // Insert the user data into the Users table with role_id included
        const userResult = await query(
            'INSERT INTO users (employee_id, user_name, password, role_id) VALUES (?, ?, ?, ?)',
            [employee_id, defaultUsername, hashedPassword, role_id]
        );

        // Check if the user insertion was successful
        if (!userResult || !userResult.insertId) {
            console.error("User account creation failed.");
            return res.status(500).json({ message: "Failed to create user account for employee." });
        }

        // Respond with success message and employee ID
        res.json({ employee_id, message: 'Employee and user created successfully.' });
    } catch (error) {
        console.error("Error registering employee and user:", error);
        res.status(500).json({ message: "Failed to register employee and create user." });
    }
};


// Function to fetch all employees with department and role names
const getAllEmployees = (req, res) => {
    const query = `
        SELECT e.*, d.name as department_name, r.role_name 
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.department_id
        LEFT JOIN roles r ON e.role_id = r.role_id
        ORDER BY e.employee_id DESC
    `;
    con.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).json({ message: 'Error fetching employees' });
        }
        res.json(results);
    });
};

// Function to batch add employees
const batchAddEmployees = async (req, res) => {
    const { employees } = req.body; // Array of employee objects

    if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "Invalid or empty employees list" });
    }

    const connection = await con.promise().getConnection();
    try {
        await connection.beginTransaction();

        const duplicates = [];
        const validEmployees = [];

        // Maps for intra-batch duplicate checking
        const batchEmailMap = new Map();
        const batchPhoneMap = new Map();

        // 1. Identify duplicates
        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            let isDuplicate = false;
            let reason = '';

            // Check against database
            if (emp.email) {
                const [dbEmail] = await connection.query('SELECT employee_id FROM employees WHERE email = ?', [emp.email]);
                if (dbEmail.length > 0) {
                    isDuplicate = true;
                    reason = `Email "${emp.email}" already exists in database.`;
                }

                // Check within batch
                if (!isDuplicate && batchEmailMap.has(emp.email)) {
                    isDuplicate = true;
                    reason = `Duplicate email "${emp.email}" found within this batch (Row ${batchEmailMap.get(emp.email) + 1}).`;
                } else if (!isDuplicate) {
                    batchEmailMap.set(emp.email, i);
                }
            }

            if (!isDuplicate && emp.phone) {
                const [dbPhone] = await connection.query('SELECT employee_id FROM employees WHERE phone = ?', [emp.phone]);
                if (dbPhone.length > 0) {
                    isDuplicate = true;
                    reason = `Phone number "${emp.phone}" already exists in database.`;
                }

                // Check within batch
                if (!isDuplicate && batchPhoneMap.has(emp.phone)) {
                    isDuplicate = true;
                    reason = `Duplicate phone number "${emp.phone}" found within this batch (Row ${batchPhoneMap.get(emp.phone) + 1}).`;
                } else if (!isDuplicate) {
                    batchPhoneMap.set(emp.phone, i);
                }
            }

            if (isDuplicate) {
                duplicates.push({ row: i + 1, name: emp.name || `${emp.fname} ${emp.lname}`, reason });
            } else {
                validEmployees.push(emp);
            }
        }

        // If duplicates found, abort and report
        if (duplicates.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: `Batch registration blocked: ${duplicates.length} duplicate(s) detected.`,
                duplicates
            });
        }

        // 2. Insert valid employees
        for (const emp of validEmployees) {
            const { name, role_id, department_id, supervisor_id, fname, lname, email, phone, sex } = emp;

            // Insert Employee
            const [empResult] = await connection.query(
                'INSERT INTO employees (name, role_id, department_id, supervisor_id, fname, lname, email, phone, sex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name || `${fname} ${lname}`, role_id, department_id || null, supervisor_id || null, fname, lname, email, phone, sex]
            );

            const employee_id = empResult.insertId;

            // Create User account
            const defaultPassword = 'itp@123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            await connection.query(
                'INSERT INTO users (employee_id, user_name, password, role_id, status) VALUES (?, ?, ?, ?, "1")',
                [employee_id, email, hashedPassword, role_id]
            );
        }

        await connection.commit();
        res.json({ success: true, message: `Successfully registered ${validEmployees.length} employees and user accounts.` });
    } catch (error) {
        await connection.rollback();
        console.error("Error in batch registration:", error);
        res.status(500).json({ message: "Batch registration failed" });
    } finally {
        connection.release();
    }
};

// Function to fetch all departments
const getAllDepartments = (req, res) => {
    con.query('SELECT * FROM departments', (err, results) => {
        if (err) {
            console.error('Error fetching departments:', err);
            return res.status(500).json({ message: 'Error fetching departments' });
        }
        res.json(results);
    });
};

// Function to fetch all roles
const getAllRoles = (req, res) => {
    con.query('SELECT * FROM roles', (err, results) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return res.status(500).json({ message: 'Error fetching roles' });
        }
        res.json(results);
    });
};

// Function to fetch all supervisors
const getAllSupervisors = (req, res) => {
    con.query('SELECT * FROM employees', (err, results) => {
        if (err) {
            console.error('Error fetching supervisors:', err);
            return res.status(500).json({ message: 'Error fetching supervisors' });
        }
        res.json(results);
    });
};

// Exporting the functions for use in routes
module.exports = {
    getAllDepartments,
    getAllRoles,
    getAllSupervisors,
    addEmployee,
    getAllEmployees,
    batchAddEmployees
};

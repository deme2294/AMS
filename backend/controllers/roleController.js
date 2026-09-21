const con = require("../models/db");
const { ROLES, ROLE_NAMES, ROLE_DESCRIPTIONS } = require('../middleware/roles');

/**
 * System roles that cannot be deleted.
 * These are the 5 core roles required by the application.
 */
const SYSTEM_ROLE_IDS = Object.values(ROLES);

const DEFAULT_ROLES = [
    { role_id: ROLES.ADMIN,        role_name: 'Admin',        status: 1 },
    { role_id: ROLES.MANAGER,      role_name: 'Manager',      status: 1 },
    { role_id: ROLES.BARBER,       role_name: 'Barber',       status: 1 },
    { role_id: ROLES.RECEPTIONIST, role_name: 'Receptionist', status: 1 },
    { role_id: ROLES.CUSTOMER,     role_name: 'Customer',     status: 1 },
];

const roleController = {
    // Get all roles
    getAllRoles: (req, res) => {
        con.query("SELECT * FROM roles ORDER BY role_id ASC", (err, results) => {
            if (err) {
                console.error("Error retrieving roles:", err);
                return res.status(500).json({ success: false, message: "Error retrieving roles" });
            }
            // Enrich with descriptions
            const enriched = results.map(role => ({
                ...role,
                description: ROLE_DESCRIPTIONS[role.role_id] || null,
                is_system: SYSTEM_ROLE_IDS.includes(role.role_id),
            }));
            res.json(enriched);
        });
    },

    // Get a single role by ID
    getRoleById: (req, res) => {
        const { id } = req.params;
        con.query("SELECT * FROM roles WHERE role_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Error retrieving role" });
            if (!results.length) return res.status(404).json({ success: false, message: "Role not found" });
            const role = results[0];
            res.json({
                ...role,
                description: ROLE_DESCRIPTIONS[role.role_id] || null,
                is_system: SYSTEM_ROLE_IDS.includes(role.role_id),
            });
        });
    },

    // Create a new role
    createRole: (req, res) => {
        const { role_name } = req.body;
        if (!role_name) {
            return res.status(400).json({ success: false, message: "Role name is required" });
        }

        con.query("INSERT INTO roles (role_name, status) VALUES (?, 1)", [role_name], (err, result) => {
            if (err) {
                console.error("Error creating role:", err);
                return res.status(500).json({ success: false, message: "Error creating role" });
            }
            res.status(201).json({ success: true, message: "Role created successfully", roleId: result.insertId });
        });
    },

    // Update a role
    updateRole: (req, res) => {
        const { id } = req.params;
        const { role_name, status } = req.body;

        // System roles cannot be renamed
        if (SYSTEM_ROLE_IDS.includes(Number(id)) && role_name) {
            const systemName = ROLE_NAMES[Number(id)];
            if (role_name.toLowerCase() !== systemName.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: `System role "${systemName}" cannot be renamed.`
                });
            }
        }

        con.query(
            "UPDATE roles SET role_name = ?, status = ? WHERE role_id = ?",
            [role_name, status, id],
            (err, result) => {
                if (err) {
                    console.error("Error updating role:", err);
                    return res.status(500).json({ success: false, message: "Error updating role" });
                }
                res.json({ success: true, message: "Role updated successfully" });
            }
        );
    },

    // Delete a role (system roles are protected)
    deleteRole: (req, res) => {
        const { id } = req.params;

        if (SYSTEM_ROLE_IDS.includes(Number(id))) {
            return res.status(403).json({
                success: false,
                message: `System role "${ROLE_NAMES[Number(id)]}" cannot be deleted.`
            });
        }

        con.query("DELETE FROM roles WHERE role_id = ?", [id], (err, result) => {
            if (err) {
                console.error("Error deleting role:", err);
                return res.status(500).json({ success: false, message: "Error deleting role" });
            }
            res.json({ success: true, message: "Role deleted successfully" });
        });
    },

    /**
     * Seed default system roles into the DB.
     * Safe to call on every startup — uses INSERT IGNORE to skip existing rows.
     */
    seedDefaultRoles: async () => {
        const db = con.promise();
        try {
            for (const role of DEFAULT_ROLES) {
                await db.query(
                    `INSERT IGNORE INTO roles (role_id, role_name, status)
                     VALUES (?, ?, ?)`,
                    [role.role_id, role.role_name, role.status]
                );
            }
            console.log('[ROLES] ✅ Default system roles seeded successfully.');
        } catch (err) {
            console.error('[ROLES] ❌ Failed to seed default roles:', err.message);
        }
    },
};

module.exports = roleController;

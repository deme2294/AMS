const con = require("../models/db");
const { ROLES, ROLE_NAMES, ROLE_DESCRIPTIONS } = require('../middleware/roles');

/**
 * System roles that cannot be deleted.
 * These core system roles are required by the application lifecycle.
 */
const SYSTEM_ROLE_IDS = Object.values(ROLES);

const DEFAULT_ROLES = [
    { role_id: ROLES.ADMIN,        role_name: 'Admin',        description: 'Full system control — manage all resources, users, analytics and settings.', status: 1 },
    { role_id: ROLES.BARBER,       role_name: 'Barber',       description: 'View assigned services, customers, and appointments. Mark progress.', status: 1 },
    { role_id: ROLES.CUSTOMER,     role_name: 'Customer',     description: 'Book services, view history, rate completed services, and submit complaints.', status: 1 },
    { role_id: ROLES.MANAGER,      role_name: 'Manager',      description: 'Manage an assigned branch, employees, and operational reports.', status: 1 },
    { role_id: ROLES.RECEPTIONIST, role_name: 'Receptionist', description: 'Handle walk-ins, assist bookings, monitor queue, and check-in customers.', status: 1 },
];

const roleController = {
    // 1. Get all roles (with user counts, system flag, and dynamic descriptions)
    getAllRoles: async (req, res) => {
        try {
            const db = con.promise();
            const [results] = await db.query(
                `SELECT r.role_id, r.role_name, r.description, r.status, r.created_at, r.updated_at,
                        COUNT(DISTINCT u.user_id) AS user_count
                 FROM roles r
                 LEFT JOIN users u ON r.role_id = u.role_id
                 GROUP BY r.role_id, r.role_name, r.description, r.status, r.created_at, r.updated_at
                 ORDER BY r.role_id ASC`
            );

            const enriched = results.map(role => ({
                ...role,
                description: role.description || ROLE_DESCRIPTIONS[role.role_id] || null,
                is_system: SYSTEM_ROLE_IDS.includes(Number(role.role_id)),
                user_count: Number(role.user_count || 0),
            }));

            return res.json(enriched);
        } catch (err) {
            console.error("Error retrieving roles:", err);
            return res.status(500).json({ success: false, message: "Error retrieving roles", error: err.message });
        }
    },

    // 2. Get single role by ID with details and user count
    getRoleById: async (req, res) => {
        try {
            const { id } = req.params;
            const db = con.promise();

            const [results] = await db.query(
                `SELECT r.role_id, r.role_name, r.description, r.status, r.created_at, r.updated_at,
                        COUNT(DISTINCT u.user_id) AS user_count
                 FROM roles r
                 LEFT JOIN users u ON r.role_id = u.role_id
                 WHERE r.role_id = ?
                 GROUP BY r.role_id, r.role_name, r.description, r.status, r.created_at, r.updated_at`,
                [id]
            );

            if (!results.length) {
                return res.status(404).json({ success: false, message: "Role not found" });
            }

            const role = results[0];
            const [perms] = await db.query(
                `SELECT menu_id, can_view, can_create, can_edit, can_delete 
                 FROM role_menu_permissions WHERE role_id = ?`,
                [id]
            );

            return res.json({
                ...role,
                description: role.description || ROLE_DESCRIPTIONS[role.role_id] || null,
                is_system: SYSTEM_ROLE_IDS.includes(Number(role.role_id)),
                user_count: Number(role.user_count || 0),
                permissions: perms,
            });
        } catch (err) {
            console.error("Error retrieving role:", err);
            return res.status(500).json({ success: false, message: "Error retrieving role", error: err.message });
        }
    },

    // 3. Create dynamic role (with optional description, status, and clone permissions)
    createRole: async (req, res) => {
        try {
            const { role_name, description = null, status = 1, clone_from_role_id = null } = req.body;

            if (!role_name || !role_name.trim()) {
                return res.status(400).json({ success: false, message: "Role name is required" });
            }

            const cleanName = role_name.trim();
            const db = con.promise();

            // Check name uniqueness (case-insensitive)
            const [existing] = await db.query(
                "SELECT role_id FROM roles WHERE LOWER(role_name) = LOWER(?)",
                [cleanName]
            );

            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: `A role with name "${cleanName}" already exists.` });
            }

            // Insert new role
            const [result] = await db.query(
                "INSERT INTO roles (role_name, description, status) VALUES (?, ?, ?)",
                [cleanName, description ? description.trim() : null, status ? 1 : 0]
            );

            const newRoleId = result.insertId;

            // Optional: Clone permissions from source role
            let clonedCount = 0;
            if (clone_from_role_id) {
                const [sourcePerms] = await db.query(
                    "SELECT menu_id, can_view, can_create, can_edit, can_delete FROM role_menu_permissions WHERE role_id = ?",
                    [clone_from_role_id]
                );

                if (sourcePerms.length > 0) {
                    const values = sourcePerms.map(p => [
                        newRoleId,
                        p.menu_id,
                        p.can_view,
                        p.can_create,
                        p.can_edit,
                        p.can_delete
                    ]);

                    await db.query(
                        `INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES ?`,
                        [values]
                    );
                    clonedCount = values.length;
                }
            }

            const [newRole] = await db.query("SELECT * FROM roles WHERE role_id = ?", [newRoleId]);

            return res.status(201).json({
                success: true,
                message: `Role "${cleanName}" created successfully${clonedCount > 0 ? ` with ${clonedCount} permissions copied` : ''}.`,
                roleId: newRoleId,
                data: {
                    ...newRole[0],
                    is_system: false,
                    user_count: 0
                }
            });
        } catch (err) {
            console.error("Error creating role:", err);
            return res.status(500).json({ success: false, message: "Error creating role", error: err.message });
        }
    },

    // 4. Update role (name, description, status)
    updateRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role_name, description, status } = req.body;
            const roleIdNum = Number(id);
            const db = con.promise();

            // Verify existence
            const [existing] = await db.query("SELECT * FROM roles WHERE role_id = ?", [id]);
            if (!existing.length) {
                return res.status(404).json({ success: false, message: "Role not found" });
            }

            // System roles cannot be renamed to arbitrary names
            if (SYSTEM_ROLE_IDS.includes(roleIdNum) && role_name) {
                const systemName = ROLE_NAMES[roleIdNum];
                if (role_name.trim().toLowerCase() !== systemName.toLowerCase()) {
                    return res.status(400).json({
                        success: false,
                        message: `System role "${systemName}" cannot be renamed to preserve core system integrity.`
                    });
                }
            }

            // Name uniqueness check for non-system roles or when name is changed
            if (role_name && role_name.trim().toLowerCase() !== existing[0].role_name.toLowerCase()) {
                const [conflict] = await db.query(
                    "SELECT role_id FROM roles WHERE LOWER(role_name) = LOWER(?) AND role_id != ?",
                    [role_name.trim(), id]
                );
                if (conflict.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Another role named "${role_name.trim()}" already exists.`
                    });
                }
            }

            const newRoleName = role_name ? role_name.trim() : existing[0].role_name;
            const newDesc = description !== undefined ? (description ? description.trim() : null) : existing[0].description;
            const newStatus = status !== undefined ? (status == 1 ? 1 : 0) : existing[0].status;

            await db.query(
                "UPDATE roles SET role_name = ?, description = ?, status = ? WHERE role_id = ?",
                [newRoleName, newDesc, newStatus, id]
            );

            return res.json({
                success: true,
                message: `Role "${newRoleName}" updated successfully.`
            });
        } catch (err) {
            console.error("Error updating role:", err);
            return res.status(500).json({ success: false, message: "Error updating role", error: err.message });
        }
    },

    // 5. Delete role (with user assignment check and permission cleanup)
    deleteRole: async (req, res) => {
        try {
            const { id } = req.params;
            const roleIdNum = Number(id);
            const db = con.promise();

            // 1. Guard system roles
            if (SYSTEM_ROLE_IDS.includes(roleIdNum)) {
                return res.status(403).json({
                    success: false,
                    message: `System role "${ROLE_NAMES[roleIdNum] || id}" cannot be deleted.`
                });
            }

            // 2. Check if role exists
            const [role] = await db.query("SELECT * FROM roles WHERE role_id = ?", [id]);
            if (!role.length) {
                return res.status(404).json({ success: false, message: "Role not found" });
            }

            // 3. Safety check: Are any users assigned to this role?
            const [userCount] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role_id = ?", [id]);
            const [empCount] = await db.query("SELECT COUNT(*) AS count FROM employees WHERE role_id = ?", [id]);
            const assignedCount = (userCount[0]?.count || 0) + (empCount[0]?.count || 0);

            if (assignedCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete role "${role[0].role_name}": ${assignedCount} user(s)/employee(s) are currently assigned to it. Please reassign or remove them first.`,
                    assignedCount
                });
            }

            // 4. Delete role menu permissions
            await db.query("DELETE FROM role_menu_permissions WHERE role_id = ?", [id]);

            // 5. Delete the role itself
            await db.query("DELETE FROM roles WHERE role_id = ?", [id]);

            return res.json({
                success: true,
                message: `Role "${role[0].role_name}" and its permissions were deleted successfully.`
            });
        } catch (err) {
            console.error("Error deleting role:", err);
            return res.status(500).json({ success: false, message: "Error deleting role", error: err.message });
        }
    },

    // 6. Clone an existing role along with all its permissions
    cloneRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role_name, description = null } = req.body;

            if (!role_name || !role_name.trim()) {
                return res.status(400).json({ success: false, message: "New role name is required for cloning." });
            }

            const cleanName = role_name.trim();
            const db = con.promise();

            // Verify source role exists
            const [sourceRole] = await db.query("SELECT * FROM roles WHERE role_id = ?", [id]);
            if (!sourceRole.length) {
                return res.status(404).json({ success: false, message: "Source role not found." });
            }

            // Check if name already taken
            const [conflict] = await db.query(
                "SELECT role_id FROM roles WHERE LOWER(role_name) = LOWER(?)",
                [cleanName]
            );
            if (conflict.length > 0) {
                return res.status(400).json({ success: false, message: `A role named "${cleanName}" already exists.` });
            }

            // Insert new cloned role
            const newDesc = description ? description.trim() : (sourceRole[0].description || `Cloned from ${sourceRole[0].role_name}`);
            const [insertResult] = await db.query(
                "INSERT INTO roles (role_name, description, status) VALUES (?, ?, 1)",
                [cleanName, newDesc]
            );

            const newRoleId = insertResult.insertId;

            // Copy permissions from source role
            const [sourcePerms] = await db.query(
                "SELECT menu_id, can_view, can_create, can_edit, can_delete FROM role_menu_permissions WHERE role_id = ?",
                [id]
            );

            let copiedCount = 0;
            if (sourcePerms.length > 0) {
                const values = sourcePerms.map(p => [
                    newRoleId,
                    p.menu_id,
                    p.can_view,
                    p.can_create,
                    p.can_edit,
                    p.can_delete
                ]);

                await db.query(
                    `INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete) VALUES ?`,
                    [values]
                );
                copiedCount = values.length;
            }

            const [created] = await db.query("SELECT * FROM roles WHERE role_id = ?", [newRoleId]);

            return res.status(201).json({
                success: true,
                message: `Role "${cleanName}" created successfully with ${copiedCount} permissions copied from "${sourceRole[0].role_name}".`,
                roleId: newRoleId,
                data: {
                    ...created[0],
                    is_system: false,
                    user_count: 0
                }
            });
        } catch (err) {
            console.error("Error cloning role:", err);
            return res.status(500).json({ success: false, message: "Failed to clone role", error: err.message });
        }
    },

    // 7. Get users assigned to a specific role
    getRoleUsers: async (req, res) => {
        try {
            const { id } = req.params;
            const db = con.promise();

            const [users] = await db.query(
                `SELECT u.user_id, u.user_name, u.status, u.created_at,
                        e.employee_id, e.name AS full_name, e.fname, e.lname, e.email, e.phone
                 FROM users u
                 LEFT JOIN employees e ON u.employee_id = e.employee_id
                 WHERE u.role_id = ?
                 ORDER BY u.user_id ASC`,
                [id]
            );

            return res.json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (err) {
            console.error("Error getting role users:", err);
            return res.status(500).json({ success: false, message: "Failed to retrieve users for this role", error: err.message });
        }
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
                    `INSERT INTO roles (role_id, role_name, description, status)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                       description = COALESCE(roles.description, VALUES(description)),
                       status = VALUES(status)`,
                    [role.role_id, role.role_name, role.description, role.status]
                );
            }
            console.log('[ROLES] ✅ Default system roles verified/seeded successfully.');
        } catch (err) {
            console.error('[ROLES] ❌ Failed to seed default roles:', err.message);
        }
    },
};

module.exports = roleController;

const con = require('../models/db');
const { ROLES, ROLE_NAMES, getRoleName } = require('./roles');

/**
 * Middleware to restrict access based on user roles and dynamic permissions.
 * Expects verifyToken to have been called already (req.user exists).
 * 
 * Accepts:
 *   - A single role ID (number): restrictTo(1)
 *   - An array of role IDs: restrictTo([1, 2])
 *   - A role name string: restrictTo('ADMIN')
 *   - An array of role name strings: restrictTo(['ADMIN', 'MANAGER'])
 *   - Mixed array: restrictTo([1, 'MANAGER'])
 */
const restrictTo = (allowedRoles = []) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const userRoleId = Number(req.user.role_id);

        // Normalize input to an array of numeric role IDs
        const rawRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (rawRoles.length === 0) return next();

        const numericRoles = rawRoles.map(r => {
            if (typeof r === 'string') {
                const resolved = ROLES[r.toUpperCase()];
                if (!resolved) {
                    return null;
                }
                return resolved;
            }
            return Number(r);
        }).filter(Boolean);

        // Fast-path: Admin or explicitly allowed static role
        if (userRoleId === ROLES.ADMIN || numericRoles.includes(userRoleId)) {
            return next();
        }

        // Dynamic-path: Check if dynamic role has permission in database
        try {
            const db = con.promise();

            // 1. Check if the role is active
            const [roleRows] = await db.query("SELECT role_name, status FROM roles WHERE role_id = ?", [userRoleId]);
            if (roleRows.length > 0 && roleRows[0].status == 0) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied: Your assigned role has been deactivated by Administrator."
                });
            }

            // 2. Check menu permissions for this role
            const currentPath = req.baseUrl || req.originalUrl.split('?')[0];
            const method = req.method.toUpperCase();

            const [permRows] = await db.query(
                `SELECT rmp.can_view, rmp.can_create, rmp.can_edit, rmp.can_delete, m.path
                 FROM role_menu_permissions rmp
                 JOIN cms_menus m ON rmp.menu_id = m.id
                 WHERE rmp.role_id = ? AND m.is_active = 1`,
                [userRoleId]
            );

            const hasPermission = permRows.some(perm => {
                if (!perm.path) return false;
                const normalizedMenu = perm.path.replace(/^\//, '').toLowerCase();
                const normalizedReq = currentPath.replace(/^\/api\//, '').replace(/^\//, '').toLowerCase();

                const isMatching = normalizedReq.startsWith(normalizedMenu) || normalizedMenu.startsWith(normalizedReq);
                if (!isMatching) return false;

                if (method === 'GET') return perm.can_view == 1;
                if (method === 'POST') return perm.can_create == 1;
                if (method === 'PUT' || method === 'PATCH') return perm.can_edit == 1;
                if (method === 'DELETE') return perm.can_delete == 1;
                return perm.can_view == 1;
            });

            if (hasPermission) {
                return next();
            }
        } catch (dbErr) {
            console.error("[RBAC] Dynamic permission evaluation error:", dbErr.message);
        }

        const userRoleName = getRoleName(userRoleId);
        console.warn(
            `[SECURITY] Unauthorized: user=${req.user.user_id} role="${userRoleName}"(${userRoleId}) ` +
            `tried ${req.method} ${req.originalUrl} ` +
            `(requires: ${numericRoles.map(getRoleName).join(', ')})`
        );

        return res.status(403).json({
            success: false,
            message: "Access Denied: You do not have permission to perform this action.",
            required_roles: numericRoles.map(getRoleName),
        });
    };
};

/**
 * Shorthand helpers for common access patterns.
 */
const adminOnly       = restrictTo([ROLES.ADMIN]);
const managementOnly  = restrictTo([ROLES.ADMIN, ROLES.MANAGER]);
const staffOnly       = restrictTo([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST]);
const notCustomer     = restrictTo([ROLES.ADMIN, ROLES.MANAGER, ROLES.BARBER, ROLES.RECEPTIONIST]);

module.exports = {
    restrictTo,
    adminOnly,
    managementOnly,
    staffOnly,
    notCustomer,
    ROLES,
};

const { ROLES, ROLE_NAMES, getRoleName } = require('./roles');

/**
 * Middleware to restrict access based on user roles.
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
    return (req, res, next) => {
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
                    console.warn(`[RBAC] Unknown role name: "${r}"`);
                    return null;
                }
                return resolved;
            }
            return Number(r);
        }).filter(Boolean);

        if (numericRoles.includes(userRoleId)) {
            return next();
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

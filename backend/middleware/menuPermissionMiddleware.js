const db = require('../models/db');

/**
 * Middleware to check if the user has permission to access a specific feature
 * based on the menu management system.
 * @param {string} menuPath - The path defined in cms_menus table
 */
const hasMenuPermission = (menuPath) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.user_id;
            const roleId = req.user.role_id;

            // 1. Find the menu ID for this path
            const [menus] = await db.promise().query('SELECT id FROM cms_menus WHERE path = ? LIMIT 1', [menuPath]);

            if (menus.length === 0) {
                // If the path doesn't exist in our menu system, we might allow it (or block it)
                // For safety, let's allow it if it's not a managed menu item, 
                // but usually we want to block it if we are using this middleware.
                return next();
            }

            const menuId = menus[0].id;

            // 2. Check User Override (Highest Priority)
            const [userPerms] = await db.promise().query(
                'SELECT permission_type FROM user_menu_permissions WHERE user_id = ? AND menu_id = ?',
                [userId, menuId]
            );

            if (userPerms.length > 0) {
                if (userPerms[0].permission_type === 'allow') {
                    return next();
                } else {
                    return res.status(403).json({ success: false, message: 'Access denied: Path restricted for your user account.' });
                }
            }

            // 3. Check Role Permission
            const [rolePerms] = await db.promise().query(
                'SELECT 1 FROM role_menu_permissions WHERE role_id = ? AND menu_id = ?',
                [roleId, menuId]
            );

            if (rolePerms.length > 0) {
                return next();
            }

            // If no permission found
            return res.status(403).json({ success: false, message: 'Access denied: Your role does not have permission to access this resource.' });

        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during permission check.' });
        }
    };
};

module.exports = { hasMenuPermission };

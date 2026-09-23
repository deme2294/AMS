const con = require("../models/db");
const { ROLES } = require("../middleware/roles");

const menuController = {
  // 1. Get navigation for logged-in user
  getMyNavigation: async (req, res) => {
    try {
      const userRole = req.user ? Number(req.user.role_id) : null;
      if (!userRole) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const db = con.promise();

      // Admin gets all active menus
      if (userRole === ROLES.ADMIN) {
        const [menus] = await db.query(
          "SELECT * FROM cms_menus WHERE is_active = 1 ORDER BY order_index ASC, id ASC"
        );
        return res.json({ success: true, data: menus });
      }

      // Other roles: only menus with can_view = 1
      const [menus] = await db.query(
        `SELECT m.* 
         FROM cms_menus m
         JOIN role_menu_permissions rmp ON m.id = rmp.menu_id
         WHERE rmp.role_id = ? AND rmp.can_view = 1 AND m.is_active = 1
         ORDER BY m.order_index ASC, m.id ASC`,
        [userRole]
      );

      return res.json({ success: true, data: menus });
    } catch (err) {
      console.error("Error in getMyNavigation:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch user navigation", error: err.message });
    }
  },

  // 2. Get all menus/modules (Admin & Manager catalog)
  getAllMenus: async (req, res) => {
    try {
      const db = con.promise();
      const [menus] = await db.query("SELECT * FROM cms_menus ORDER BY order_index ASC, id ASC");
      return res.json({ success: true, data: menus });
    } catch (err) {
      console.error("Error in getAllMenus:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch menus", error: err.message });
    }
  },

  // 3. Get single menu by ID
  getMenuById: async (req, res) => {
    try {
      const { id } = req.params;
      const db = con.promise();
      const [results] = await db.query("SELECT * FROM cms_menus WHERE id = ?", [id]);
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Menu not found" });
      }
      return res.json({ success: true, data: results[0] });
    } catch (err) {
      console.error("Error in getMenuById:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch menu", error: err.message });
    }
  },

  // 4. Create new permission / module
  createMenu: async (req, res) => {
    try {
      const {
        title,
        path = "",
        icon = "",
        color = "blue",
        parent_id = null,
        order_index = 0,
        is_section = 0,
        is_dropdown = 0,
        is_active = 1
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Module/Permission title is required" });
      }

      const db = con.promise();
      const [result] = await db.query(
        `INSERT INTO cms_menus 
         (title, path, icon, color, parent_id, order_index, is_section, is_dropdown, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          path ? path.trim() : null,
          icon ? icon.trim() : null,
          color || "blue",
          parent_id ? Number(parent_id) : null,
          Number(order_index) || 0,
          is_section ? 1 : 0,
          is_dropdown ? 1 : 0,
          is_active !== undefined ? (is_active ? 1 : 0) : 1
        ]
      );

      const newMenuId = result.insertId;

      // Automatically grant full permissions to Admin role (role_id 1)
      await db.query(
        `INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_create, can_edit, can_delete)
         VALUES (?, ?, 1, 1, 1, 1)
         ON DUPLICATE KEY UPDATE can_view = 1, can_create = 1, can_edit = 1, can_delete = 1`,
        [ROLES.ADMIN, newMenuId]
      );

      const [newMenu] = await db.query("SELECT * FROM cms_menus WHERE id = ?", [newMenuId]);

      return res.status(201).json({
        success: true,
        message: `Permission module "${title}" created successfully`,
        data: newMenu[0]
      });
    } catch (err) {
      console.error("Error in createMenu:", err);
      return res.status(500).json({ success: false, message: "Failed to create menu", error: err.message });
    }
  },

  // 5. Update existing permission / module
  updateMenu: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        path,
        icon,
        color,
        parent_id,
        order_index,
        is_section,
        is_dropdown,
        is_active
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Module/Permission title is required" });
      }

      const db = con.promise();
      const [existing] = await db.query("SELECT * FROM cms_menus WHERE id = ?", [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Menu not found" });
      }

      await db.query(
        `UPDATE cms_menus SET
          title = ?,
          path = ?,
          icon = ?,
          color = ?,
          parent_id = ?,
          order_index = ?,
          is_section = ?,
          is_dropdown = ?,
          is_active = ?
         WHERE id = ?`,
        [
          title.trim(),
          path !== undefined ? (path ? path.trim() : null) : existing[0].path,
          icon !== undefined ? (icon ? icon.trim() : null) : existing[0].icon,
          color !== undefined ? color : existing[0].color,
          parent_id !== undefined ? (parent_id ? Number(parent_id) : null) : existing[0].parent_id,
          order_index !== undefined ? Number(order_index) : existing[0].order_index,
          is_section !== undefined ? (is_section ? 1 : 0) : existing[0].is_section,
          is_dropdown !== undefined ? (is_dropdown ? 1 : 0) : existing[0].is_dropdown,
          is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active,
          id
        ]
      );

      const [updated] = await db.query("SELECT * FROM cms_menus WHERE id = ?", [id]);

      return res.json({
        success: true,
        message: `Permission module "${title}" updated successfully`,
        data: updated[0]
      });
    } catch (err) {
      console.error("Error in updateMenu:", err);
      return res.status(500).json({ success: false, message: "Failed to update menu", error: err.message });
    }
  },

  // 6. Delete permission / module (clean up relations and reset child parent_id)
  deleteMenu: async (req, res) => {
    try {
      const { id } = req.params;
      const db = con.promise();

      const [existing] = await db.query("SELECT * FROM cms_menus WHERE id = ?", [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Menu module not found" });
      }

      const menuTitle = existing[0].title;

      // 1. Clear parent_id for any children so they don't break
      await db.query("UPDATE cms_menus SET parent_id = NULL WHERE parent_id = ?", [id]);

      // 2. Remove role permissions
      await db.query("DELETE FROM role_menu_permissions WHERE menu_id = ?", [id]);

      // 3. Remove user permissions if table exists
      try {
        await db.query("DELETE FROM user_menu_permissions WHERE menu_id = ?", [id]);
      } catch (ignored) {}

      // 4. Delete the menu itself
      await db.query("DELETE FROM cms_menus WHERE id = ?", [id]);

      return res.json({
        success: true,
        message: `Permission module "${menuTitle}" deleted successfully`
      });
    } catch (err) {
      console.error("Error in deleteMenu:", err);
      return res.status(500).json({ success: false, message: "Failed to delete menu", error: err.message });
    }
  },

  // 7. Get permissions assigned to a role
  getRolePermissions: async (req, res) => {
    try {
      const { roleId } = req.params;
      const db = con.promise();

      // Return full list of menus with permissions for this role (or default 0s if not set)
      const [results] = await db.query(
        `SELECT 
           m.id AS menu_id,
           m.title,
           m.path,
           m.is_section,
           m.is_dropdown,
           m.parent_id,
           COALESCE(rmp.can_view, 0) AS can_view,
           COALESCE(rmp.can_create, 0) AS can_create,
           COALESCE(rmp.can_edit, 0) AS can_edit,
           COALESCE(rmp.can_delete, 0) AS can_delete
         FROM cms_menus m
         LEFT JOIN role_menu_permissions rmp ON m.id = rmp.menu_id AND rmp.role_id = ?
         ORDER BY m.order_index ASC, m.id ASC`,
        [roleId]
      );

      const formatted = results.map(r => ({
        menu_id: r.menu_id,
        title: r.title,
        path: r.path,
        is_section: Boolean(r.is_section),
        is_dropdown: Boolean(r.is_dropdown),
        parent_id: r.parent_id,
        can_view: Boolean(r.can_view),
        can_create: Boolean(r.can_create),
        can_edit: Boolean(r.can_edit),
        can_delete: Boolean(r.can_delete),
      }));

      return res.json({ success: true, data: formatted });
    } catch (err) {
      console.error("Error in getRolePermissions:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch role permissions", error: err.message });
    }
  },

  // 8. Bulk update / assign permissions for a role
  updateRolePermissions: async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: "Permissions array is required" });
      }

      const db = con.promise();

      // Clear existing permissions for this role and re-insert active ones
      await db.query("DELETE FROM role_menu_permissions WHERE role_id = ?", [roleId]);

      const valuesToInsert = permissions
        .filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete)
        .map(p => [
          Number(roleId),
          Number(p.menu_id),
          p.can_view ? 1 : 0,
          p.can_create ? 1 : 0,
          p.can_edit ? 1 : 0,
          p.can_delete ? 1 : 0
        ]);

      if (valuesToInsert.length > 0) {
        await db.query(
          `INSERT INTO role_menu_permissions 
           (role_id, menu_id, can_view, can_create, can_edit, can_delete)
           VALUES ?`,
          [valuesToInsert]
        );
      }

      return res.json({
        success: true,
        message: `Role permissions updated successfully (${valuesToInsert.length} assigned)`
      });
    } catch (err) {
      console.error("Error in updateRolePermissions:", err);
      return res.status(500).json({ success: false, message: "Failed to update role permissions", error: err.message });
    }
  },

  // 9. Side-by-side Role Comparison Matrix
  compareRolePermissions: async (req, res) => {
    try {
      const db = con.promise();
      let roleIds = [];

      if (req.query.roleIds) {
        roleIds = req.query.roleIds.split(",").map(id => Number(id.trim())).filter(id => !isNaN(id));
      }

      // If no specific roleIds provided, get all active roles
      let rolesQuery = "SELECT role_id, role_name FROM roles WHERE status = 1 ORDER BY role_id ASC";
      let [roles] = await db.query(rolesQuery);

      if (roleIds.length > 0) {
        roles = roles.filter(r => roleIds.includes(r.role_id));
      }

      if (roles.length === 0) {
        return res.json({ success: true, roles: [], menus: [], matrix: {}, differences: [] });
      }

      const activeRoleIds = roles.map(r => r.role_id);

      // Get all menus
      const [menus] = await db.query(
        "SELECT id, title, path, is_section, is_dropdown, parent_id, order_index FROM cms_menus ORDER BY order_index ASC, id ASC"
      );

      // Get all permissions for these roles
      const [perms] = await db.query(
        `SELECT role_id, menu_id, can_view, can_create, can_edit, can_delete
         FROM role_menu_permissions
         WHERE role_id IN (${activeRoleIds.map(() => "?").join(",")})`,
        activeRoleIds
      );

      // Construct matrix: matrix[menu_id][role_id] = { can_view, can_create, can_edit, can_delete }
      const matrix = {};
      const differences = [];

      menus.forEach(menu => {
        matrix[menu.id] = {};
        const rolePermValues = [];

        roles.forEach(role => {
          const perm = perms.find(p => p.role_id === role.role_id && p.menu_id === menu.id);
          const val = {
            can_view: perm ? Boolean(perm.can_view) : false,
            can_create: perm ? Boolean(perm.can_create) : false,
            can_edit: perm ? Boolean(perm.can_edit) : false,
            can_delete: perm ? Boolean(perm.can_delete) : false,
          };
          matrix[menu.id][role.role_id] = val;
          rolePermValues.push(`${val.can_view ? 1 : 0}-${val.can_create ? 1 : 0}-${val.can_edit ? 1 : 0}-${val.can_delete ? 1 : 0}`);
        });

        // Determine if there is any difference across compared roles
        const isDifferent = new Set(rolePermValues).size > 1;
        if (isDifferent) {
          differences.push(menu.id);
        }
      });

      return res.json({
        success: true,
        roles,
        menus,
        matrix,
        differenceMenuIds: differences
      });
    } catch (err) {
      console.error("Error in compareRolePermissions:", err);
      return res.status(500).json({ success: false, message: "Failed to compare permissions", error: err.message });
    }
  },

  // 10. Quick single action assignment (assign or toggle specific action for a role & menu)
  assignPermissionAction: async (req, res) => {
    try {
      const { roleId, menuId, action, value } = req.body;

      const validActions = ["can_view", "can_create", "can_edit", "can_delete"];
      if (!validActions.includes(action)) {
        return res.status(400).json({ success: false, message: `Invalid action: ${action}. Must be one of ${validActions.join(", ")}` });
      }

      const db = con.promise();
      const numValue = value ? 1 : 0;

      // Upsert into role_menu_permissions
      await db.query(
        `INSERT INTO role_menu_permissions (role_id, menu_id, ${action})
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE ${action} = ?`,
        [Number(roleId), Number(menuId), numValue, numValue]
      );

      return res.json({
        success: true,
        message: `Action ${action} updated to ${Boolean(value)} for role ${roleId} and menu ${menuId}`
      });
    } catch (err) {
      console.error("Error in assignPermissionAction:", err);
      return res.status(500).json({ success: false, message: "Failed to update permission action", error: err.message });
    }
  },

  // 11. Get user permission overrides
  getUserPermissions: async (req, res) => {
    try {
      const { userId } = req.params;
      const db = con.promise();

      const [rows] = await db.query(
        "SELECT menu_id, permission_type FROM user_menu_permissions WHERE user_id = ?",
        [userId]
      );

      return res.json({ success: true, data: rows || [] });
    } catch (err) {
      console.error("Error in getUserPermissions:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch user permissions", error: err.message });
    }
  },

  // 12. Update user permission overrides
  updateUserPermissions: async (req, res) => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: "Permissions array is required" });
      }

      const db = con.promise();

      // Clear existing overrides for this user
      await db.query("DELETE FROM user_menu_permissions WHERE user_id = ?", [userId]);

      const validOverrides = permissions
        .filter(p => p.menu_id && (p.permission_type === 'allow' || p.permission_type === 'deny'))
        .map(p => [
          Number(userId),
          Number(p.menu_id),
          p.permission_type
        ]);

      if (validOverrides.length > 0) {
        await db.query(
          "INSERT INTO user_menu_permissions (user_id, menu_id, permission_type) VALUES ?",
          [validOverrides]
        );
      }

      return res.json({
        success: true,
        message: `User permissions updated successfully (${validOverrides.length} overrides saved)`
      });
    } catch (err) {
      console.error("Error in updateUserPermissions:", err);
      return res.status(500).json({ success: false, message: "Failed to update user permissions", error: err.message });
    }
  }
};

module.exports = menuController;

const db = require("./db");

const AuditLog = {
    create: (logData, callback) => {
        const query = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const params = [
            logData.user_id,
            logData.action,
            logData.entity,
            logData.entity_id,
            logData.details ? JSON.stringify(logData.details) : null,
            logData.ip_address,
        ];

        db.query(query, params, callback);
    },

    getAll: (filters, callback) => {
        let query = `
      SELECT al.*, u.user_name 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `;
        const params = [];

        if (filters.action) {
            query += " AND al.action = ?";
            params.push(filters.action);
        }
        if (filters.entity) {
            query += " AND al.entity = ?";
            params.push(filters.entity);
        }
        if (filters.user_id) {
            query += " AND al.user_id = ?";
            params.push(filters.user_id);
        }
        if (filters.startDate) {
            query += " AND al.created_at >= ?";
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            query += " AND al.created_at <= ?";
            params.push(filters.endDate);
        }

        query += " ORDER BY al.created_at DESC LIMIT 1000"; // Limit to prevent overload

        db.query(query, params, callback);
    },
};

module.exports = AuditLog;

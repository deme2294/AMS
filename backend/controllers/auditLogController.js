const AuditLog = require("../models/auditLog");

const logActivity = (req, action, entity, entityId, details) => {
    const userId = req?.session?.user?.id || null;
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;

    AuditLog.create(
        {
            user_id: userId,
            action,
            entity,
            entity_id: entityId,
            details: details || null,
            ip_address: ipAddress,
        },
        (err) => {
            if (err) {
                console.error("[AUDIT CONTROLLER] Failed to log activity:", err);
            }
        }
    );
};

module.exports = { logActivity };

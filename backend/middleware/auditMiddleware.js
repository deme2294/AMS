const auditLogController = require("../controllers/auditLogController");

const auditMiddleware = (action, entity) => {
    return (req, res, next) => {
        // We hook into the response finish event to ensure we only log if the request was successful
        res.on("finish", () => {
            try {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    let entityId = null;
                    let details = null;

                    // Try to guess entity ID from params or body
                    if (req.params.id) {
                        entityId = req.params.id;
                    } else if (req.body.id) {
                        entityId = req.body.id;
                    }

                    // Capture simple body details (excluding sensitive info)
                    if (req.method !== "GET") {
                        const safeBody = { ...req.body };
                        delete safeBody.password;
                        delete safeBody.token;
                        delete safeBody.confirmPassword;
                        details = safeBody;
                    }

                    auditLogController.logActivity(req, action, entity, entityId, details);
                }
            } catch (auditErr) {
                console.error("[AUDIT ERROR] Failed in middleware finish listener:", auditErr);
            }
        });
        next();
    };
};

module.exports = auditMiddleware;

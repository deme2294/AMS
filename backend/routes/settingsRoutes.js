const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const { restrictTo } = require("../middleware/roleMiddleware.js");
const settingsController = require("../controllers/settingsController.js");

// Public: used on app load for appearance (theme, logo, density)
router.get("/", settingsController.getSystemSettings);

// Admin-only global appearance updates
router.put("/", verifyToken, restrictTo(1), settingsController.updateSystemSettings);

router.get("/user-theme", verifyToken, settingsController.getUserThemeSettings);
router.post("/user-theme", verifyToken, settingsController.saveUserThemeSettings);

module.exports = router;

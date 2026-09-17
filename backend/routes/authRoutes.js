const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const verifyToken = require('../middleware/verifyToken');
const rateLimit = require('express-rate-limit');

// Stricter limiter for auth routes to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Reduced from 100 to 30 for better security against brute force
    message: {
        success: false,
        message: "Too many attempts. Please wait 15 minutes before trying again."
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS', // CRITICAL: Don't rate limit preflight
});

router.post("/login", authLimiter, authMiddleware.login);
router.get("/check-auth", (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token;
    if (!token) {
        return res.status(200).json({ success: false, message: "No session active" });
    }
    next();
}, verifyToken, authMiddleware.getCurrentUser);
router.get("/me", verifyToken, authMiddleware.getCurrentUser); // New standard user info endpoint
router.put("/logout", verifyToken, authMiddleware.logout); // Simplified: no ID in URL
router.post("/forgot-password", authLimiter, authMiddleware.forgotPassword);
router.post("/reset-password", authLimiter, authMiddleware.resetPassword);
router.post("/redeem-account", authLimiter, authMiddleware.redeemAccount);
router.post("/resend-redemption", authLimiter, authMiddleware.resendRedemptionCode);
router.post("/change-password", authLimiter, verifyToken, authMiddleware.changePassword);
router.post("/register", authLimiter, authMiddleware.register);

module.exports = router;

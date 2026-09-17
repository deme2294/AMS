const jwt = require("jsonwebtoken");
const pool = require("../models/db");
const crypto = require("crypto");

// Constants for session management
// NOTE: SESSION_INACTIVITY_LIMIT currently unused in this middleware.
const SESSION_INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
const MAX_SESSION_LIFETIME = 4 * 60 * 60 * 1000; // 4 hours absolute max

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'None' : 'Lax', // Match production requirements for cross-site cookies
  path: '/'
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token;

  if (!token) {
    console.error("[AUTH FAIL] reason=no_token cookieKeys=", Object.keys(req.cookies || {}), "authHeaderPresent=", !!authHeader);
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  console.log("[AUTH DEBUG] Token found, length:", token.length, "prefix:", token.substring(0, 20));

  // SECURITY: Development/Testing Bypass
  if (process.env.NODE_ENV === 'development' && token === 'ITP_TEST_TOKEN') {
    req.user = { user_id: 83, role_id: 1, initial_login: Date.now() }; // Mock admin user
    req.user_id = 83;
    req.token = token;
    return next();
  }

  try {
    // 0. Check if token is revoked or session is overwritten
    const [revoked] = await pool.promise().query("SELECT id FROM revoked_tokens WHERE token = ?", [token]);
    if (revoked.length > 0) {
      res.clearCookie('token', { ...cookieOptions, path: '/' });
      return res.status(401).json({ success: false, message: "Session invalidated (logout). Please login again." });
    }

    const jwtSecret = process.env.JWT_SECRET || 'cms_default_jwt_secret_change_me';

    jwt.verify(token, jwtSecret, async (err, decoded) => {
      console.log('[AUTH DEBUG] verifyToken cookiePresent:', !!req.cookies?.token, 'authHeaderPresent:', !!req.headers['authorization']);
      if (err) {
        console.log("[AUTH DEBUG] JWT verification failed:", err.name, err.message);
        if (err.name === 'TokenExpiredError') {
          res.clearCookie('token', { ...cookieOptions, path: '/' });
          return res.status(401).json({ success: false, message: "Session expired due to inactivity. Please login again." });
        }
        return res.status(401).json({ success: false, message: "Failed to authenticate token" });
      }

      console.log("[AUTH DEBUG] JWT decoded user_id:", decoded.user_id, "jti:", decoded.jti);

      // 0b. Check if this is the ACTIVE session for this user
      const [activeSession] = await pool.promise().query("SELECT jti FROM active_sessions WHERE user_id = ?", [decoded.user_id]);
      console.log("[AUTH DEBUG] Active sessions found:", activeSession.length, "token jti:", decoded.jti, "db jti:", activeSession[0]?.jti);

      if (activeSession.length === 0 || activeSession[0].jti !== decoded.jti) {
        console.warn(`[SECURITY] Session conflict: User ${decoded.user_id} token jti mismatch. Likely logged in elsewhere.`);
        res.clearCookie('token', { ...cookieOptions, path: '/' });
        return res.status(401).json({ success: false, message: "Another session is active. You have been logged out." });
      }

      // Update last activity periodically
      if (Date.now() - (decoded.iat * 1000) > 60000) {
        pool.query("UPDATE active_sessions SET last_activity = NOW() WHERE user_id = ?", [decoded.user_id]);
      }

      const now = Date.now();
      const initialLogin = (decoded.login_timestamp || decoded.initial_login) ?
        new Date(decoded.login_timestamp || decoded.initial_login).getTime() : now;

      if (now - initialLogin > MAX_SESSION_LIFETIME) {
        res.clearCookie('token', { ...cookieOptions, path: '/' });
        return res.status(401).json({ success: false, message: "Maximum session lifetime exceeded. Please login again." });
      }

      const tokenAge = now - (decoded.iat * 1000);
      if (tokenAge > 5 * 60 * 1000) { // Refresh every 5 minutes if active
        const jti = crypto.randomUUID();
        const payload = {
          user_id: decoded.user_id,
          role_id: decoded.role_id,
          login_timestamp: initialLogin,
          jti: jti,
          entropy: crypto.randomBytes(8).toString('hex')
        };

        const newToken = jwt.sign(payload, jwtSecret, {
          expiresIn: '30m',
          header: { jti: jti }
        });

        // CRITICAL: Update active_sessions with the new JTI so the next request doesn't fail the session check
        await pool.promise().query("UPDATE active_sessions SET jti = ?, last_activity = NOW() WHERE user_id = ?", [jti, decoded.user_id]);

        res.cookie('token', newToken, {
          ...cookieOptions,
          maxAge: 30 * 60 * 1000,
          path: '/'
        });
      }

      req.user = decoded;
      req.user_id = decoded.user_id;
      req.token = token;
      next();
    });
  } catch (dbError) {
    console.error("[SECURITY] DB error in verifyToken:", dbError);
    return res.status(500).json({ success: false, message: "Internal security error" });
  }
};

module.exports = verifyToken;

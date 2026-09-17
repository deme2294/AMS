
const con = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const auditLogController = require('../controllers/auditLogController');
const { sendEmail } = require('../services/emailService');

// Secret key (as specified in your requirements)
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'cms_default_jwt_secret_change_me'; // WARNING: Change in .env
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// Helper to check if IP is blocked
const isIpBlocked = (ip) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT * FROM blocked_ips WHERE ip_address = ?", [ip], (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0 ? results[0] : null);
        });
    });
};

const blockIp = (ip, reason) => {
    con.query("INSERT IGNORE INTO blocked_ips (ip_address, reason, blocked_at) VALUES (?, ?, NOW())", [ip, reason], (err) => {
        if (err) console.error("Error blocking IP:", err);
        else console.log(`[SECURITY] IP Blocked: ${ip}, Reason: ${reason}`);
    });
};

const sendSecurityEmail = (email, username, code, type, options = {}) => {
    const { lockUntil = null, ip = 'Unknown', ua = 'Unknown' } = options;
    const isRedemption = type === 'redemption';
    const isConflict = type === 'session_conflict';

    let subject = 'ITPC-CMS Security Notification';
    if (isRedemption) subject = 'Security Alert: Account Temporarily Suspended';
    else if (isConflict) subject = 'Security Alert: Concurrent Session Attempt';
    else if (type === 'reset') subject = 'ITPC-CMS Password Reset Code';

    const title = isRedemption ? 'Account Suspended' : (isConflict ? 'Active Session Alert' : 'Security Notification');
    const color = (isRedemption || isConflict) ? '#d9534f' : '#1a365d';

    let actionDescription = '';
    if (isConflict) {
        actionDescription = 'We detected a login attempt while another session was active on your account.';
    } else if (isRedemption) {
        actionDescription = `Your account was suspended after ${MAX_ATTEMPTS} failed attempts.`;
    } else {
        actionDescription = 'We received a request for your account.';
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; border-top: 4px solid ${color};">
            <h2 style="color: ${color}; padding-bottom: 10px;">${title}</h2>
            <p>Hello <strong>${username}</strong>,</p>
            
            <p>${actionDescription}</p>
            
            ${isConflict ? `
                <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2;">
                    <h4 style="margin-top: 0; color: #c53030;">Attempt Details:</h4>
                    <p style="margin: 5px 0; font-size: 13px;"><strong>IP Address:</strong> ${ip}</p>
                    <p style="margin: 5px 0; font-size: 13px;"><strong>Device/Browser:</strong> ${ua}</p>
                    <p style="margin: 5px 0; font-size: 13px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
            ` : ''}

            ${code ? `
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0; text-align: center;">
                <h3 style="margin-top: 0; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</h3>
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: ${color}; margin: 15px 0;">${code}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px; text-align: center;">
                <a href="https://admin.ethiopianitpark.et/login" 
                   style="background-color: ${color}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
                   Access Security Dashboard
                </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 11px; color: #9a9a9a; border-top: 1px solid #eee; padding-top: 15px;">
                ${isRedemption && lockUntil ? `Account locked until: <strong>${new Date(lockUntil).toLocaleString()}</strong><br>` : ''}
                If this was not you, we recommend changing your password immediately.
                <br>This is an automated security notification for your ITPC-CMS account.
            </p>
        </div>
    `;

    return sendEmail({
        to: email,
        subject: subject,
        html: htmlContent,
        text: `Security Alert: Concurrent session attempt for ${username}. IP: ${ip}, Device: ${ua}`
    }).catch(err => {
        console.error(`[SECURITY EMAIL ERROR] ${type}:`, err);
        return { success: false, error: err.message };
    });
};

// Function to handle login
const getLogin = async (req, res) => {
    const { user_name, username, userName, pass, password } = req.body;

    // DEBUG (safe): log presence of credentials fields without exposing password contents
    try {
        const bodyKeys = req.body ? Object.keys(req.body) : [];
        const hasPass = typeof pass !== 'undefined' && pass !== null && String(pass).trim() !== '';
        const hasPassword = typeof password !== 'undefined' && password !== null && String(password).trim() !== '';
        const identifier = (user_name || username || userName || '').toString().trim();
        console.log('[LOGIN DEBUG] received keys:', bodyKeys);
        console.log('[LOGIN DEBUG] identifier:', identifier, 'hasPass:', hasPass, 'hasPassword:', hasPassword);
    } catch (e) {
        // ignore debug failures
    }


    console.log("[LOGIN] Raw request body:", JSON.stringify(req.body));
    console.log("[LOGIN] user_name:", user_name, "pass:", pass, "password:", password);

    const loginIdentifier = (user_name || username || userName || '').toString().trim();
    const loginPassword = (pass ?? password ?? '').toString();

    console.log("[LOGIN] Parsed - loginIdentifier:", loginIdentifier, "loginPassword:", loginPassword ? '***' : 'EMPTY');

    const ip = req.ip || req.connection.remoteAddress;



    if (!loginPassword) return res.status(400).json({ success: false, message: 'Password is required' });

    try {
        // 1. Check IP Block
        const blockedParams = await isIpBlocked(ip);
        if (blockedParams) {
            return res.status(403).json({ success: false, message: 'Your IP address is temporarily blocked due to suspicious activity.', locked: true });
        }

        // 2. Fetch User
        // 2. Fetch User (Allow username OR linked employee email)
        const query = `
          SELECT u.user_id, u.employee_id, u.user_name, u.password, u.status, u.role_id, 
                 u.failed_login_attempts, u.account_locked_until,
                 e.fname, e.lname, e.email, e.phone,
                 r.role_name
          FROM users u 
          LEFT JOIN employees e ON u.employee_id = e.employee_id 
          LEFT JOIN roles r ON u.role_id = r.role_id
          WHERE u.user_name = ? OR e.email = ?
        `;

        const results = await new Promise((resolve, reject) => {
            con.query(query, [loginIdentifier, loginIdentifier], (err, queryResults) => {
                if (err) reject(err);
                else resolve(queryResults);
            });
        });

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const user = results[0];

        // 3. Check Account Lock
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            return res.status(403).json({
                success: false,
                message: `Account suspended until ${new Date(user.account_locked_until).toLocaleTimeString()}. Too many failed attempts.`,
                locked: true
            });
        }

        // 4. Verify Password
        let passwordMatch = false;
        if (user.password) {
            console.log(`[LOGIN] Verifying user ${user.user_id} (${user.user_name})`);

            // Debug: Log the hash format (first 5 chars)
            console.log(`[LOGIN] DB Hash prefix: ${user.password.substring(0, 5)}...`);

            try {
                passwordMatch = await bcrypt.compare(loginPassword, user.password);
                if (!passwordMatch) {
                    console.warn(`[LOGIN] Password mismatch for user ${user.user_id}`);
                }
            } catch (bcryptError) {
                console.error(`[LOGIN] Bcrypt error for user ${user.user_id}:`, bcryptError);
                return res.status(500).json({ success: false, message: 'Encryption verification failed' });
            }
        } else {
            console.error(`[LOGIN] No password stored for user ${user.user_id}`);
        }

        if (passwordMatch && String(user.status) === '1') {
            const { forceLogout } = req.body;
            const userAgent = req.get('user-agent');

            // 5. Check for existing active session
            const [activeSessions] = await con.promise().query(
                "SELECT jti, ip_address, user_agent, created_at FROM active_sessions WHERE user_id = ?",
                [user.user_id]
            );

            // If forceLogout is requested, remove existing active session row(s) first.
            // This prevents the login from being blocked by stale active_sessions rows.
            if (activeSessions.length > 0 && forceLogout) {
                try {
                    await con.promise().query("DELETE FROM active_sessions WHERE user_id = ?", [user.user_id]);
                } catch (e) {
                    console.error('[LOGIN SESSION ERROR] forceLogout failed to clear active_sessions:', {
                        user_id: user.user_id,
                        error: e?.message
                    });
                }
            }

            if (activeSessions.length > 0 && !forceLogout) {

                const s = activeSessions[0];

                // AUTOMATIC SECURITY ALERT: Send email to user informing about the conflict
                const targetEmail = user.email || (loginIdentifier.includes('@') ? loginIdentifier : null);
                if (targetEmail) {
                    console.log(`[SECURITY] Triggering conflict alert email for ${user.user_name} to ${targetEmail}`);
                    sendSecurityEmail(targetEmail, user.user_name, null, 'session_conflict', { ip, ua: userAgent });
                } else {
                    console.warn(`[SECURITY] Conflict detected for ${user.user_name} but no email found to send alert.`);
                }

                return res.status(409).json({
                    success: false,
                    conflict: true,
                    message: "You can't login, another session is active.",
                    session: {
                        ip: s.ip_address,
                        ua: s.user_agent,
                        started: s.created_at
                    }
                });
            }

            // Success: Reset attempts and lock
            con.query('UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, online_flag = 1 WHERE user_id = ?', [user.user_id], (err) => {
                if (err) console.error("Error updating online_flag:", err);
            });

            const jti = crypto.randomUUID(); // More robust unique ID

            const token = jwt.sign({
                user_id: user.user_id,
                role_id: user.role_id,
                login_timestamp: Date.now(), // Milliseconds entropy
                jti: jti,
                entropy: crypto.randomBytes(8).toString('hex') // Additional randomness
            }, JWT_SECRET_KEY, {
                expiresIn: '30m',
                header: { jti: jti } // Also add to header for some parsers
            });

            auditLogController.logActivity(
                { ...req, session: { user: { id: user.user_id } }, ip },
                "LOGIN",
                "User",
                user.user_id,
                { username: user.user_name }
            );

            const isProd = process.env.NODE_ENV === 'production';
            const cookieOptions = {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'None' : 'Lax',
                maxAge: 30 * 60 * 1000, // 30 minutes
                path: '/'
            };

            res.cookie('token', token, cookieOptions);

            // 6. Record or Update active session
            // IMPORTANT: verify the session row is persisted with the same jti BEFORE returning success.
            // Also store the last activity/user-agent fields consistently.
            let activeSessionWriteOk = false;
            try {
                // ensure we use exact same cookie/source of truth: decoded.user_id + decoded.jti
                const [writeResult] = await con.promise().query(
                    "REPLACE INTO active_sessions (user_id, jti, ip_address, user_agent, created_at, last_activity) VALUES (?, ?, ?, ?, NOW(), NOW())",
                    [user.user_id, jti, ip, userAgent]
                );

                const [rows] = await con.promise().query(
                    "SELECT jti, ip_address, user_agent FROM active_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
                    [user.user_id]
                );

                activeSessionWriteOk = (rows.length > 0 && rows[0].jti === jti);

                if (!activeSessionWriteOk) {
                    console.error('[LOGIN SESSION ERROR] active_sessions jti mismatch after write:', {
                        user_id: user.user_id,
                        issued_jti: jti,
                        db_jti: rows[0]?.jti,
                        db_ip: rows[0]?.ip_address,
                        db_ua: rows[0]?.user_agent,
                        writeResult: writeResult
                    });
                }
            } catch (e) {
                console.error('[LOGIN SESSION ERROR] Failed to persist active_sessions:', {
                    user_id: user.user_id,
                    issued_jti: jti,
                    error: e?.message
                });
            }

            if (!activeSessionWriteOk) {
                res.clearCookie('token', {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: isProd ? 'None' : 'Lax',
                    path: '/'
                });

                return res.status(500).json({
                    success: false,
                    message: 'Session initialization failed. Please login again.'
                });
            }

            console.log("[LOGIN DEBUG] Cookie+session set with jti:", jti, "user_id:", user.user_id);


            // SECURITY HARDENING: Return NO user data in the login response.
            // This prevents information disclosure in the initial authentication handshake.
            // The frontend must fetch user details from the protected /api/me endpoint.
            return res.status(200).json({ success: true });


        } else {
            // Failure: Increment attempts
            const newAttempts = (user.failed_login_attempts || 0) + 1;
            let updateSql = 'UPDATE users SET failed_login_attempts = ? WHERE user_id = ?';
            let params = [newAttempts, user.user_id];
            let msg = `Invalid username or password. attempt ${newAttempts} of ${MAX_ATTEMPTS}.`;

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                const redemptionToken = Math.floor(100000 + Math.random() * 900000).toString();
                const expires = new Date(Date.now() + 3600000); // 1 hour

                updateSql = 'UPDATE users SET failed_login_attempts = ?, account_locked_until = ?, redemption_token = ?, redemption_token_expires = ? WHERE user_id = ?';
                params = [newAttempts, lockUntil, redemptionToken, expires, user.user_id];

                // Block IP as well
                blockIp(ip, `Too many failed login attempts for user ${loginIdentifier}`);

                // Send security email
                const userEmail = results[0].email || (loginIdentifier.includes('@') ? loginIdentifier : null);
                if (userEmail) {
                    sendSecurityEmail(userEmail, user.user_name, redemptionToken, 'redemption', { lockUntil, ip });
                }

                con.query(updateSql, params, (err) => {
                    if (err) console.error("Error updating lock status:", err);
                });
                msg = "Account suspended due to multiple failed login attempts. A redemption code has been sent to your email.";
                return res.status(401).json({ success: false, message: msg, locked: true });
            }

            con.query(updateSql, params, (err) => {
                if (err) console.error("Error updating attempts:", err);
            });


            auditLogController.logActivity(
                { ...req, session: { user: { id: null } }, ip },
                "LOGIN_FAILED",
                "User",
                null,
                { username: user_name, attempts: newAttempts }
            );

            return res.status(401).json({ success: false, message: msg });
        }

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email or username is required" });
    email = email.trim().toLowerCase();

    console.log(`[FORGOT] Requested for: ${email}`);

    try {
        const sql = `
            SELECT u.user_id, u.user_name, e.email 
            FROM users u 
            LEFT JOIN employees e ON u.employee_id = e.employee_id 
            WHERE e.email = ? OR u.user_name = ?
        `;

        const results = await new Promise((resolve, reject) => {
            con.query(sql, [email, email], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (results.length === 0) {
            console.log(`[FORGOT] No user found for: ${email}`);
            return res.status(200).json({ message: "If that account exists, a reset code has been sent." });
        }

        const user = results[0];
        const targetEmail = user.email || (email.includes('@') ? email : null);

        if (!targetEmail) {
            console.log(`[FORGOT] User ${user.user_name} found but no valid email linked.`);
            return res.status(400).json({ message: "No email address linked to this account. Please contact administrator." });
        }

        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await new Promise((resolve, reject) => {
            con.query("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?",
                [resetToken, expires, user.user_id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        if (targetEmail) {
            const emailResult = await sendSecurityEmail(targetEmail, user.user_name, resetToken, 'reset');
            if (emailResult && !emailResult.success) {
                console.error(`[FORGOT] Email failed for ${user.user_name}:`, emailResult.error);
                return res.status(500).json({ message: `Code generated, but email failed: ${emailResult.error}` });
            }
        }

        // Diagnostic: Show partial email to help user verify target
        const maskedEmail = targetEmail.includes('@')
            ? `***${targetEmail.split('@')[0].slice(-3)}@${targetEmail.split('@')[1]}`
            : 'linked email';

        console.log(`[FORGOT] SUCCESS for ${user.user_name}. To: ${targetEmail}, Code: ${resetToken}`);
        return res.status(200).json({
            message: `Reset code sent to ${maskedEmail}. Please check your inbox and SPAM folder.`
        });

    } catch (error) {
        console.error('[FORGOT] Fatal Error:', error);
        return res.status(500).json({
            message: "Internal server error during forgot password"
        });
    }
};

const redeemAccount = async (req, res) => {
    let { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Missing identifier or code" });

    email = email.trim().toLowerCase();
    code = code.trim();

    console.log(`[REDEEM] Attempting account unlock for: ${email}`);

    try {
        const sql = `
            SELECT u.user_id, u.redemption_token_expires, u.redemption_token, u.user_name, u.account_locked_until
            FROM users u 
            LEFT JOIN employees e ON u.employee_id = e.employee_id 
            WHERE e.email = ? OR u.user_name = ?
        `;

        const [results] = await con.promise().query(sql, [email, email]);

        if (results.length === 0) {
            return res.status(400).json({ message: "Account not found." });
        }

        const user = results[0];
        console.log(`[REDEEM] Verifying user ${user.user_id}. RedemptionToken: ${user.redemption_token}`);

        if (!user.redemption_token || user.redemption_token !== code) {
            console.warn(`[REDEEM] Invalid code provided for user ${user.user_id}`);
            return res.status(400).json({ message: "Invalid verification code for account unlocking." });
        }

        if (new Date(user.redemption_token_expires) < new Date()) {
            console.warn(`[REDEEM] Code ${code} expired for user ${user.user_id}`);
            return res.status(400).json({ message: "Redemption code has expired." });
        }

        const ip = req.ip || req.connection.remoteAddress;

        // Unlock strictly restores account, deletes block, but DOES NOT change password
        const updateSql = "UPDATE users SET redemption_token = NULL, redemption_token_expires = NULL, reset_token = NULL, reset_token_expires = NULL, failed_login_attempts = 0, account_locked_until = NULL WHERE user_id = ?";
        const [updateResult] = await con.promise().query(updateSql, [user.user_id]);

        console.log(`[REDEEM] Unlock DB result: AffectedRows=${updateResult.affectedRows}`);

        // Also unblock IP
        con.query("DELETE FROM blocked_ips WHERE ip_address = ?", [ip], (delErr) => {
            if (delErr) console.error("[REDEEM] IP unblock error:", delErr);
            else console.log(`[REDEEM] IP ${ip} unblocked.`);
        });

        res.status(200).json({ message: "Security unlock successful. Your account is now active. You can log in with your existing password." });

    } catch (e) {
        console.error("[REDEEM] Fatal error:", e);
        res.status(500).json({ message: "Internal server error during account redemption." });
    }
};

const resetPassword = async (req, res) => {
    let { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Missing required fields: email/username, code, and new password." });
    }

    // Strong password policy check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: "New password does not meet security requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters (@$!%*?&)."
        });
    }

    email = email.trim().toLowerCase();
    code = code.trim();

    console.log(`[RESET] Attempting password change for: ${email} with code: ${code}`);

    try {
        const sql = `
            SELECT u.user_id, u.reset_token_expires, u.reset_token, u.user_name
            FROM users u 
            LEFT JOIN employees e ON u.employee_id = e.employee_id 
            WHERE e.email = ? OR u.user_name = ?
        `;

        const [results] = await con.promise().query(sql, [email, email]);

        if (results.length === 0) {
            console.error(`[RESET] No user profile found for identifier: ${email}`);
            return res.status(400).json({ message: "Invalid email or username. Account not found." });
        }

        const user = results[0];
        console.log(`[RESET] Target user identified: ID=${user.user_id}, Name=${user.user_name}`);
        console.log(`[RESET] Token Check: DB='${user.reset_token}', UserProvided='${code}'`);

        if (!user.reset_token || user.reset_token !== code) {
            console.warn(`[RESET] Token Mismatch for user ${user.user_id}`);
            return res.status(400).json({ message: "Invalid verification code. Please request a new one." });
        }

        const now = new Date();
        const expiry = new Date(user.reset_token_expires);
        if (expiry < now) {
            console.warn(`[RESET] Token Expired for user ${user.user_id}. Expired at: ${user.reset_token_expires}`);
            return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
        }

        // Hash new password
        console.log(`[RESET] Hashing new password for user ${user.user_id}...`);
        const saltRounds = 10;
        const hashed = await bcrypt.hash(newPassword, saltRounds);
        const ip = req.ip || req.connection.remoteAddress;

        console.log(`[RESET] Executing database update for user ${user.user_id}...`);

        const updateSql = `
            UPDATE users 
            SET password = ?, 
                reset_token = NULL, 
                reset_token_expires = NULL,
                redemption_token = NULL,
                redemption_token_expires = NULL,
                failed_login_attempts = 0, 
                account_locked_until = NULL 
            WHERE user_id = ?
        `;

        const [updateResult] = await con.promise().query(updateSql, [hashed, user.user_id]);

        console.log(`[RESET] DB Result: AffectedRows=${updateResult.affectedRows}, ChangedRows=${updateResult.changedRows}`);

        if (updateResult.affectedRows === 0) {
            console.error(`[RESET] Update failed: user_id ${user.user_id} not found during update!`);
            return res.status(500).json({ message: "Failed to update database record. Please try again." });
        }

        // Also unblock IP on success
        await con.promise().query("DELETE FROM blocked_ips WHERE ip_address = ?", [ip]).catch(e => {
            console.error("[RESET] Optional IP unblock failed:", e.message);
        });

        console.log(`[RESET] SUCCESS: Password persisted for ${user.user_name}`);
        return res.status(200).json({ message: "Password successfully changed. You can now log in with your new password." });

    } catch (error) {
        console.error('[RESET] Fatal operational error:', error);
        return res.status(500).json({
            message: "System encountered an error while updating your password."
        });
    }
};

// Function to handle logout
const logout = async (req, res) => {
    // Get ID from authenticated session (req.user) securely
    const id = req.user?.user_id || req.user_id;
    const token = req.token || req.cookies?.token;
    const ip = req.ip || req.connection?.remoteAddress;

    console.log(`[SECURITY] Logout initiated for user ${id || 'unknown'}`);

    try {
        // 1. Update user's online_flag to 0
        if (id) {
            await con.promise().query('UPDATE users SET online_flag=0 WHERE user_id=?', [id]);

            // 2. Remove from active sessions (kills this session for all subsequent requests)
            await con.promise().query('DELETE FROM active_sessions WHERE user_id=?', [id]);
            console.log(`[SECURITY] Active sessions cleared for user ${id}`);
        }

        // 3. Revoke the specific token (adds it to blacklist)
        if (token) {
            // Set expiration to 4 hours from now (matching absolute session limit)
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
            await con.promise().query('INSERT IGNORE INTO revoked_tokens (token, expires_at) VALUES (?, ?)', [token, expiresAt]);
            console.log(`[SECURITY] Token revoked for user ${id || 'unknown'}`);
        }

        // 4. Audit logout activity
        if (id) {
            auditLogController.logActivity(
                { ...req, session: { user: { id: id } }, ip },
                "LOGOUT",
                "User",
                id
            );
        }

        // 5. Clear cookies with explicit parameters to ensure removal
        const isProdLogout = process.env.NODE_ENV === 'production';
        const clearOptions = {
            httpOnly: true,
            secure: isProdLogout,
            sameSite: isProdLogout ? 'None' : 'Lax',
            path: '/'
        };

        res.clearCookie('token', clearOptions);
        res.clearCookie('connect.sid', clearOptions);

        // 6. Destroy express-session if it exists
        if (req.session) {
            req.session.destroy((err) => {
                if (err) console.error('[SECURITY] Session destruction error:', err);
            });
        }

        return res.status(200).json({ success: true, message: 'Logout successful' });

    } catch (error) {
        console.error('[SECURITY] Logout error:', error);
        return res.status(500).json({ success: false, message: 'Error during logout process' });
    }
};

// Resend Redemption Code (for locked accounts)
const resendRedemptionCode = async (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email or username is required" });
    email = email.trim().toLowerCase();

    console.log(`[REDEEM] Resend requested for: ${email}`);

    try {
        const sql = `
            SELECT u.user_id, u.user_name, e.email, u.account_locked_until 
            FROM users u 
            LEFT JOIN employees e ON u.employee_id = e.employee_id 
            WHERE e.email = ? OR u.user_name = ?
        `;

        const results = await new Promise((resolve, reject) => {
            con.query(sql, [email, email], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (results.length === 0) {
            console.warn(`[REDEEM] No user found for: ${email}`);
            return res.status(200).json({ message: "If that account is locked, a new code has been sent." });
        }

        const user = results[0];
        const isLocked = user.account_locked_until && new Date(user.account_locked_until) > new Date();

        if (!isLocked) {
            console.warn(`[REDEEM] Account ${user.user_name} is NOT locked (Locked until: ${user.account_locked_until})`);
            return res.status(400).json({ message: "This account is not currently locked. Please use the Forgot Password option if you need to reset your password." });
        }

        const redemptionToken = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        console.log(`[REDEEM] Generating new token for ${user.user_name}: ${redemptionToken}`);

        await new Promise((resolve, reject) => {
            con.query("UPDATE users SET redemption_token = ?, redemption_token_expires = ? WHERE user_id = ?",
                [redemptionToken, expires, user.user_id],
                (err) => {
                    if (err) {
                        console.error(`[REDEEM] DB Update Error for ${user.user_name}:`, err);
                        reject(err);
                    }
                    else resolve();
                }
            );
        });

        const targetEmail = user.email || (email.includes('@') ? email : null);
        if (targetEmail) {
            console.log(`[REDEEM] Dispatching security email to: ${targetEmail}`);
            // Non-awaited to avoid blocking response
            sendSecurityEmail(targetEmail, user.user_name, redemptionToken, 'redemption', user.account_locked_until, req.ip);
        } else {
            console.warn(`[REDEEM] No target email found for ${user.user_name}`);
        }

        console.log(`[REDEEM] SUCCESS resend process triggered for ${user.user_name}`);
        return res.status(200).json({ message: "A new redemption code has been sent to your email." });

    } catch (error) {
        console.error('[REDEEM] Resend Error:', error);
        return res.status(500).json({ message: "Error resending redemption code" });
    }
};

const changePassword = async (req, res) => {
    // Priority: use the ID from the verified token for maximum security
    const userId = req.user_id || req.body.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "Complete all fields to proceed." });
    }

    // Strong password policy check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: "New password does not meet security requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters (@$!%*?&)."
        });
    }

    try {
        // 1. Fetch detailed user profile
        const [results] = await con.promise().query("SELECT * FROM users WHERE user_id = ?", [userId]);

        if (results.length === 0) {
            console.warn(`[PASSWORD_CHANGE] Failed: User ID ${userId} not found.`);
            return res.status(404).json({ message: "User account not identified." });
        }

        const user = results[0];

        // 2. Verify the sanctity of the current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            console.warn(`[PASSWORD_CHANGE] Unauthorized attempt for ${user.user_name}: Incorrect current password.`);
            return res.status(401).json({ message: "The current password provided is incorrect." });
        }

        // 3. Encrypt the fresh credentials
        const saltRounds = 10;
        const hashed = await bcrypt.hash(newPassword, saltRounds);

        // 4. Persist the change and reset security state
        const updateSql = `
            UPDATE users 
            SET password = ?, 
                reset_token = NULL, 
                reset_token_expires = NULL,
                redemption_token = NULL, 
                redemption_token_expires = NULL,
                failed_login_attempts = 0,
                account_locked_until = NULL
            WHERE user_id = ?
        `;

        const [updateResult] = await con.promise().query(updateSql, [hashed, userId]);

        if (updateResult.affectedRows === 0) {
            throw new Error("Target user record vanished during update cycle.");
        }

        // 5. Audit the event
        auditLogController.logActivity(
            { ...req, session: { user: { id: userId } }, ip: req.ip || req.connection.remoteAddress },
            "CHANGE_PASSWORD",
            "User",
            userId,
            { username: user.user_name, status: "SUCCESS" }
        );

        console.log(`[PASSWORD_CHANGE] SUCCESS for user ${user.user_name} (ID: ${userId})`);
        return res.status(200).json({ success: true, message: "Your password has been securely updated." });

    } catch (error) {
        console.error('[PASSWORD_CHANGE] Fatal dynamic error:', error);
        return res.status(500).json({
            message: "A system error occurred while updating your password. Please contact support."
        });
    }
};

const getCurrentUser = async (req, res) => {
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const query = `
          SELECT u.user_id, u.user_name,
                 e.fname, e.email,
                 r.role_name, u.role_id
          FROM users u 
          LEFT JOIN employees e ON u.employee_id = e.employee_id 
          LEFT JOIN roles r ON u.role_id = r.role_id
          WHERE u.user_id = ?
        `;

        const [results] = await con.promise().query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = results[0];

        // SECURITY FIX: Return only the minimum data required by the frontend.
        // Internal identifiers (employee_id, phone, status) are NOT exposed.
        const responseUser = {
            user_id: user.user_id,
            name: user.fname,
            role_name: user.role_name,
            role_id: user.role_id,
            email: user.email,
            user_name: user.user_name
        };

        return res.status(200).json({ success: true, user: responseUser });
    } catch (error) {
        console.error('[AUTH ERROR] getCurrentUser failure:', {
            error: error.message,
            userId: userId,
            stack: error.stack
        });
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication check"
        });
    }
};

// Register new customer
const registerCustomer = async (req, res) => {
    const { full_name, email, phone, password, username, user_name } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Resolve requested username
    const requestedUsername = (username || user_name || '').trim();

    // Validation
    if (!full_name || !email || !phone || !password || !requestedUsername) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required: full_name, email, phone, password, username'
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    // Username validation: alphanumeric and underscores, length 3-30
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(requestedUsername)) {
        return res.status(400).json({
            success: false,
            message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.'
        });
    }

    // Password strength validation: at least 8 chars, one upper, one lower, one digit, one special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).'
        });
    }

    try {
        // Check if email already exists in employees table
        const [existingEmail] = await con.promise().query(
            "SELECT employee_id FROM employees WHERE email = ?",
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Check if phone already exists
        const [existingPhone] = await con.promise().query(
            "SELECT employee_id FROM employees WHERE phone = ?",
            [phone]
        );

        if (existingPhone.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account with this phone number already exists'
            });
        }

        // Check if username already exists in users table
        const [existingUser] = await con.promise().query(
            "SELECT user_id FROM users WHERE user_name = ?",
            [requestedUsername]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account with this username already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create employee record first (required for users table)
        // Live environment is throwing: Duplicate entry '0' for key 'PRIMARY'
        // on INSERT INTO employees.
        // To make registration deterministic, allocate employee_id via MAX+1 and insert with that id.
        const [maxRows] = await con.promise().query(
            'SELECT COALESCE(MAX(employee_id), 0) + 1 AS nextEmployeeId FROM employees'
        );
        const rawEmployeeId = maxRows?.[0]?.nextEmployeeId;
        const employeeIdBase = Math.max(1, Number(rawEmployeeId) || 1);

        // Retry insert in case the chosen employee_id is still occupied (or DB is inconsistent).
        let employeeId = employeeIdBase;
        let inserted = false;
        let lastErr;

        for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
            try {
                await con.promise().query(
                    `INSERT INTO employees (employee_id, fname, email, phone) VALUES (?, ?, ?, ?)`,
                    [employeeId, full_name, email, phone]
                );
                inserted = true;
                break;
            } catch (err) {
                lastErr = err;
                employeeId += 1;
            }
        }

        if (!inserted) {
            throw lastErr || new Error('Failed to insert employee record');
        }



        // Get customer role_id (role_id = 3 for customer)
        const [roleResult] = await con.promise().query(
            "SELECT role_id FROM roles WHERE role_name = 'customer' OR role_id = 3 LIMIT 1"
        );

        const customerRoleId = roleResult.length > 0 ? roleResult[0].role_id : 3;

        // Create user record with customer role and selected custom username
        // IMPORTANT: Your DB currently errors with Duplicate entry '0' for PRIMARY on users.user_id.
        // To make this deterministic, explicitly allocate users.user_id using MAX+1 and retry on collision.
        const [maxUserRows] = await con.promise().query(
            'SELECT COALESCE(MAX(user_id), 0) + 1 AS nextUserId FROM users'
        );
        const userIdBase = Number(maxUserRows?.[0]?.nextUserId) || 1;

        let userId = userIdBase;
        let insertedUser = false;
        let userResult;
        let lastUserErr;

        for (let attempt = 0; attempt < 5 && !insertedUser; attempt++) {
            try {
                [userResult] = await con.promise().query(
                    `INSERT INTO users (user_id, user_name, password, employee_id, role_id, status, online_flag, created_at)
                     VALUES (?, ?, ?, ?, ?, 1, 0, NOW())`,
                    [userId, requestedUsername, hashedPassword, employeeId, customerRoleId]
                );
                insertedUser = true;
                break;
            } catch (err) {
                lastUserErr = err;
                userId += 1;
            }
        }

        if (!insertedUser) {
            throw lastUserErr || new Error('Failed to insert user record');
        }


        // Log the registration
        auditLogController.logActivity(
            { ...req, session: { user: { id: userId } }, ip },
            "CUSTOMER_REGISTER",
            "User",
            userId,
            { email, full_name, role: 'customer' }
        );

        console.log(`[CUSTOMER_REGISTER] SUCCESS: ${email} (ID: ${userId})`);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! Please login to continue.',
            user_id: userId
        });

    } catch (error) {
        console.error('[CUSTOMER_REGISTER] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during registration. Please try again.',
            error: error.message
        });
    }
};

module.exports = { getLogin, logout, forgotPassword, resetPassword, redeemAccount, resendRedemptionCode, changePassword, getCurrentUser, registerCustomer };

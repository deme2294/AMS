const axios = require('axios');

// Minimum score threshold for reCAPTCHA v3 (0.0 = bot, 1.0 = human)
// 0.5 is Google's recommended default
const RECAPTCHA_SCORE_THRESHOLD = 0.5;

const verifyCaptcha = async (req, res, next) => {
    // Skip captcha in development if RECAPTCHA_SECRET_KEY is missing
    if (process.env.NODE_ENV === 'development' && !process.env.RECAPTCHA_SECRET_KEY) {
        console.warn('[SECURITY] reCAPTCHA validation skipped in development (RECAPTCHA_SECRET_KEY missing)');
        return next();
    }

    const { captchaToken } = req.body;

    // Allow a specific test token for automated hardening tests (dev only)
    if (process.env.NODE_ENV === 'development' && captchaToken === 'ITP_TEST_TOKEN') {
        console.warn('[SECURITY] reCAPTCHA bypassed via test token');
        return next();
    }

    if (!captchaToken) {
        return res.status(400).json({
            success: false,
            message: 'Security verification token is required.'
        });
    }

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
        );

        const { success, score, action, 'error-codes': errorCodes } = response.data;

        if (!success) {
            console.error('[SECURITY] reCAPTCHA v3 validation failed:', errorCodes);
            return res.status(400).json({
                success: false,
                message: 'Security check failed. Please try again.'
            });
        }

        // v3 score check — reject if score is too low (likely a bot)
        if (typeof score === 'number' && score < RECAPTCHA_SCORE_THRESHOLD) {
            console.warn(`[SECURITY] reCAPTCHA v3 low score: ${score} (action: ${action}). Request blocked.`);
            return res.status(403).json({
                success: false,
                message: 'Suspicious activity detected. Please try again later.'
            });
        }

        // Attach score to request for optional logging downstream
        req.recaptchaScore = score;
        req.recaptchaAction = action;
        next();

    } catch (error) {
        console.error('[SECURITY] reCAPTCHA server error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error verifying security check. Please try again.'
        });
    }
};

module.exports = verifyCaptcha;

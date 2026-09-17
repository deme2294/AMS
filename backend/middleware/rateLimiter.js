const rateLimit = require('express-rate-limit');

// Strict limiter for submissions (Comments, Contact Form)
const submissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many submissions, please try again after 15 minutes.'
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Moderate limiter for public API reads
const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

module.exports = {
    submissionLimiter,
    publicApiLimiter
};

const nodemailer = require('nodemailer');
const path = require('path');

// Ensure env is loaded based on NODE_ENV if not already
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });

const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log(`📧 Creating Transporter for ${user} via Gmail Service`);

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        },
        tls: {
            rejectUnauthorized: false
        },
        // Standard timeouts
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
};

const transporter = createTransporter();

const sendEmail = async (options) => {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';

    // Gmail requires the 'from' address to be the authenticated user
    let fromAddress = options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (host.includes('gmail.com')) {
        fromAddress = process.env.EMAIL_USER;
    }
    const fromName = options.fromName || 'Ethiopian IT Park';

    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
    };

    console.log(`📤 [EMAIL] Attempting to send to: ${options.to} (Subject: ${options.subject})`);
    console.log(`🌐 [EMAIL] Using Host: ${host}, User: ${process.env.EMAIL_USER}`);

    try {
        // Add a safety timeout
        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Email sending timed out after 20 seconds. Check production mail settings.')), 20000)
        );

        const info = await Promise.race([sendPromise, timeoutPromise]);

        console.log(`✅ [EMAIL] Sent successfully: ${info.messageId}`);
        return { success: true, info };
    } catch (error) {
        console.error('❌ [EMAIL] Sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };

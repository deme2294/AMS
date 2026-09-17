const path = require('path');
const fs = require('fs');

console.log('--- STARTING SERVER DIAGNOSTIC ---');

// 1. Check Dependencies
const deps = ['express-rate-limit', 'axios', 'dotenv', 'mysql2', 'express', 'cors'];
deps.forEach(dep => {
    try {
        require(dep);
        console.log(`✅ [DEP] ${dep}: OK`);
    } catch (e) {
        console.error(`❌ [DEP] ${dep}: MISSING`);
    }
});

// 2. Check Environment Variables
const isProd = process.env.NODE_ENV === 'production';
const envFile = isProd ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, envFile);

console.log(`\nEnvironment Detection: ${process.env.NODE_ENV || 'development'}`);
console.log(`Checking environment file: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log(`✅ [ENV] ${envFile} file found.`);
    require('dotenv').config({ path: envPath });

    const requiredVars = ['SESSION_SECRET', 'RECAPTCHA_SECRET_KEY', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    requiredVars.forEach(v => {
        if (process.env[v]) {
            console.log(`✅ [VAR] ${v}: Present`);
        } else {
            console.error(`❌ [VAR] ${v}: MISSING!`);
        }
    });
} else {
    console.error(`❌ [ENV] ${envFile} NOT FOUND! Ensure this file exists in the same directory as server.js`);
    // List files in directory for debugging
    console.log('\nFiles in directory:', fs.readdirSync(__dirname));
}

// 3. Test Module Loading of server.js without starting
console.log('\n--- MODULE LOAD TEST ---');
try {
    // We can't easily require server.js if it starts listening, 
    // but we can check if it has syntax errors
    console.log('Checking for syntax errors in server.js...');
    const serverCode = fs.readFileSync(path.resolve(__dirname, 'server.js'), 'utf8');
    new Function(serverCode);
    console.log('✅ server.js syntax check: OK');
} catch (e) {
    if (e instanceof SyntaxError) {
        console.error('❌ server.js has Syntax Errors:', e.message);
    } else {
        console.log('ℹ️ server.js check skipped (likely tries to execute code)');
    }
}

console.log('\n--- DIAGNOSTIC COMPLETE ---');

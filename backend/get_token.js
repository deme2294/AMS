const mysql = require('mysql2/promise');
require('dotenv').config();

async function getResetToken() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'starteut_itp_cmsup',
        port: 3306
    });

    const username = process.argv[2] || 'hayalt';

    const [users] = await connection.query(`
        SELECT u.user_id, u.user_name, u.reset_token, u.reset_token_expires, e.email
        FROM users u 
        LEFT JOIN employees e ON u.employee_id = e.employee_id 
        WHERE u.user_name = ? OR e.email = ?
    `, [username, username]);

    if (users.length > 0) {
        const user = users[0];
        console.log(`User: ${user.user_name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Reset Token: ${user.reset_token || 'NONE'}`);
        console.log(`Expires: ${user.reset_token_expires || 'N/A'}`);
    } else {
        console.log('User not found');
    }

    await connection.end();
}

getResetToken();

const pool = require('./models/db');

const createRevokedTokensTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS revoked_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(500) NOT NULL,
            expires_at DATETIME NOT NULL,
            revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (token),
            INDEX (expires_at)
        )
    `;

    try {
        const [result] = await pool.promise().query(sql);
        console.log("✅ Table 'revoked_tokens' created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating table:", err.message);
        process.exit(1);
    }
};

createRevokedTokensTable();

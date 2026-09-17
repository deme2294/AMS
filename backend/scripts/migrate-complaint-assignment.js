const { query } = require('../models/complaintDb');

async function migrate() {
    console.log('[MIGRATION] Starting complaint assignment system migration...');
    
    try {
        // Check if the complaints table exists
        console.log('[MIGRATION] Checking complaints table structure...');
        
        const tableCheck = await query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'complaints' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        const columns = tableCheck.map(row => row.COLUMN_NAME);
        console.log('[MIGRATION] Existing columns:', columns);
        
        // Add missing columns if they don't exist
        const columnsToAdd = [
            { name: 'assignment_comment', sql: 'ALTER TABLE complaints ADD COLUMN assignment_comment TEXT AFTER assigned_to' },
            { name: 'assigned_response', sql: 'ALTER TABLE complaints ADD COLUMN assigned_response TEXT AFTER assignment_comment' },
            { name: 'response_submitted_at', sql: 'ALTER TABLE complaints ADD COLUMN response_submitted_at DATETIME AFTER assigned_response' },
            { name: 'response_token', sql: 'ALTER TABLE complaints ADD COLUMN response_token VARCHAR(255) AFTER response_submitted_at' },
            { name: 'admin_response', sql: 'ALTER TABLE complaints ADD COLUMN admin_response TEXT AFTER admin_response_at' },
            { name: 'admin_response_at', sql: 'ALTER TABLE complaints ADD COLUMN admin_response_at DATETIME AFTER admin_response' }
        ];
        
        for (const col of columnsToAdd) {
            if (!columns.includes(col.name)) {
                console.log(`[MIGRATION] Adding column: ${col.name}`);
                try {
                    await query(col.sql);
                    console.log(`[MIGRATION] Successfully added column: ${col.name}`);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log(`[MIGRATION] Column ${col.name} already exists, skipping...`);
                    } else {
                        throw err;
                    }
                }
            } else {
                console.log(`[MIGRATION] Column ${col.name} already exists, skipping...`);
            }
        }
        
        // Create indexes for better performance
        console.log('[MIGRATION] Creating indexes...');
        
        try {
            await query('CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to)');
            console.log('[MIGRATION] Created index: idx_complaints_assigned_to');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('[MIGRATION] Index idx_complaints_assigned_to already exists');
            } else {
                throw err;
            }
        }
        
        try {
            await query('CREATE INDEX idx_complaints_response_token ON complaints(response_token)');
            console.log('[MIGRATION] Created index: idx_complaints_response_token');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('[MIGRATION] Index idx_complaints_response_token already exists');
            } else {
                throw err;
            }
        }
        
        // Create complaint_responses table if it doesn't exist
        console.log('[MIGRATION] Creating complaint_responses table if not exists...');
        
        const createResponsesTable = `
            CREATE TABLE IF NOT EXISTS complaint_responses (
                response_id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                reference_number VARCHAR(50) NOT NULL,
                responder_name VARCHAR(100) NOT NULL,
                responder_email VARCHAR(100) NOT NULL,
                response_content TEXT NOT NULL,
                responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Pending',
                admin_reply TEXT NULL,
                replied_by INT NULL,
                replied_at TIMESTAMP NULL,
                response_token VARCHAR(100) NOT NULL,
                INDEX idx_cr_complaint_id (complaint_id),
                INDEX idx_cr_reference (reference_number),
                INDEX idx_cr_token (response_token),
                INDEX idx_cr_status (status)
            )
        `;
        
        try {
            await query(createResponsesTable);
            console.log('[MIGRATION] Created/verified complaint_responses table');
        } catch (err) {
            console.error('[MIGRATION] Error creating complaint_responses table:', err.message);
        }
        
        console.log('[MIGRATION] Migration completed successfully!');
        
    } catch (error) {
        console.error('[MIGRATION] Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('[MIGRATION] Done!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('[MIGRATION] Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { migrate };

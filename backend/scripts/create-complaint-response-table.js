const db = require('../models/db');

async function createComplaintResponseTable() {
    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Create complaint_responses table for storing user responses
        await connection.query(`
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
                
                response_token VARCHAR(100) NOT NULL
            ) ENGINE=InnoDB
        `);
        console.log('✅ Created complaint_responses table');
        
        // Create indexes
        await connection.query('CREATE INDEX idx_cr_complaint_id ON complaint_responses(complaint_id)');
        await connection.query('CREATE INDEX idx_cr_reference ON complaint_responses(reference_number)');
        await connection.query('CREATE INDEX idx_cr_token ON complaint_responses(response_token)');
        await connection.query('CREATE INDEX idx_cr_status ON complaint_responses(status)');
        console.log('✅ Created indexes');
        
        await connection.commit();
        console.log('\n✅ Complaint response table setup complete!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

createComplaintResponseTable();
const db = require('../models/db');

async function createResponseTable() {
    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Create response_complaints table without foreign keys first
        await connection.query(`
            CREATE TABLE IF NOT EXISTS response_complaints (
                response_id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                responder_name VARCHAR(100) NOT NULL,
                responder_email VARCHAR(100) NOT NULL,
                response_content TEXT NOT NULL,
                responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                admin_approval_status VARCHAR(50) DEFAULT 'Pending',
                approved_by INT,
                approved_at TIMESTAMP NULL,
                admin_notes TEXT,
                reference_number VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB
        `);
        console.log('✅ Created response_complaints table');
        
        // Create indexes
        await connection.query('CREATE INDEX idx_response_complaint_id ON response_complaints(complaint_id)');
        await connection.query('CREATE INDEX idx_response_reference ON response_complaints(reference_number)');
        await connection.query('CREATE INDEX idx_response_approval_status ON response_complaints(admin_approval_status)');
        console.log('✅ Created indexes');
        
        await connection.commit();
        console.log('\n✅ Response table setup complete!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

createResponseTable();

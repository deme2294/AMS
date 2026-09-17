// Script to create the complaints table in the database
const db = require('../models/db');

async function createComplaintsTable() {
    try {
        console.log('Creating complaints table...\n');

        // Check if table already exists
        const [tables] = await db.promise().query("SHOW TABLES LIKE 'complaints'");
        
        if (tables.length > 0) {
            console.log('✅ Complaints table already exists');
            return;
        }

        // Create complaints table
        await db.promise().query(`
            CREATE TABLE complaints (
                complaint_id INT AUTO_INCREMENT PRIMARY KEY,
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                
                -- User Info
                user_id INT,
                name VARCHAR(100),
                email VARCHAR(100),
                phone_number VARCHAR(20),
                
                -- Complaint Details
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category_id BIGINT,
                subcategory VARCHAR(100),
                
                -- Status & Workflow
                status VARCHAR(50) DEFAULT 'Pending',
                priority VARCHAR(20) DEFAULT 'Medium',
                assigned_to INT,
                department VARCHAR(100),
                
                -- Dates
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Attachments
                attachment_url TEXT,
                
                -- Foreign Keys
                CONSTRAINT fk_user 
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                    ON DELETE SET NULL,
                
                CONSTRAINT fk_category 
                    FOREIGN KEY (category_id) REFERENCES categories(category_id)
                    ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Complaints table created successfully!');

        // Add some sample categories if they don't exist
        const [catCount] = await db.promise().query("SELECT COUNT(*) as count FROM categories");
        
        if (catCount[0].count === 0) {
            console.log('\nAdding sample categories...');
            
            await db.promise().query(`
                INSERT INTO categories (category_name, description) VALUES
                ('Technical Issue', 'Problems with website or system functionality'),
                ('Billing', 'Payment and billing related issues'),
                ('Service Quality', 'Issues with service quality or delivery'),
                ('General Inquiry', 'General questions or information requests'),
                ('Feature Request', 'Suggestions for new features or improvements'),
                ('Bug Report', 'Reports of software bugs or errors')
            `);
            
            console.log('✅ Sample categories added');
        }

        // Add some sample complaints if they don't exist
        const [complaintCount] = await db.promise().query("SELECT COUNT(*) as count FROM complaints");
        
        if (complaintCount[0].count === 0) {
            console.log('\nAdding sample complaints...');
            
            await db.promise().query(`
                INSERT INTO complaints (reference_number, name, email, phone_number, title, description, category_id, status, priority) VALUES
                ('COMP-001', 'John Doe', 'john@example.com', '+251912345678', 'Website Login Issue', 'I am unable to login to the dashboard since yesterday. The page keeps loading but never completes.', 1, 'Pending', 'High'),
                ('COMP-002', 'Jane Smith', 'jane@example.com', '+251923456789', 'Payment Processing Delay', 'Payment was deducted but not reflected in my account. Transaction ID: TXN123456', 2, 'In Progress', 'Medium'),
                ('COMP-003', 'Bob Johnson', 'bob@example.com', '+251934567890', 'Feature Request - Dark Mode', 'Need dark mode option for better night usage. This would help reduce eye strain.', 5, 'Pending', 'Low'),
                ('COMP-004', 'Alice Brown', 'alice@example.com', '+251945678901', 'Service Quality Issue', 'The service quality has degraded significantly in the past week.', 3, 'Resolved', 'High'),
                ('COMP-005', 'Charlie Wilson', 'charlie@example.com', '+251956789012', 'Bug Report - Export Function', 'Export to PDF function is not working. Getting error message.', 6, 'In Progress', 'Medium')
            `);
            
            console.log('✅ Sample complaints added');
        }

        // Show final count
        const [finalCount] = await db.promise().query("SELECT COUNT(*) as count FROM complaints");
        console.log(`\nTotal complaints in database: ${finalCount[0].count}`);

    } catch (error) {
        console.error('❌ Error creating complaints table:', error.message);
    } finally {
        process.exit(0);
    }
}

createComplaintsTable();

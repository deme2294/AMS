// Script to check if complaint tables exist in the database
const db = require('../models/db');

async function checkComplaintTables() {
    try {
        console.log('Checking complaint tables in database...\n');

        // Check if complaints table exists
        const [tables] = await db.promise().query("SHOW TABLES LIKE 'complaints'");
        
        if (tables.length === 0) {
            console.log('❌ Complaints table does NOT exist in the database');
            console.log('\nYou need to create the complaint tables first.');
            console.log('Run the SQL script from db_barber.sql to create the tables.');
            return;
        }

        console.log('✅ Complaints table exists');

        // Check table structure
        const [columns] = await db.promise().query("DESCRIBE complaints");
        console.log('\nComplaints table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Check if there are any complaints
        const [count] = await db.promise().query("SELECT COUNT(*) as count FROM complaints");
        console.log(`\nTotal complaints in database: ${count[0].count}`);

        // Check categories table
        const [catTables] = await db.promise().query("SHOW TABLES LIKE 'categories'");
        if (catTables.length > 0) {
            console.log('\n✅ Categories table exists');
            const [catCount] = await db.promise().query("SELECT COUNT(*) as count FROM categories");
            console.log(`Total categories: ${catCount[0].count}`);
        } else {
            console.log('\n❌ Categories table does NOT exist');
        }

        // Check complaint_comments table
        const [commentTables] = await db.promise().query("SHOW TABLES LIKE 'complaint_comments'");
        if (commentTables.length > 0) {
            console.log('\n✅ Complaint_comments table exists');
        } else {
            console.log('\n❌ Complaint_comments table does NOT exist');
        }

        // Check complaint_history table
        const [historyTables] = await db.promise().query("SHOW TABLES LIKE 'complaint_history'");
        if (historyTables.length > 0) {
            console.log('\n✅ Complaint_history table exists');
        } else {
            console.log('\n❌ Complaint_history table does NOT exist');
        }

        // Check complaint_feedback table
        const [feedbackTables] = await db.promise().query("SHOW TABLES LIKE 'complaint_feedback'");
        if (feedbackTables.length > 0) {
            console.log('\n✅ Complaint_feedback table exists');
        } else {
            console.log('\n❌ Complaint_feedback table does NOT exist');
        }

        // Check complaint_attachments table
        const [attachTables] = await db.promise().query("SHOW TABLES LIKE 'complaint_attachments'");
        if (attachTables.length > 0) {
            console.log('\n✅ Complaint_attachments table exists');
        } else {
            console.log('\n❌ Complaint_attachments table does NOT exist');
        }

    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
    } finally {
        process.exit(0);
    }
}

checkComplaintTables();

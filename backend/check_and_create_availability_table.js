const db = require('./models/db');

async function checkAndCreateTable() {
  try {
    // Check if table exists
    const [tables] = await db.promise().query('SHOW TABLES LIKE "availability_slots"');
    
    if (tables.length === 0) {
      console.log('Table availability_slots does not exist. Creating...');
      
      // Read and execute the migration
      const fs = require('fs');
      const migrationSQL = fs.readFileSync('./migrations/availability_migration.sql', 'utf8');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.promise().query(statement);
            console.log('Executed statement successfully');
          } catch (err) {
            console.error('Error executing statement:', err.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
      
      console.log('Table creation completed');
    } else {
      console.log('Table availability_slots already exists');
      
      // Check table structure
      const [columns] = await db.promise().query('DESCRIBE availability_slots');
      console.log('Table structure:');
      console.table(columns);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCreateTable();

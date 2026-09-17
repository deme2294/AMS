const db = require('./models/db');

async function updateSchema() {
  try {
    await db.promise().query(`
      ALTER TABLE complaints 
      ADD COLUMN IF NOT EXISTS complaint_type ENUM('internal', 'external') DEFAULT 'external' AFTER type
    `);
    
    console.log('Database schema updated successfully');
    console.log('Added complaint_type column with internal/external options');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
  process.exit(0);
}

updateSchema();

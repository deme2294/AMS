const db = require('./models/db');

async function checkComplaintSchema() {
  try {
    const [schema] = await db.promise().query('DESCRIBE complaints');
    console.log('=== COMPLAINTS TABLE SCHEMA ===');
    schema.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (Null: ${col.Null}, Key: ${col.Key})`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkComplaintSchema();

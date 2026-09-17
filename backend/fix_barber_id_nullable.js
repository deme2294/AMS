const db = require('./models/db.js');

console.log('Altering availability_slots table to make barber_id nullable...');

db.query(`
  ALTER TABLE availability_slots 
  MODIFY barber_id INT(11) NULL
`, (err, results) => {
  if (err) {
    console.error('❌ Error altering table:', err);
    process.exit(1);
  }
  
  console.log('✅ Successfully made barber_id nullable');
  
  // Verify the change
  db.query('DESCRIBE availability_slots', (err, columns) => {
    if (err) {
      console.error('Error describing table:', err);
    } else {
      const barberCol = columns.find(c => c.Field === 'barber_id');
      console.log('barber_id column after modification:');
      console.log(`  Type: ${barberCol.Type}`);
      console.log(`  Null: ${barberCol.Null}`);
      console.log(`  Key: ${barberCol.Key}`);
      console.log(`  Default: ${barberCol.Default}`);
    }
    process.exit(0);
  });
});

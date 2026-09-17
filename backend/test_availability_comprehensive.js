const db = require('./models/db.js');

// Test the database configuration and availability slot insertion
const runTests = async () => {
  try {
    console.log('📋 Running Availability API Tests\n');

    // Test 1: Verify table exists
    console.log('Test 1: Checking availability_slots table...');
    const [tables] = await db.promise().query('SHOW TABLES LIKE "availability_slots"');
    if (tables.length === 0) {
      throw new Error('availability_slots table not found!');
    }
    console.log('✅ Table exists\n');

    // Test 2: Check barber_id column is nullable
    console.log('Test 2: Checking barber_id column is nullable...');
    const [columns] = await db.promise().query('DESCRIBE availability_slots');
    const barberCol = columns.find(c => c.Field === 'barber_id');
    if (barberCol.Null !== 'YES') {
      throw new Error(`barber_id Null status is ${barberCol.Null}, expected YES!`);
    }
    console.log('✅ barber_id is nullable\n');

    // Test 3: Check if services table has data
    console.log('Test 3: Checking for active services...');
    const [services] = await db.promise().query(
      'SELECT id, service_name FROM services WHERE status = "active" LIMIT 1'
    );
    if (services.length === 0) {
      console.log('⚠️  No active services found. Test data insertion will fail.\n');
      process.exit(0);
    }
    const testServiceId = services[0].id;
    console.log(`✅ Found service: ${services[0].service_name} (ID: ${testServiceId})\n`);

    // Test 4: Try to insert an availability slot without barber
    console.log('Test 4: Attempting to insert availability slot without barber_id...');
    const testDate = new Date().toISOString().split('T')[0];
    const [result] = await db.promise().query(
      `INSERT INTO availability_slots (service_id, barber_id, available_date, start_time, end_time, max_bookings, slot_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [testServiceId, null, testDate, '09:00:00', '10:00:00', 2, 'available', 'Test slot']
    );
    console.log(`✅ Successfully inserted slot with ID: ${result.insertId}\n`);

    // Test 5: Verify the inserted slot can be retrieved
    console.log('Test 5: Retrieving inserted slot...');
    const [retrieved] = await db.promise().query(
      'SELECT * FROM availability_slots WHERE id = ?',
      [result.insertId]
    );
    if (retrieved.length === 0) {
      throw new Error('Could not retrieve inserted slot!');
    }
    console.log('✅ Slot retrieved successfully');
    console.log(`   Service ID: ${retrieved[0].service_id}`);
    console.log(`   Barber ID: ${retrieved[0].barber_id}`);
    console.log(`   Date: ${retrieved[0].available_date}`);
    console.log(`   Time: ${retrieved[0].start_time} - ${retrieved[0].end_time}\n`);

    // Test 6: Clean up test data
    console.log('Test 6: Cleaning up test data...');
    await db.promise().query('DELETE FROM availability_slots WHERE id = ?', [result.insertId]);
    console.log('✅ Test data cleaned up\n');

    console.log('✅ All tests passed! The availability API should now work correctly.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
};

runTests();

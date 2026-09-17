const con = require("./models/db");

// Check availability_slots table structure
const checkTable = async () => {
  try {
    const [desc] = await con.promise().query("DESCRIBE availability_slots");
    console.log("Table structure:");
    console.table(desc.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // Check for any test records
    const [records] = await con.promise().query(
      "SELECT COUNT(*) as count FROM availability_slots"
    );
    console.log(`\nTotal records in table: ${records[0].count}`);

    // Try to insert a test record
    console.log("\nAttempting test insertion...");
    const testData = {
      service_id: 1,
      barber_id: null,
      available_date: '2026-06-08',
      start_time: '09:00:00',
      end_time: '10:00:00',
      max_bookings: 1,
      slot_status: 'available'
    };

    const [result] = await con.promise().query(
      `INSERT INTO availability_slots 
       (service_id, barber_id, available_date, start_time, end_time, max_bookings, slot_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [testData.service_id, testData.barber_id, testData.available_date, 
       testData.start_time, testData.end_time, testData.max_bookings, testData.slot_status]
    );

    console.log(`✅ Test insertion successful! Record ID: ${result.insertId}`);
    
    // Clean up
    await con.promise().query("DELETE FROM availability_slots WHERE id = ?", [result.insertId]);
    console.log("✅ Test record cleaned up");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error("Details:", {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
  }
  process.exit(0);
};

checkTable();

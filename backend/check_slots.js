const con = require("./models/db");

const check = async () => {
  try {
    // Check existing slots
    const [slots] = await con.promise().query("SELECT * FROM availability_slots");
    console.log("Existing slots:");
    console.table(slots);

    // Try a test POST to availability API manually
    console.log("\n\nAttempting test POST with valid data...");
    const testData = {
      service_id: 1,
      barber_id: null,
      available_date: '2026-06-15',
      start_time: '09:00',
      end_time: '10:00',
      max_bookings: 1,
      slot_status: 'available'
    };

    console.log("Test payload:", testData);

  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
};

check();

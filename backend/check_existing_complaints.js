const db = require('./models/db');

async function checkExistingComplaints() {
  try {
    const [complaints] = await db.promise().query('SELECT complaint_id, reference_number, title, status, priority, complaint_type FROM complaints LIMIT 10');
    console.log('=== EXISTING COMPLAINTS ===');
    complaints.forEach(comp => {
      console.log(`ID: ${comp.complaint_id}, Ref: ${comp.reference_number}, Title: ${comp.title}, Status: ${comp.status}, Priority: ${comp.priority}, Type: ${comp.complaint_type}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkExistingComplaints();

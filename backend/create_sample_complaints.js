const db = require('./models/db');

async function createSampleComplaints() {
  try {
    const complaints = [
      {
        reference_number: 'COMP-SAMPLE-001',
        user_id: 1006, // testuser
        name: 'Test User',
        email: 'test@example.com',
        title: 'Network Connectivity Issues',
        description: 'Users are experiencing intermittent network connectivity issues in the main office area.',
        category_id: 7,
        priority: 'high',
        complaint_type: 'internal',
        status: 'pending'
      },
      {
        reference_number: 'COMP-SAMPLE-002',
        user_id: 1006,
        name: 'Test User',
        email: 'test@example.com',
        title: 'Facility Maintenance Request',
        description: 'Air conditioning system in conference room needs repair.',
        category_id: 2,
        priority: 'medium',
        complaint_type: 'internal',
        status: 'assigned'
      },
      {
        reference_number: 'COMP-SAMPLE-003',
        user_id: 1006,
        name: 'Test User',
        email: 'test@example.com',
        title: 'Software License Renewal',
        description: 'Need to renew Adobe Creative Suite licenses for design team.',
        category_id: 3,
        priority: 'low',
        complaint_type: 'internal',
        status: 'approved'
      }
    ];

    for (const complaint of complaints) {
      await db.promise().query(`
        INSERT INTO complaints (
          reference_number, user_id, name, email, title, description,
          category_id, priority, complaint_type, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        complaint.reference_number,
        complaint.user_id,
        complaint.name,
        complaint.email,
        complaint.title,
        complaint.description,
        complaint.category_id,
        complaint.priority,
        complaint.complaint_type,
        complaint.status
      ]);
    }

    console.log('Sample complaints created successfully!');
    console.log('Created 3 sample complaints for testing');
    
  } catch (error) {
    console.error('Error creating sample complaints:', error);
  }
  process.exit(0);
}

createSampleComplaints();

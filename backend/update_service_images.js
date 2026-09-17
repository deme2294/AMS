const db = require('./models/db.js');

db.query(
  `UPDATE services s
   JOIN service_categories sc ON s.category_id = sc.id
   SET s.service_image = sc.category_image
   WHERE (s.service_image IS NULL OR s.service_image = '') AND sc.category_image IS NOT NULL AND sc.category_image != ''`,
  (err, result) => {
    if (err) {
      console.error("Error updating services:", err);
    } else {
      console.log(`Updated ${result.affectedRows} services with category image.`);
    }
    
    // Check results
    db.query('SELECT id, service_name, service_image FROM services', (e, r) => {
        console.log(r);
        process.exit(0);
    });
  }
);

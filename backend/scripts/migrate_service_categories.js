const db = require('../models/db');

async function migrate() {
  try {
    console.log('Altering service_categories table to add missing columns...');
    
    // Check which columns already exist
    const [cols] = await db.promise().query('DESCRIBE service_categories');
    const existing = cols.map(c => c.Field.toLowerCase());
    console.log('Existing columns:', existing);

    if (!existing.includes('sort_order')) {
      console.log('Adding sort_order column...');
      await db.promise().query('ALTER TABLE service_categories ADD COLUMN sort_order INT DEFAULT 0');
    }

    if (!existing.includes('color')) {
      console.log('Adding color column...');
      await db.promise().query("ALTER TABLE service_categories ADD COLUMN color VARCHAR(50) DEFAULT '#6366f1'");
    }

    if (!existing.includes('image')) {
      console.log('Adding image column...');
      await db.promise().query('ALTER TABLE service_categories ADD COLUMN image VARCHAR(255) NULL');
    }

    if (!existing.includes('created_by')) {
      console.log('Adding created_by column...');
      await db.promise().query('ALTER TABLE service_categories ADD COLUMN created_by INT NULL');
    }

    // Sync values between alias columns
    await db.promise().query(`
      UPDATE service_categories 
      SET sort_order = COALESCE(display_order, id),
          image = COALESCE(category_image, image_url)
    `);

    console.log('✅ service_categories table migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

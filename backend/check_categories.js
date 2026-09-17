const db = require('./models/db');

async function checkCategories() {
  try {
    const [categories] = await db.promise().query('SELECT * FROM categories LIMIT 10');
    console.log('=== AVAILABLE CATEGORIES ===');
    categories.forEach(cat => {
      console.log(`ID: ${cat.category_id}, Name: ${cat.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkCategories();

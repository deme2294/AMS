const db = require('./models/db');

async function checkMenuStructure() {
  try {
    const [structure] = await db.promise().query('DESCRIBE cms_menus');
    console.log('=== CMS MENUS TABLE STRUCTURE ===');
    structure.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (Null: ${col.Null}, Key: ${col.Key})`);
    });
    
    const [menus] = await db.promise().query('SELECT * FROM cms_menus ORDER BY parent_id, order_index');
    console.log('\n=== ALL CMS MENUS ===');
    menus.forEach(menu => {
      console.log(`ID: ${menu.id}, Name: ${menu.title}, Path: ${menu.path}, Parent: ${menu.parent_id}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkMenuStructure();

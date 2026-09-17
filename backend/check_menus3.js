const db = require('./models/db.js');
db.query('SELECT * FROM cms_menus WHERE title LIKE "%service%" OR path LIKE "%service%" ORDER BY id ASC', (err, results) => {
  console.log('Service-related menu items:');
  if (results.length === 0) {
    console.log('NONE FOUND - Services menu is missing!');
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  
  // Also check the full menu structure
  db.query('SELECT id, title, path, parent_id, order_index, is_section, is_active FROM cms_menus ORDER BY order_index, id', (err, all) => {
    console.log('\nFull menu structure:');
    all.forEach(m => {
      console.log(`${m.id}. ${m.title} (path: ${m.path || '(none)'}, parent: ${m.parent_id || 'none'}, active: ${m.is_active})`);
    });
    process.exit(0);
  });
});

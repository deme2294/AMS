const db = require('../models/db');

async function checkMenus() {
    const connection = await db.promise().getConnection();
    
    try {
        // Check the table structure
        const [structure] = await connection.query('DESCRIBE cms_menus');
        console.log('Table structure:');
        console.log(structure);
        
        // Check existing menus
        const [menus] = await connection.query('SELECT id, title, path FROM cms_menus WHERE title LIKE "%response%" OR path LIKE "%response%"');
        console.log('\nExisting response-related menus:');
        console.log(menus);
        
        // Check max id
        const [maxId] = await connection.query('SELECT MAX(id) as max_id FROM cms_menus');
        console.log('\nMax menu ID:', maxId[0]);
        
        // Check if there's a row with id 0
        const [zeroId] = await connection.query('SELECT * FROM cms_menus WHERE id = 0');
        console.log('\nRows with id = 0:', zeroId.length);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

checkMenus();

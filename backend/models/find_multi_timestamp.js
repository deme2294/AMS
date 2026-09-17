
const fs = require('fs');
const content = fs.readFileSync('cms.sql', 'utf8');
const tables = content.split('CREATE TABLE');

tables.forEach(table => {
    const lines = table.split('\n');
    let count = 0;
    lines.forEach(line => {
        if (line.toLowerCase().includes('timestamp') &&
            (line.toLowerCase().includes('default current_timestamp') ||
                line.toLowerCase().includes('on update current_timestamp'))) {
            count++;
        }
    });
    if (count > 1) {
        const tableNameMatch = table.match(/`([^`]+)`/);
        if (tableNameMatch) {
            console.log(`Table with multiple timestamp markers: ${tableNameMatch[1]}`);
            // console.log(table.substring(0, 500));
        }
    }
});

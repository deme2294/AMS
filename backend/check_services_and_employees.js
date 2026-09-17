const db = require('./models/db');

async function checkTables() {
  try {
    console.log('Checking services table...');
    const [services] = await db.promise().query('SELECT id, service_name, status FROM services LIMIT 5');
    console.log('Services found:', services.length);
    console.table(services);

    console.log('\nChecking employees table...');
    const [employees] = await db.promise().query('SELECT employee_id, name, fname, lname FROM employees LIMIT 5');
    console.log('Employees found:', employees.length);
    console.table(employees);

    console.log('\nChecking if there are any services with status "active"');
    const [activeServices] = await db.promise().query('SELECT id, service_name FROM services WHERE status = "active" LIMIT 5');
    console.log('Active services found:', activeServices.length);
    console.table(activeServices);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();

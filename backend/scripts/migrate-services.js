/**
 * Migration Script: Create Service Management Tables
 * Run: node scripts/migrate-services.js
 *
 * This runs the SQL from create_service_tables.sql against the database.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_barber',
  multipleStatements: true,
};

async function run() {
  const sqlPath = path.join(__dirname, 'create_service_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection(config);
  console.log('✅ Connected to database:', config.database);

  try {
    await connection.query(sql);
    console.log('✅ Service tables created/verified successfully');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await connection.end();
  }
}

run();

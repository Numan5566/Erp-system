const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function getUsers() {
  try {
    const res = await pool.query('SELECT id, email, role, module_type FROM users');
    console.log('👥 Users:');
    res.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Email: ${row.email}, Role: ${row.role}, ModuleType: ${row.module_type}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

getUsers();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function listUsers() {
  try {
    const res = await pool.query('SELECT id, name, email, role FROM users');
    console.log('👥 Active Users in Database:');
    res.rows.forEach(user => {
      console.log(`  - Name: ${user.name.padEnd(20)} | Email: ${user.email.padEnd(25)} | Role: ${user.role}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Error listing users:', err.message);
    process.exit(1);
  }
}

listUsers();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function inspect() {
  console.log('🔍 Inspecting suppliers database...');
  try {
    const res = await pool.query('SELECT id, name, company, module_type, user_id FROM suppliers');
    console.log('📊 Existing Suppliers:');
    res.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Name: ${row.name}, Company: ${row.company}, ModuleType: [${row.module_type}], UserID: ${row.user_id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

inspect();

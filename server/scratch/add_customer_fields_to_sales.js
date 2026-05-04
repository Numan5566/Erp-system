require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  console.log('🔄 Adding customer_phone and customer_address to sales table...');
  try {
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);`);
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_address TEXT;`);
    console.log('✅ Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

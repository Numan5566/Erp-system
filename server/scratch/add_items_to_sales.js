require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  console.log('🔄 Adding items (JSONB) column to sales table...');
  try {
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';`);
    console.log('✅ Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

const pool = require('../config/db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_type VARCHAR(100) DEFAULT 'Cash';
    `);
    console.log('Successfully added payment_type column to purchases table');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

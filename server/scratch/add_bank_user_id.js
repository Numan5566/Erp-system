const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Adding user_id to bank_accounts...');
    await pool.query(`ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();

const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Adding module_type to bank_accounts table...');
    await pool.query(`
      ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS module_type VARCHAR(100);
    `);
    
    // Set default module_type for existing records
    await pool.query(`
      UPDATE bank_accounts SET module_type = 'Wholesale' WHERE module_type IS NULL;
    `);

    console.log('Bank accounts table updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

migrate();

const pool = require('../config/db');

async function migrate() {
  try {
    const tables = ['expenses', 'rent', 'investments', 'other_expenses', 'salary'];
    console.log('Adding payment_type to financial tables...');
    
    for (const table of tables) {
      console.log(`Updating ${table}...`);
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS payment_type VARCHAR(100) DEFAULT 'Cash';`);
    }
    
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();

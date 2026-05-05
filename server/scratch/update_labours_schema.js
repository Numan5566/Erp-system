const pool = require('../config/db');

async function updateSchema() {
  try {
    // 1. Add cnic column to labours table
    try {
      await pool.query('ALTER TABLE labours ADD COLUMN cnic VARCHAR(100)');
      console.log('Added CNIC column to labours table!');
    } catch (e) {
      console.log('CNIC column already exists or error:', e.message);
    }

    // 2. Create labour_work_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS labour_work_history (
        id SERIAL PRIMARY KEY,
        group_name VARCHAR(255) NOT NULL,
        bill_id INT,
        description TEXT NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Unpaid',
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Successfully created labour_work_history table!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update labours schema:', err);
    process.exit(1);
  }
}

updateSchema();

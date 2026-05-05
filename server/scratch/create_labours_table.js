const pool = require('../config/db');

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS labours (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        group_name VARCHAR(255) NOT NULL,
        contact VARCHAR(100),
        rate_per_day DECIMAL(10, 2) DEFAULT 0,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Successfully created labours table with grouping!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create labours table:', err);
    process.exit(1);
  }
}

createTable();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'erp_db'
});

pool.on('connect', async () => {
  console.log('Connected to PostgreSQL Database.');
  try {
    await pool.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS labour_group VARCHAR(100);');
  } catch (err) {
    console.error('Migration failed:', err);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

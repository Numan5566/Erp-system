const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'erp_db'
      }
);

pool.on('connect', async () => {
  console.log('Connected to PostgreSQL Database.');
  try {
    // Sales Migration
    await pool.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS labour_group VARCHAR(100);');
    
    // Purchases Migration (Critical fix for 500 Error on Cloud DB)
    await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;');
    await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(15,2) DEFAULT 0;');
    await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS fare_payment_type VARCHAR(100) DEFAULT \'Pending\';');
    await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_type VARCHAR(100) DEFAULT \'Cash\';');
  } catch (err) {
    console.error('Migration failed:', err);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

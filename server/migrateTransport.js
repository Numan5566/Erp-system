const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_H3Z7RjBawhQv@ep-crimson-fog-a5z8uoww-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
  try {
    const res = await pool.query("UPDATE expenses SET expense_type = 'Supplier Vehicle' WHERE category = 'Transport'");
    console.log('SUCCESS: Historical migration applied! Updated Rows:', res.rowCount);
  } catch (err) {
    console.error('ERROR during migration:', err);
  } finally {
    await pool.end();
  }
}

migrate();

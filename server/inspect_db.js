const pool = require('./config/db');

async function run() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log("TABLES:", res.rows.map(r => r.table_name));

    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'salary';");
    console.log("SALARY COLUMNS:", cols.rows);

    // Check if there's a payment log or if a separate payment table is needed
    
    process.exit();
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();

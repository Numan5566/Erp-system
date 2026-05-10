const pool = require('./server/config/db');
async function run() {
  const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'created_at'");
  console.log(r.rows);
  process.exit(0);
}
run();

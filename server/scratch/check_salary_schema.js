const pool = require('../config/db');
async function run() {
  const sal = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'salary'");
  const salP = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'salary_payments'");
  console.log('SALARY COLUMNS:', sal.rows.map(r => r.column_name));
  console.log('SALARY_PAYMENTS COLUMNS:', salP.rows.map(r => r.column_name));
  process.exit(0);
}
run();

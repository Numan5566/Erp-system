const pool = require('../config/db');

async function run() {
  try {
    const expenses = await pool.query('SELECT id, description, amount, payment_type, user_id, module_type, expense_date FROM expenses');
    console.log('--- ALL EXPENSES ---');
    console.log(expenses.rows);

    const salary = await pool.query('SELECT id, employee_name, amount, user_id, module_type FROM salary');
    console.log('--- ALL SALARIES ---');
    console.log(salary.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

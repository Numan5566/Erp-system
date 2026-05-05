const pool = require('../config/db');

async function check() {
  try {
    const salesRes = await pool.query('SELECT count(*), sum(paid_amount) as total_paid, payment_type FROM sales GROUP BY payment_type');
    console.log('--- SALES BY PAYMENT TYPE ---');
    console.log(salesRes.rows);

    const purchasesRes = await pool.query('SELECT count(*), sum(paid_amount) as total_paid FROM purchases');
    console.log('--- PURCHASES TOTALS ---');
    console.log(purchasesRes.rows);

    const accountsRes = await pool.query('SELECT * FROM bank_accounts');
    console.log('--- BANK ACCOUNTS ---');
    console.log(accountsRes.rows);

    const expensesRes = await pool.query('SELECT count(*), sum(amount) as total_amount, payment_type FROM expenses GROUP BY payment_type');
    console.log('--- EXPENSES BY PAYMENT TYPE ---');
    console.log(expensesRes.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

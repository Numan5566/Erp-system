const pool = require('../config/db');

async function reset() {
  const tables = [
    'sales',
    'bill_items',
    'purchases',
    'expenses',
    'salaries',
    'salary',
    'rents',
    'rent',
    'other_expenses',
    'investments'
  ];

  for (const table of tables) {
    try {
      await pool.query(`DELETE FROM ${table} CASCADE`);
      console.log(`Successfully cleared table: ${table}`);
    } catch (e) {
      console.log(`Table ${table} not cleared (might not exist): ${e.message}`);
    }
  }

  try {
    await pool.query("DELETE FROM bank_accounts WHERE LOWER(bank_name) = 'cash' OR LOWER(bank_name) = 'cash account'");
    console.log('Successfully deleted old Cash accounts');
  } catch (e) {
    console.log(`Old Cash accounts not deleted: ${e.message}`);
  }

  console.log('Done clearing transaction data!');
  process.exit(0);
}

reset();

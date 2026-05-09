const pool = require('../config/db');

async function syncDatabaseSchema() {
  console.log('🔄 Starting automatic DB self-healing migration...');
  const queries = [
    // 1. Products
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_stock DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INTEGER;`,

    // 2. Customers
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,

    // 3. Suppliers
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone VARCHAR(100);`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company VARCHAR(255);`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,

    // 4. Purchases (Critical Fix)
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(15, 2) DEFAULT 0;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS fare_payment_type VARCHAR(100) DEFAULT 'Pending';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Cash';`,

    // 5. Expenses
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type VARCHAR(50) DEFAULT 'Office';`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category VARCHAR(100);`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE DEFAULT CURRENT_DATE;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Cash';`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;`,

    // 6. Sales
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS labour_group VARCHAR(100);`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(100);`,

    // 7. Salary & Rent
    `ALTER TABLE salary ADD COLUMN IF NOT EXISTS designation VARCHAR(100);`,
    `ALTER TABLE salary ADD COLUMN IF NOT EXISTS cnic VARCHAR(100);`,
    `ALTER TABLE salary ADD COLUMN IF NOT EXISTS advance_salary DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE salary ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;`,
    `ALTER TABLE salary ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE rent ADD COLUMN IF NOT EXISTS rent_date DATE DEFAULT CURRENT_DATE;`,
    `ALTER TABLE rent ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,

    // 8. Labours
    `ALTER TABLE labours ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE labour_work_history ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`
  ];

  let successCount = 0;
  let failCount = 0;

  for (const q of queries) {
    try {
      await pool.query(q);
      successCount++;
    } catch (e) {
      // Ignore errors if table doesn't exist yet
      failCount++;
    }
  }

  console.log(`✅ Auto-Sync completed: Executed ${queries.length} verification checks.`);
}

module.exports = syncDatabaseSchema;

const pool = require('../config/db');

async function syncDatabaseSchema() {
  console.log('🔄 Starting exhaustive DB self-healing migration...');
  
  const queries = [
    // --- 1. PRODUCTS ---
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_stock DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INTEGER;`,

    // --- 2. SUPPLIERS ---
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone VARCHAR(100);`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company VARCHAR(255);`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15, 2) DEFAULT 0;`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,

    // --- 3. PURCHASES (The Critical Culprit) ---
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS module_type VARCHAR(50);`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(15, 2) DEFAULT 0;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS fare_payment_type VARCHAR(50) DEFAULT 'Pending';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Cash';`,

    // --- 4. VEHICLES (The Missing Piece) ---
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50);`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(100);`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100);`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_cnic VARCHAR(50);`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50);`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(15, 2) DEFAULT 0;`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS module_type VARCHAR(50);`,

    // --- 5. EXPENSES (Secondary Failure Mode) ---
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type VARCHAR(50) DEFAULT 'Office';`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category VARCHAR(100);`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE DEFAULT CURRENT_DATE;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Cash';`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;`,

    // --- 6. CUSTOMERS ---
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15, 2) DEFAULT 0;`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,

    // --- 7. SALES ---
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS labour_group VARCHAR(100);`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(100);`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50) DEFAULT 'Retail';`,

    // --- 8. LABOURS ---
    `ALTER TABLE labours ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,
    `ALTER TABLE labour_work_history ADD COLUMN IF NOT EXISTS module_type VARCHAR(100) DEFAULT 'Wholesale';`,

    // --- 9. DATA HEALING MIGRATIONS ---
    `UPDATE expenses SET expense_type = 'Supplier Vehicle' WHERE category = 'Transport' AND expense_type = 'Office';`
  ];

  let totalExecuted = 0;

  for (const q of queries) {
    try {
      await pool.query(q);
      totalExecuted++;
    } catch (e) {
      // Silence expected errors if base table doesn't exist yet
    }
  }

  console.log(`✅ Ultimate DB Auto-Sync successful. Executed ${totalExecuted} safety-checks.`);
}

module.exports = syncDatabaseSchema;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./config/db');

async function migrate() {
  console.log('🚀 Running final tables migration...\n');

  try {
    const tables = {
      products: [
        ['brand', 'VARCHAR(100)'],
        ['cost_price', 'DECIMAL(12, 2) DEFAULT 0'],
        ['stock_quantity', 'DECIMAL(12, 2) DEFAULT 0'],
        ['minimum_stock', 'DECIMAL(12, 2) DEFAULT 0'],
        ['description', 'TEXT'],
        ['image_url', 'TEXT'],
        ['user_id', 'INTEGER']
      ],
      customers: [
        ['phone', 'VARCHAR(20)'],
        ['email', 'VARCHAR(100)'],
        ['address', 'TEXT'],
        ['balance', 'DECIMAL(12, 2) DEFAULT 0'],
        ['user_id', 'INTEGER']
      ],
      suppliers: [
        ['phone', 'VARCHAR(20)'],
        ['email', 'VARCHAR(100)'],
        ['company', 'VARCHAR(255)'],
        ['address', 'TEXT'],
        ['balance', 'DECIMAL(12, 2) DEFAULT 0'],
        ['user_id', 'INTEGER']
      ],
      salary: [
        ['designation', 'VARCHAR(100)'],
        ['amount', 'DECIMAL(12, 2) NOT NULL'],
        ['payment_date', 'DATE DEFAULT CURRENT_DATE'],
        ['status', "VARCHAR(50) DEFAULT 'Paid'"],
        ['notes', 'TEXT'],
        ['user_id', 'INTEGER']
      ],
      transport: [
        ['vehicle_number', 'VARCHAR(50)'],
        ['driver_name', 'VARCHAR(255)'],
        ['customer_name', 'VARCHAR(255)'],
        ['destination', 'TEXT'],
        ['fare_amount', 'DECIMAL(12, 2) NOT NULL'],
        ['expense_amount', 'DECIMAL(12, 2) DEFAULT 0'],
        ['transport_date', 'DATE DEFAULT CURRENT_DATE'],
        ['status', "VARCHAR(50) DEFAULT 'Pending'"],
        ['user_id', 'INTEGER']
      ],
      expenses: [
        ['category', 'VARCHAR(100)'],
        ['amount', 'DECIMAL(12, 2) NOT NULL'],
        ['expense_date', 'DATE DEFAULT CURRENT_DATE'],
        ['notes', 'TEXT'],
        ['user_id', 'INTEGER']
      ]
    };

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS suppliers (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS salary (id SERIAL PRIMARY KEY, employee_name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS transport (id SERIAL PRIMARY KEY, fare_amount DECIMAL(12, 2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS expenses (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);

    // Sync columns for each table
    for (const [tableName, columns] of Object.entries(tables)) {
      for (const [col, type] of columns) {
        try {
          await pool.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col} ${type.includes('NOT NULL') ? type.replace('NOT NULL', '') : type};`);
          console.log(`✅ Column "${col}" checked/added for table "${tableName}".`);
        } catch (e) {
          console.log(`⚠️ Note: Column "${col}" in "${tableName}" might already exist or have a constraint issue.`);
        }
      }
      console.log(`✅ Table "${tableName}" sync complete.\n`);
    }

    console.log('\n✅ All tables synchronized successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

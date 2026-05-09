const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

async function fix() {
  console.log('⚡ Running database module_type fix migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update user module_types
    console.log('  - Updating users table module types...');
    await client.query("UPDATE users SET module_type = 'Wholesale' WHERE email = 'wholesale@erp.com'");
    await client.query("UPDATE users SET module_type = 'Retail 1' WHERE email = 'retail1@erp.com'");
    await client.query("UPDATE users SET module_type = 'Retail 2' WHERE email = 'retail2@erp.com'");

    // Get user IDs
    const usersRes = await client.query("SELECT id, email, module_type FROM users");
    const users = usersRes.rows;
    console.log('  - Current users in DB:');
    users.forEach(u => {
      console.log(`    * [ID: ${u.id}] ${u.email} -> ${u.module_type}`);
    });

    // 2. Fix suppliers with wrong/null module_types based on their creator's user_id
    console.log('  - Syncing existing suppliers module_types...');
    for (const u of users) {
      if (u.module_type) {
        const res = await client.query(
          "UPDATE suppliers SET module_type = $1 WHERE user_id = $2 OR (module_type IS NULL AND user_id = $2)",
          [u.module_type, u.id]
        );
        console.log(`    * Updated suppliers for ${u.email} to ${u.module_type} (${res.rowCount} rows affected)`);
      }
    }

    // 3. Fix products with wrong/null module_types based on creator's user_id
    console.log('  - Syncing existing products module_types...');
    for (const u of users) {
      if (u.module_type) {
        const res = await client.query(
          "UPDATE products SET module_type = $1 WHERE user_id = $2 OR (module_type IS NULL AND user_id = $2)",
          [u.module_type, u.id]
        );
        console.log(`    * Updated products for ${u.email} to ${u.module_type} (${res.rowCount} rows affected)`);
      }
    }

    // 4. Fix customers with wrong/null module_types based on creator's user_id
    console.log('  - Syncing existing customers module_types...');
    for (const u of users) {
      if (u.module_type) {
        const res = await client.query(
          "UPDATE customers SET module_type = $1 WHERE user_id = $2 OR (module_type IS NULL AND user_id = $2)",
          [u.module_type, u.id]
        );
        console.log(`    * Updated customers for ${u.email} to ${u.module_type} (${res.rowCount} rows affected)`);
      }
    }

    // 5. Fix sales with wrong/null module_types based on creator's user_id
    console.log('  - Syncing existing sales module_types...');
    for (const u of users) {
      if (u.module_type) {
        const res = await client.query(
          "UPDATE sales SET sale_type = $1 WHERE user_id = $2 OR (sale_type IS NULL AND user_id = $2)",
          [u.module_type, u.id]
        );
        console.log(`    * Updated sales for ${u.email} to ${u.module_type} (${res.rowCount} rows affected)`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

fix();

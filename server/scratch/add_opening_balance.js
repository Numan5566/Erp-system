const pool = require('../config/db');

async function migrate() {
    try {
        console.log("Checking bank_accounts schema...");
        await pool.query(`
            ALTER TABLE bank_accounts 
            ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15, 2) DEFAULT 0
        `);
        console.log("Success: opening_balance column added/verified.");

        // Also check if a "Cash" account exists for each user, if not, maybe we should suggest it
        // Or just let the user add it.
        
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();

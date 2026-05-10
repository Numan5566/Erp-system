const pool = require('../config/db');

async function nukeTables() {
    try {
        // 1. Get all table names in public schema
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        const allTables = res.rows.map(r => r.table_name);
        
        console.log("Found all tables:", allTables);

        // 2. Filter out critical system tables
        const skip = ['users', 'migrations'];
        const targets = allTables.filter(t => !skip.includes(t));

        if (targets.length === 0) {
            console.log("No tables found to truncate.");
            process.exit(0);
        }

        console.log("NUCLEAR ACTION TARGETS (WILL BE WIPED COMPLETELY):", targets);
        
        // 3. Build dynamic SQL with safety wrap
        // Cascade handles relationships automatically, Restart resets counters.
        const query = `TRUNCATE TABLE ${targets.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
        
        console.log("Executing Wipe Query...");
        await pool.query(query);
        
        console.log("SUCCESS: ALL TARGET DATA HAS BEEN COMPLETELY WIPED!");
        console.log("USER ACCOUNTS WERE SAVED AND ARE FULLY ACTIVE.");
        
        process.exit(0);
    } catch (e) {
        console.error("NUCLEAR ABORTED: Failed to wipe.", e);
        process.exit(1);
    }
}

nukeTables();

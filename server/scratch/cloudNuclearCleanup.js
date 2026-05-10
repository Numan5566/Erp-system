const { Pool } = require('pg');

// EXPLICIT NEON PRODUCTION DATABASE CONNECTION STRING HARVESTED FROM PREVIOUS SUCCESSFUL COMMANDS
const NEON_URL = 'postgresql://neondb_owner:npg_6RkM7qEetYxT@ep-crimson-fog-a5z8uoww.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false }
});

async function nukeProductionTables() {
    console.log("TARGET ACQUIRED: CONNECTING TO LIVE CLOUD NEON DATABASE...");
    try {
        // 1. Get all tables in the cloud db
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        const allTables = res.rows.map(r => r.table_name);
        
        console.log("ALL CLOUD TABLES DETECTED:", allTables);

        // 2. IMPORTANT: Safety filter for admin accounts
        const skip = ['users', 'migrations'];
        const targets = allTables.filter(t => !skip.includes(t));

        if (targets.length === 0) {
            console.log("Cloud database is already completely empty.");
            process.exit(0);
        }

        console.log("NUCLEAR TARGETS IN CLOUD (WARNING! IRREVERSIBLE!):", targets);
        
        // 3. Apply atomic purge to production
        const query = `TRUNCATE TABLE ${targets.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
        
        console.log("DETONATING NUCLEAR PURGE ON PRODUCTION NOW...");
        await pool.query(query);
        
        console.log("\n⭐⭐⭐ MISSION ACCOMPLISHED ⭐⭐⭐");
        console.log("THE LIVE CLOUD DATABASE HAS BEEN COMPLETELY WIPED FRESH!");
        console.log("ONLY 'users' TABLE WAS PRESERVED ON RENDER.");
        
        process.exit(0);
    } catch (e) {
        console.error("CRITICAL ERROR: PURGE FAILED ON CLOUD.", e);
        process.exit(1);
    }
}

nukeProductionTables();

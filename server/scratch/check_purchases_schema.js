const pool = require('../config/db');

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'purchases'
        `);
        console.log("Columns in purchases table:");
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();

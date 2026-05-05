const pool = require('../config/db');

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales'
        `);
        console.log("Columns in sales table:");
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();

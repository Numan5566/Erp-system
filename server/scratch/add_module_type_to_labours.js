const pool = require('../config/db');

async function run() {
  try {
    try {
      await pool.query('ALTER TABLE labours ADD COLUMN module_type VARCHAR(100)');
      console.log('Added module_type column to labours!');
    } catch (err) {
      console.log('labours module_type column already exists or error:', err.message);
    }

    try {
      await pool.query('ALTER TABLE labour_work_history ADD COLUMN module_type VARCHAR(100)');
      console.log('Added module_type column to labour_work_history!');
    } catch (err) {
      console.log('labour_work_history module_type column already exists or error:', err.message);
    }

    // Try to update existing records with correct module_type from their users
    try {
      await pool.query(`
        UPDATE labours l
        SET module_type = u.module_type
        FROM users u
        WHERE l.user_id = u.id AND l.module_type IS NULL
      `);
      await pool.query(`
        UPDATE labour_work_history h
        SET module_type = u.module_type
        FROM users u
        WHERE h.user_id = u.id AND h.module_type IS NULL
      `);
      console.log('Successfully updated existing records with user module types!');
    } catch (err) {
      console.log('Failed to update with user module types, falling back:', err.message);
    }

    // Fallback for any remaining NULL values
    await pool.query("UPDATE labours SET module_type = 'Wholesale' WHERE module_type IS NULL");
    await pool.query("UPDATE labour_work_history SET module_type = 'Wholesale' WHERE module_type IS NULL");
    console.log('Fallback complete: any remaining NULL module_types set to Wholesale.');

    process.exit(0);
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

run();

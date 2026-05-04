const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM rent';
    let params = [];

    if (isAdmin(req)) {
      if (type) {
        query += ' WHERE module_type = $1';
        params.push(type);
      }
    } else {
      query += ' WHERE module_type = $1';
      params.push(req.user.module_type || 'Retail 1');
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { property_name, landlord_name, amount, rent_date, status, notes, module_type } = req.body;
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    // Add missing columns if they don't exist
    await pool.query(`ALTER TABLE rent ADD COLUMN IF NOT EXISTS property_name VARCHAR(255);`).catch(() => {});
    await pool.query(`ALTER TABLE rent ADD COLUMN IF NOT EXISTS landlord_name VARCHAR(255);`).catch(() => {});
    await pool.query(`ALTER TABLE rent ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Paid';`).catch(() => {});

    const result = await pool.query(
      'INSERT INTO rent (property_name, landlord_name, amount, rent_date, status, notes, user_id, module_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [property_name, landlord_name, amount || 0, rent_date || new Date().toISOString().split('T')[0], status || 'Paid', notes, req.user.id, finalModule]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { property_name, landlord_name, amount, rent_date, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE rent SET property_name=$1, landlord_name=$2, amount=$3, rent_date=$4, status=$5, notes=$6 WHERE id=$7 AND (user_id=$8 OR $9) RETURNING *',
      [property_name, landlord_name, amount || 0, rent_date, status || 'Paid', notes, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM rent WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

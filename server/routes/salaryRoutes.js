const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM salary ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM salary WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { employee_name, designation, amount, payment_date, status, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO salary (employee_name, designation, amount, payment_date, status, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [employee_name, designation, amount || 0, payment_date || new Date().toISOString().split('T')[0], status || 'Paid', notes, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { employee_name, designation, amount, payment_date, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE salary SET employee_name=$1, designation=$2, amount=$3, payment_date=$4, status=$5, notes=$6 WHERE id=$7 AND (user_id=$8 OR $9) RETURNING *',
      [employee_name, designation, amount, payment_date, status, notes, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM salary WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM expenses ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM expenses WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, category, amount, expense_date, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO expenses (title, category, amount, expense_date, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, category, amount || 0, expense_date || new Date().toISOString().split('T')[0], notes, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, category, amount, expense_date, notes } = req.body;
    const result = await pool.query(
      'UPDATE expenses SET title=$1, category=$2, amount=$3, expense_date=$4, notes=$5 WHERE id=$6 AND (user_id=$7 OR $8) RETURNING *',
      [title, category, amount, expense_date, notes, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

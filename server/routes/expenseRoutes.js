const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT id, description as title, expense_type, category, amount, expense_date, notes, user_id, module_type, payment_type FROM expenses';
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

    query += ' ORDER BY expense_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, expense_type, category, amount, expense_date, notes, module_type, payment_type } = req.body;
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    const result = await pool.query(
      'INSERT INTO expenses (description, expense_type, category, amount, expense_date, notes, user_id, module_type, payment_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, description as title, expense_type, category, amount, expense_date, notes, user_id, module_type, payment_type',
      [title, expense_type || 'Office', category, amount || 0, expense_date || new Date().toISOString().split('T')[0], notes, req.user.id, finalModule, payment_type || 'Cash']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, expense_type, category, amount, expense_date, notes, payment_type } = req.body;
    const result = await pool.query(
      'UPDATE expenses SET description=$1, expense_type=$2, category=$3, amount=$4, expense_date=$5, notes=$6, payment_type=$7 WHERE id=$8 AND (user_id=$9 OR $10) RETURNING id, description as title, expense_type, category, amount, expense_date, notes, user_id, module_type, payment_type',
      [title, expense_type, category, amount, expense_date, notes, payment_type, req.params.id, req.user.id, isAdmin(req)]
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

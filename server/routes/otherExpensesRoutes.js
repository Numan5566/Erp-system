const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all other expenses records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM other_expenses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create other expense record
router.post('/', async (req, res) => {
  try {
    const { title, category, amount, expense_date, payment_method, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO other_expenses (title, category, amount, expense_date, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, category, amount, expense_date, payment_method || 'Cash', notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update other expense record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, expense_date, payment_method, notes } = req.body;
    const result = await pool.query(
      `UPDATE other_expenses SET title=$1, category=$2, amount=$3, expense_date=$4, payment_method=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [title, category, amount, expense_date, payment_method, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE other expense record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM other_expenses WHERE id=$1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

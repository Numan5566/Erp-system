const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all investment records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM investments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create investment record
router.post('/', async (req, res) => {
  try {
    const { investment_name, category, amount_invested, expected_return, investment_date, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO investments (investment_name, category, amount_invested, expected_return, investment_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [investment_name, category, amount_invested, expected_return, investment_date, status || 'Active', notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update investment record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { investment_name, category, amount_invested, expected_return, investment_date, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE investments SET investment_name=$1, category=$2, amount_invested=$3, expected_return=$4,
       investment_date=$5, status=$6, notes=$7 WHERE id=$8 RETURNING *`,
      [investment_name, category, amount_invested, expected_return, investment_date, status, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE investment record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM investments WHERE id=$1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

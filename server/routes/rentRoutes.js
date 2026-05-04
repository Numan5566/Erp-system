const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all rent records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rent ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create rent record
router.post('/', async (req, res) => {
  try {
    const { property_name, landlord_name, amount, payment_date, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO rent (property_name, landlord_name, amount, payment_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [property_name, landlord_name, amount, payment_date, status || 'Paid', notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update rent record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { property_name, landlord_name, amount, payment_date, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE rent SET property_name=$1, landlord_name=$2, amount=$3, payment_date=$4, status=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [property_name, landlord_name, amount, payment_date, status, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE rent record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM rent WHERE id=$1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

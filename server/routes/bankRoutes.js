const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all banks
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bank_accounts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a bank (Admin only)
router.post('/', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Access denied' });
  try {
    const { bank_name, account_title, account_number } = req.body;
    const result = await pool.query(
      'INSERT INTO bank_accounts (bank_name, account_title, account_number) VALUES ($1, $2, $3) RETURNING *',
      [bank_name, account_title, account_number]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a bank (Admin only)
router.delete('/:id', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Access denied' });
  try {
    await pool.query('DELETE FROM bank_accounts WHERE id=$1', [req.params.id]);
    res.json({ message: 'Bank deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

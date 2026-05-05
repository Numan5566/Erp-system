const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all banks
router.get('/', auth, async (req, res) => {
  try {
    let result;
    if (req.user.email === 'admin@erp.com') {
      // Master Admin sees ALL banks
      result = await pool.query('SELECT * FROM bank_accounts ORDER BY id ASC');
    } else {
      // Everyone else sees ONLY their own banks
      result = await pool.query('SELECT * FROM bank_accounts WHERE user_id = $1 ORDER BY id ASC', [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a bank (Allowed for everyone, linked to user_id)
router.post('/', auth, async (req, res) => {
  try {
    const { bank_name, account_title, account_number, opening_balance } = req.body;
    const result = await pool.query(
      'INSERT INTO bank_accounts (bank_name, account_title, account_number, opening_balance, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [bank_name, account_title, account_number, opening_balance || 0, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a bank account
router.put('/:id', auth, async (req, res) => {
  try {
    const { bank_name, account_title, account_number, opening_balance } = req.body;
    const result = await pool.query(
      'UPDATE bank_accounts SET bank_name=$1, account_title=$2, account_number=$3, opening_balance=$4 WHERE id=$5 AND (user_id=$6 OR $7) RETURNING *',
      [bank_name, account_title, account_number, opening_balance, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a bank (Owner or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      await pool.query('DELETE FROM bank_accounts WHERE id=$1', [req.params.id]);
    } else {
      await pool.query('DELETE FROM bank_accounts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    }
    res.json({ message: 'Bank deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

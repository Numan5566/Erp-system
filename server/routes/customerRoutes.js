const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM customers ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM customers WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, email, address, balance } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name,phone,email,address,balance,user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, phone, email, address, balance || 0, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, email, address, balance } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name=$1,phone=$2,email=$3,address=$4,balance=$5 WHERE id=$6 AND (user_id=$7 OR $8) RETURNING *',
      [name, phone, email, address, balance, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

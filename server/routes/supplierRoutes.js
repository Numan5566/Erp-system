const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM suppliers WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, email, company, address, balance } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (name,phone,email,company,address,balance,user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, phone, email, company, address, balance || 0, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, email, company, address, balance } = req.body;
    const result = await pool.query(
      'UPDATE suppliers SET name=$1,phone=$2,email=$3,company=$4,address=$5,balance=$6 WHERE id=$7 AND (user_id=$8 OR $9) RETURNING *',
      [name, phone, email, company, address, balance, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

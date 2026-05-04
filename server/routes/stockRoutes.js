const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM stock ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM stock WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { product_name, supplier_name, quantity_added, remaining_stock, purchase_price, sale_price } = req.body;
    const result = await pool.query(
      `INSERT INTO stock (product_name,supplier_name,quantity_added,remaining_stock,purchase_price,sale_price,user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [product_name, supplier_name, quantity_added, remaining_stock || quantity_added, purchase_price, sale_price, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { product_name, supplier_name, quantity_added, remaining_stock, purchase_price, sale_price } = req.body;
    const result = await pool.query(
      `UPDATE stock SET product_name=$1,supplier_name=$2,quantity_added=$3,remaining_stock=$4,purchase_price=$5,sale_price=$6
       WHERE id=$7 AND (user_id=$8 OR $9) RETURNING *`,
      [product_name, supplier_name, quantity_added, remaining_stock, purchase_price, sale_price, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM stock WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

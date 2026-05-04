const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all purchases for a specific supplier (Ledger)
router.get('/supplier/:supplierId', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT p.*, pr.name as product_name, pr.unit 
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.supplier_id = $1
    `;
    let params = [req.params.supplierId];

    if (!isAdmin(req)) {
      query += ' AND p.module_type = $2';
      params.push(req.user.module_type || 'Retail 1');
    } else if (type) {
      query += ' AND p.module_type = $2';
      params.push(type);
    }

    query += ' ORDER BY p.purchase_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new purchase (Receive Stock)
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { supplier_id, product_id, vehicle_number, quantity, rate, paid_amount, module_type } = req.body;
    
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const totalAmount = qty * rt;
    const balanceAmount = totalAmount - paid;
    
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    // 1. Insert Purchase Record
    const purchaseRes = await client.query(
      `INSERT INTO purchases 
      (supplier_id, product_id, vehicle_number, quantity, rate, total_amount, paid_amount, balance_amount, module_type, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [supplier_id, product_id, vehicle_number, qty, rt, totalAmount, paid, balanceAmount, finalModule, req.user.id]
    );

    // 2. Update Product Stock
    await client.query(
      `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2`,
      [qty, product_id]
    );

    // 3. Update Supplier Balance
    // NOTE: Supplier balance means "How much we owe them". 
    // So if balanceAmount is positive, we owe them that much more, so we ADD it to their balance.
    await client.query(
      `UPDATE suppliers SET balance = balance + $1 WHERE id = $2`,
      [balanceAmount, supplier_id]
    );

    await client.query('COMMIT');
    res.json(purchaseRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Purchase Route Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Make Payment to Supplier
router.post('/payment', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { supplier_id, paid_amount, notes, module_type } = req.body;
    
    const paid = parseFloat(paid_amount) || 0;
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    // 1. Insert Payment Record into Purchases (as a ledger entry)
    const paymentRes = await client.query(
      `INSERT INTO purchases 
      (supplier_id, product_id, vehicle_number, quantity, rate, total_amount, paid_amount, balance_amount, module_type, user_id) 
      VALUES ($1, NULL, $2, 0, 0, 0, $3, $4, $5, $6) RETURNING *`,
      [supplier_id, notes || 'Payment', paid, -paid, finalModule, req.user.id]
    );

    // 2. Update Supplier Balance
    // NOTE: We paid them, so we owe them LESS. We subtract from balance.
    await client.query(
      `UPDATE suppliers SET balance = balance - $1 WHERE id = $2`,
      [paid, supplier_id]
    );

    await client.query('COMMIT');
    res.json(paymentRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Supplier Payment Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;

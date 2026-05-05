const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all purchases/payments for all suppliers (Summary)
router.get('/ledger/all', auth, async (req, res) => {
  try {
    let query = `
      SELECT p.*, pr.name as product_name, pr.unit, pr.brand, s.name as supplier_name
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
    `;
    let params = [];

    if (!isAdmin(req)) {
      query += ' WHERE p.module_type = $1';
      params.push(req.user.module_type || 'Retail 1');
    }

    query += ' ORDER BY p.purchase_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all purchases for a specific supplier (Ledger)
router.get('/supplier/:supplierId', auth, async (req, res) => {
  try {
    const { type, from, to } = req.query;
    let query = `
      SELECT p.*, pr.name as product_name, pr.unit, pr.brand 
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.supplier_id = $1
    `;
    let params = [req.params.supplierId];

    let pIdx = 2;
    if (!isAdmin(req)) {
      query += ` AND p.module_type = $${pIdx++}`;
      params.push(req.user.module_type || 'Retail 1');
    } else if (type) {
      query += ` AND p.module_type = $${pIdx++}`;
      params.push(type);
    }

    if (from && to) {
      query += ` AND p.purchase_date >= $${pIdx++} AND p.purchase_date <= $${pIdx++}`;
      params.push(from + " 00:00:00", to + " 23:59:59");
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
    const { 
      supplier_id, product_id, vehicle_number, quantity, rate, 
      paid_amount, module_type, vehicle_id, delivery_charges, fare_payment_type 
    } = req.body;
    
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const fare = parseFloat(delivery_charges) || 0;
    const totalAmount = qty * rt;
    const balanceAmount = totalAmount - paid;
    
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    // Find vehicle_id if not provided but number is present
    let vId = vehicle_id;
    if (!vId && vehicle_number) {
      const vRes = await client.query('SELECT id FROM vehicles WHERE vehicle_number = $1 LIMIT 1', [vehicle_number]);
      if (vRes.rows.length > 0) vId = vRes.rows[0].id;
    }

    // 1. Insert Purchase Record
    const purchaseRes = await client.query(
      `INSERT INTO purchases 
      (supplier_id, product_id, vehicle_number, vehicle_id, quantity, rate, total_amount, paid_amount, balance_amount, delivery_charges, fare_payment_type, module_type, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [supplier_id, product_id, vehicle_number, vId || null, qty, rt, totalAmount, paid, balanceAmount, fare, fare_payment_type || 'Cash', finalModule, req.user.id]
    );

    // 2. Update Product Stock
    await client.query(
      `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2`,
      [qty, product_id]
    );

    // 3. Update Supplier Balance
    await client.query(
      `UPDATE suppliers SET balance = balance + $1 WHERE id = $2`,
      [balanceAmount, supplier_id]
    );

    // 4. Update Vehicle Earnings (if vehicle_id provided)
    if (vehicle_id && fare > 0) {
      await client.query(
        `UPDATE vehicles SET total_earnings = total_earnings + $1 WHERE id = $2`,
        [fare, vehicle_id]
      );

      // 5. Automatically record as an Expense
      await client.query(
        `INSERT INTO expenses (description, amount, expense_type, user_id, module_type, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          `Transport Fare (Vehicle: ${vehicle_number}) for Stock Purchase`,
          fare,
          'Transport',
          req.user.id,
          finalModule
        ]
      );
    }

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

// Update a specific purchase entry (from Ledger)
router.post('/update-ledger-entry', auth, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Only admins can edit ledger entries' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { purchase_id, new_qty, new_rate } = req.body;

    // 1. Get original purchase details
    const oldRes = await client.query('SELECT * FROM purchases WHERE id = $1', [purchase_id]);
    if (oldRes.rows.length === 0) throw new Error('Purchase not found');
    const { quantity: old_qty, total_amount: old_total, supplier_id, product_id } = oldRes.rows[0];

    // 2. Calculate new totals
    const n_qty = parseFloat(new_qty);
    const n_rate = parseFloat(new_rate);
    const new_total = n_qty * n_rate;
    const total_diff = new_total - parseFloat(old_total);
    const qty_diff = n_qty - parseFloat(old_qty);

    // 3. Update purchases record
    await client.query(
      'UPDATE purchases SET quantity = $1, rate = $2, total_amount = $3, balance_amount = balance_amount + $4 WHERE id = $5',
      [n_qty, n_rate, new_total, total_diff, purchase_id]
    );

    // 4. Update Supplier Balance
    if (supplier_id) {
      await client.query(
        'UPDATE suppliers SET balance = balance + $1 WHERE id = $2',
        [total_diff, supplier_id]
      );
    }

    // 5. Adjust Product Stock
    if (product_id) {
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [qty_diff, product_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;

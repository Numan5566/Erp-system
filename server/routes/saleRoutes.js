const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all sales (with isolation)
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query; // e.g. ?type=Wholesale
    let query = 'SELECT * FROM sales';
    let params = [];

    if (!isAdmin(req)) {
      query += ' WHERE sale_type=$1';
      params.push(req.user.module_type || 'Retail 1');
    } else if (type) {
      query += ' WHERE sale_type=$1';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new sale (Bill)
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      customer_name, customer_phone, total_amount, discount, 
      delivery_charges, net_amount, paid_amount, balance_amount, 
      payment_type, items, sale_type, vehicle_type, vehicle_id 
    } = req.body;

    const finalModule = isAdmin(req) ? (sale_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    // 0. Auto-Create or find Customer
    let finalCustomerId = null;
    if (customer_name && customer_name.trim().toLowerCase() !== 'walk-in customer') {
      let cQuery = 'SELECT id FROM customers WHERE name=$1 AND module_type=$2';
      let cParams = [customer_name, finalModule];
      if (customer_phone) { cQuery += ' AND phone=$3'; cParams.push(customer_phone); }
      
      let c = await client.query(cQuery, cParams);
      if (c.rows.length > 0) {
        finalCustomerId = c.rows[0].id;
        // Optionally update address if provided
        if (req.body.customer_address) {
          await client.query('UPDATE customers SET address=$1 WHERE id=$2', [req.body.customer_address, finalCustomerId]);
        }
      } else {
        const newCust = await client.query(
          'INSERT INTO customers (name, phone, address, balance, user_id, module_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [customer_name, customer_phone || '', req.body.customer_address || '', 0, req.user.id, finalModule]
        );
        finalCustomerId = newCust.rows[0].id;
      }
    }

    // 1. Insert into sales table
    const saleResult = await client.query(
      `INSERT INTO sales 
      (customer_id, customer_name, customer_phone, customer_address, total_amount, discount, delivery_charges, net_amount, paid_amount, balance_amount, payment_type, sale_type, user_id, vehicle_id, items) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [finalCustomerId, customer_name, customer_phone || '', req.body.customer_address || '', total_amount, discount, delivery_charges, net_amount, paid_amount, balance_amount, payment_type, finalModule, req.user.id, vehicle_id, JSON.stringify(items)]
    );
    const saleId = saleResult.rows[0].id;

    // 2. Insert items and update stock
    for (const item of items) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, product_name, qty, rate, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [saleId, item.product_id, item.product_name, item.qty, item.rate, item.subtotal]
      );

      // Deduct stock (Defaulting to retail stock for now, can be changed based on logic)
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.qty, item.product_id]
      );
    }

    // 3. Update customer balance if it's a credit sale
    if (finalCustomerId && balance_amount !== 0) {
      await client.query(
        'UPDATE customers SET balance = balance + $1 WHERE id = $2',
        [balance_amount, finalCustomerId]
      );
    }

    // 4. Automatic Transport Earnings Update if vehicle is selected
    if (vehicle_type && vehicle_id) {
      const fareAmount = parseFloat(delivery_charges) || 0;
      await client.query(
        `UPDATE vehicles SET total_earnings = total_earnings + $1 WHERE id = $2`,
        [fareAmount, vehicle_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, saleId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sale Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get sale details with items
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await pool.query('SELECT * FROM sales WHERE id = $1 AND (user_id = $2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    if (sale.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    
    const items = await pool.query('SELECT * FROM sale_items WHERE sale_id = $1', [req.params.id]);
    res.json({ ...sale.rows[0], items: items.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get customer ledger
router.get('/ledger/:customerId', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT s.*, 
      (SELECT JSON_AGG(si) FROM (
        SELECT si.product_name as name, p.brand 
        FROM sale_items si 
        LEFT JOIN products p ON si.product_id = p.id 
        WHERE si.sale_id = s.id
      ) si) as legacy_items
      FROM sales s 
      WHERE s.customer_id = $1`;
    let params = [req.params.customerId];

    if (from && to) {
      query += ` AND s.created_at >= $2 AND s.created_at <= $3`;
      params.push(from + " 00:00:00", to + " 23:59:59");
    }

    query += ' ORDER BY s.created_at DESC';
    const ledger = await pool.query(query, params);
    res.json(ledger.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Receive Payment from Customer
router.post('/payment', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_id, amount, payment_reference, payment_type, module_type } = req.body;
    
    // Decrease Customer Balance
    await client.query(
      'UPDATE customers SET balance = balance - $1 WHERE id = $2',
      [amount, customer_id]
    );

    // Get customer name
    const cust = await client.query('SELECT name FROM customers WHERE id=$1', [customer_id]);
    const custName = cust.rows[0]?.name || 'Unknown';

    // Insert Payment Record as a Sale with net_amount=0
    await client.query(
      `INSERT INTO sales 
      (customer_id, customer_name, total_amount, net_amount, paid_amount, balance_amount, payment_type, sale_type, user_id) 
      VALUES ($1, $2, 0, 0, $3, $4, $5, $6, $7)`,
      [customer_id, custName, amount, -amount, payment_reference || payment_type || 'Cash', module_type, req.user.id]
    );

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

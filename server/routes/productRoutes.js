const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM products ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM products WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { 
    console.error('Product Route Error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Add a product
router.post('/', auth, async (req, res) => {
  try {
    const { 
      name, brand, category, unit, price, cost_price, 
      stock_quantity, minimum_stock, description, image_url 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products 
      (name, brand, category, unit, price, cost_price, stock_quantity, minimum_stock, description, image_url, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name, brand, category, unit, price || 0, cost_price || 0, 
        stock_quantity || 0, minimum_stock || 0, description, image_url, req.user.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { 
    console.error('Product Route Error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      name, brand, category, unit, price, cost_price, 
      stock_quantity, minimum_stock, description, image_url 
    } = req.body;

    const result = await pool.query(
      `UPDATE products SET 
        name=$1, brand=$2, category=$3, unit=$4, price=$5, cost_price=$6, 
        stock_quantity=$7, minimum_stock=$8, description=$9, image_url=$10 
      WHERE id=$11 AND (user_id=$12 OR $13) RETURNING *`,
      [
        name, brand, category, unit, price, cost_price, 
        stock_quantity, minimum_stock, description, image_url, 
        req.params.id, req.user.id, isAdmin(req)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { 
    console.error('Product Route Error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Delete a product
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Product Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

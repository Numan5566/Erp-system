const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const result = isAdmin(req)
      ? await pool.query('SELECT * FROM transport ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM transport WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { 
      vehicle_number, driver_name, customer_name, destination, 
      fare_amount, expense_amount, transport_date, status 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO transport 
      (vehicle_number, driver_name, customer_name, destination, fare_amount, expense_amount, transport_date, status, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        vehicle_number, driver_name, customer_name, destination, 
        fare_amount || 0, expense_amount || 0, transport_date, status || 'Pending', req.user.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      vehicle_number, driver_name, customer_name, destination, 
      fare_amount, expense_amount, transport_date, status 
    } = req.body;

    const result = await pool.query(
      `UPDATE transport SET 
        vehicle_number=$1, driver_name=$2, customer_name=$3, destination=$4, 
        fare_amount=$5, expense_amount=$6, transport_date=$7, status=$8 
      WHERE id=$9 AND (user_id=$10 OR $11) RETURNING *`,
      [
        vehicle_number, driver_name, customer_name, destination, 
        fare_amount, expense_amount, transport_date, status, 
        req.params.id, req.user.id, isAdmin(req)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM transport WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Transport Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

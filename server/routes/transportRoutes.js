const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM transport';
    let params = [];

    if (isAdmin(req)) {
      if (type) {
        query += ' WHERE module_type = $1';
        params.push(type);
      }
    } else {
      query += ' WHERE module_type = $1';
      params.push(req.user.module_type || 'Retail 1');
    }

    query += ' ORDER BY transport_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { 
      vehicle_type, vehicle_number, driver_name, customer_name, 
      destination, fare_amount, expense_amount, pending_payment, 
      trips, transport_date, status, module_type 
    } = req.body;
    
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    const result = await pool.query(
      `INSERT INTO transport 
      (vehicle_type, vehicle_number, driver_name, customer_name, destination, fare_amount, expense_amount, pending_payment, trips, transport_date, status, user_id, module_type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        vehicle_type, vehicle_number, driver_name, customer_name, 
        destination, fare_amount || 0, expense_amount || 0, pending_payment || 0, 
        trips || 1, transport_date, status || 'Pending', req.user.id, finalModule
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      vehicle_type, vehicle_number, driver_name, customer_name, 
      destination, fare_amount, expense_amount, pending_payment, 
      trips, transport_date, status 
    } = req.body;

    const result = await pool.query(
      `UPDATE transport SET 
        vehicle_type=$1, vehicle_number=$2, driver_name=$3, customer_name=$4, 
        destination=$5, fare_amount=$6, expense_amount=$7, pending_payment=$8, 
        trips=$9, transport_date=$10, status=$11 
      WHERE id=$12 AND (user_id=$13 OR $14) RETURNING *`,
      [
        vehicle_type, vehicle_number, driver_name, customer_name, 
        destination, fare_amount, expense_amount, pending_payment, 
        trips, transport_date, status, req.params.id, req.user.id, isAdmin(req)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM transport WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

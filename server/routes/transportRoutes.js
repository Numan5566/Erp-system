const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get all vehicles
router.get('/', auth, async (req, res) => {
  try {
    const { type, ownership_type } = req.query; // ownership_type = 'Personal' or 'Rent'
    let query = 'SELECT * FROM vehicles';
    let params = [];
    let conditions = [];

    if (isAdmin(req)) {
      if (type) {
        params.push(type);
        conditions.push(`module_type = $${params.length}`);
      }
    } else {
      params.push(req.user.module_type || 'Retail 1');
      conditions.push(`module_type = $${params.length}`);
    }

    if (ownership_type) {
      params.push(ownership_type);
      conditions.push(`ownership_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add new vehicle
router.post('/', auth, async (req, res) => {
  try {
    const { 
      ownership_type, vehicle_number, driver_name, 
      driver_cnic, driver_phone, module_type 
    } = req.body;
    
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');

    const result = await pool.query(
      `INSERT INTO vehicles 
      (ownership_type, vehicle_number, driver_name, driver_cnic, driver_phone, total_earnings, user_id, module_type) 
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7) RETURNING *`,
      [ownership_type, vehicle_number, driver_name, driver_cnic, driver_phone, req.user.id, finalModule]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update vehicle
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      ownership_type, vehicle_number, driver_name, 
      driver_cnic, driver_phone 
    } = req.body;

    const result = await pool.query(
      `UPDATE vehicles SET 
        ownership_type=$1, vehicle_number=$2, driver_name=$3, driver_cnic=$4, driver_phone=$5
      WHERE id=$6 AND (user_id=$7 OR $8) RETURNING *`,
      [
        ownership_type, vehicle_number, driver_name, driver_cnic, driver_phone, 
        req.params.id, req.user.id, isAdmin(req)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete vehicle
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

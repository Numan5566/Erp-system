const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM salary';
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

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { 
      employee_name, designation, cnic, amount, salary_amount,
      advance_salary, joining_date, payment_date, status, notes, module_type 
    } = req.body;
    
    const finalAmount = salary_amount || amount || 0;
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');
    // month is required NOT NULL — derive from payment_date or use current month
    const month = payment_date 
      ? new Date(payment_date).toLocaleString('default', { month: 'long', year: 'numeric' }) 
      : new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const result = await pool.query(
      `INSERT INTO salary 
      (employee_name, designation, cnic, amount, advance_salary, joining_date, payment_date, month, status, notes, user_id, module_type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        employee_name, designation, cnic, finalAmount, advance_salary || 0, 
        joining_date, payment_date, month, status || 'Paid', notes, req.user.id, finalModule
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      employee_name, designation, cnic, amount, salary_amount,
      advance_salary, joining_date, payment_date, status, notes 
    } = req.body;

    const finalAmount = salary_amount || amount || 0;
    const month = payment_date 
      ? new Date(payment_date).toLocaleString('default', { month: 'long', year: 'numeric' }) 
      : new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const result = await pool.query(
      `UPDATE salary SET 
        employee_name=$1, designation=$2, cnic=$3, amount=$4, advance_salary=$5, 
        joining_date=$6, payment_date=$7, month=$8, status=$9, notes=$10 
      WHERE id=$11 AND (user_id=$12 OR $13) RETURNING *`,
      [
        employee_name, designation, cnic, finalAmount, advance_salary, 
        joining_date, payment_date, month, status, notes, req.params.id, req.user.id, isAdmin(req)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM salary WHERE id=$1 AND (user_id=$2 OR $3)', [req.params.id, req.user.id, isAdmin(req)]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

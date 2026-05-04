const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Helper: get sum with optional date range
const getSum = async (table, amountCol, moduleType, moduleCol, dateCol, fromDate, toDate) => {
  let conditions = [];
  let params = [];

  if (moduleType) {
    params.push(moduleType);
    conditions.push(`${moduleCol} = $${params.length}`);
  }
  if (fromDate) {
    params.push(fromDate);
    conditions.push(`${dateCol} >= $${params.length}`);
  }
  if (toDate) {
    params.push(toDate);
    conditions.push(`${dateCol} <= $${params.length}`);
  }

  const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
  const query = `SELECT COALESCE(SUM(${amountCol}), 0) as total FROM ${table}${where}`;
  const result = await pool.query(query, params);
  return parseFloat(result.rows[0].total || 0);
};

// Build summary for all counters with date range
const buildSummary = async (fromDate, toDate) => {
  const counters = ['Wholesale', 'Retail 1', 'Retail 2'];
  const summary = {};

  for (const c of counters) {
    const sales    = await getSum('sales',          'net_amount', c, 'sale_type',    'created_at',   fromDate, toDate);
    const expenses = await getSum('expenses',       'amount',     c, 'module_type',  'created_at',   fromDate, toDate);
    const rent     = await getSum('rent',           'amount',     c, 'module_type',  'rent_date',    fromDate, toDate);
    const salary   = await getSum('salary',         'amount',     c, 'module_type',  'payment_date', fromDate, toDate);
    const other    = await getSum('other_expenses', 'amount',     c, 'module_type',  'date',         fromDate, toDate);
    const investment = await getSum('investment',   'amount',     c, 'module_type',  'date',         fromDate, toDate);

    const totalExpenses = expenses + rent + salary + other;
    summary[c] = { sales, expenses, rent, salary, other, investment, totalExpenses, netProfit: sales - totalExpenses };
  }
  return summary;
};

// GET /api/profit/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const summary = await buildSummary(from || null, to || null);
    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/profit/detail/:counter?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/detail/:counter', auth, async (req, res) => {
  try {
    const c = decodeURIComponent(req.params.counter);
    const { from, to } = req.query;

    const dateFilter = (col) => {
      let conds = [`${col} IS NOT NULL`];
      let p = [c];
      if (from) { p.push(from); conds.push(`${col} >= $${p.length}`); }
      if (to)   { p.push(to);   conds.push(`${col} <= $${p.length}`); }
      return { p, conds };
    };

    // Sales
    const sf = dateFilter('s.created_at');
    const salesRes = await pool.query(
      `SELECT id, customer_name, net_amount, paid_amount, balance_amount, payment_type, created_at
       FROM sales s WHERE sale_type = $1 ${from ? `AND created_at >= $2` : ''} ${to ? `AND created_at <= $${from ? 3 : 2}` : ''}
       ORDER BY created_at DESC LIMIT 100`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    // Expenses
    const expensesRes = await pool.query(
      `SELECT id, description, amount, created_at as expense_date, expense_type FROM expenses WHERE module_type = $1
       ${from ? `AND created_at >= $2` : ''} ${to ? `AND created_at <= $${from ? 3 : 2}` : ''}
       ORDER BY created_at DESC LIMIT 50`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    // Rent
    const rentRes = await pool.query(
      `SELECT id, property_name, landlord_name, amount, rent_date, status FROM rent WHERE module_type = $1
       ${from ? `AND rent_date >= $2` : ''} ${to ? `AND rent_date <= $${from ? 3 : 2}` : ''}
       ORDER BY rent_date DESC LIMIT 50`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    // Salary
    const salaryRes = await pool.query(
      `SELECT id, employee_name, designation, amount, payment_date, status FROM salary WHERE module_type = $1
       ${from ? `AND payment_date >= $2` : ''} ${to ? `AND payment_date <= $${from ? 3 : 2}` : ''}
       ORDER BY payment_date DESC LIMIT 50`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    // Other expenses
    const otherRes = await pool.query(
      `SELECT id, title, category, amount, date, payment_method FROM other_expenses WHERE module_type = $1
       ${from ? `AND date >= $2` : ''} ${to ? `AND date <= $${from ? 3 : 2}` : ''}
       ORDER BY date DESC LIMIT 50`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    // Investments
    const investRes = await pool.query(
      `SELECT id, title, investor, amount, date FROM investment WHERE module_type = $1
       ${from ? `AND date >= $2` : ''} ${to ? `AND date <= $${from ? 3 : 2}` : ''}
       ORDER BY date DESC LIMIT 30`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    // Top products
    const productsRes = await pool.query(
      `SELECT si.product_name, SUM(si.qty) as total_qty, SUM(si.subtotal) as total_revenue
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.sale_type = $1 ${from ? `AND s.created_at >= $2` : ''} ${to ? `AND s.created_at <= $${from ? 3 : 2}` : ''}
       GROUP BY si.product_name ORDER BY total_revenue DESC LIMIT 10`,
      [c, ...(from ? [from] : []), ...(to ? [to] : [])]
    );

    res.json({
      counter: c,
      sales: salesRes.rows,
      expenses: expensesRes.rows,
      rent: rentRes.rows,
      salary: salaryRes.rows,
      other: otherRes.rows,
      investments: investRes.rows,
      topProducts: productsRes.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

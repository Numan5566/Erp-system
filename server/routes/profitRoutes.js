const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.get('/summary', auth, async (req, res) => {
  try {
    const { type } = req.query; // If type is provided, filter by it. If not, return global (for admin).
    
    const getSum = async (table, dateCol = 'created_at', amountCol = 'amount', moduleType = null) => {
      let query = `SELECT SUM(${amountCol}) as total FROM ${table}`;
      let params = [];
      if (moduleType) {
        const moduleCol = table === 'sales' ? 'sale_type' : 'module_type';
        query += ` WHERE ${moduleCol} = $1`;
        params.push(moduleType);
      }
      const result = await pool.query(query, params);
      return parseFloat(result.rows[0].total || 0);
    };

    const counters = ['Wholesale', 'Retail 1', 'Retail 2'];
    const summary = {};

    for (const c of counters) {
      summary[c] = {
        sales: await getSum('sales', 'sale_date', 'total_amount', c),
        expenses: await getSum('expenses', 'expense_date', 'amount', c),
        rent: await getSum('rent', 'rent_date', 'amount', c),
        salary: await getSum('salary', 'payment_date', 'amount', c),
        other: await getSum('other_expenses', 'date', 'amount', c),
      };
      summary[c].totalExpenses = summary[c].expenses + summary[c].rent + summary[c].salary + summary[c].other;
      summary[c].netProfit = summary[c].sales - summary[c].totalExpenses;
    }

    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

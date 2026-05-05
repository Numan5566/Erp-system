const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';

// Get real-time balances for all accounts
router.get('/balances', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';

    // 1. Fetch bank accounts opening balances
    let accountsQ = 'SELECT bank_name, opening_balance FROM bank_accounts';
    let params = [];
    if (!isAdminUser) {
      accountsQ += ' WHERE user_id = $1';
      params.push(userId);
    }
    const accountsRes = await pool.query(accountsQ, params);
    
    const balances = { 'Cash': 0 };
    accountsRes.rows.forEach(acc => {
      let name = acc.bank_name.replace(' Account', '');
      if (name.toLowerCase() === 'cash') name = 'Cash';
      balances[name] = parseFloat(acc.opening_balance) || 0;
    });

    // 2. Fetch sales
    let salesQ = 'SELECT net_amount, paid_amount, payment_type FROM sales';
    let salesParams = [];
    if (!isAdminUser) {
      salesQ += ' WHERE user_id = $1';
      salesParams.push(userId);
    }
    const salesRes = await pool.query(salesQ, salesParams);
    salesRes.rows.forEach(s => {
      let method = s.payment_type || 'Cash';
      let cleanMethod = method.replace('Bank - ', '');
      if (cleanMethod === 'Cash Account' || cleanMethod.toLowerCase() === 'cash') {
        cleanMethod = 'Cash';
      }
      if (!balances[cleanMethod]) balances[cleanMethod] = 0;
      balances[cleanMethod] += parseFloat(s.paid_amount) || 0;
    });

    // 3. Fetch purchases & supplier payments
    let purchasesQ = 'SELECT paid_amount, payment_type FROM purchases';
    let purchasesParams = [];
    if (!isAdminUser) {
      purchasesQ += ' WHERE user_id = $1';
      purchasesParams.push(userId);
    }
    const purchasesRes = await pool.query(purchasesQ, purchasesParams);
    purchasesRes.rows.forEach(p => {
      let method = p.payment_type || 'Cash';
      let cleanMethod = method.replace('Bank - ', '');
      if (cleanMethod === 'Cash Account' || cleanMethod.toLowerCase() === 'cash') {
        cleanMethod = 'Cash';
      }
      if (!balances[cleanMethod]) balances[cleanMethod] = 0;
      balances[cleanMethod] -= parseFloat(p.paid_amount) || 0;
    });

    // 4. Fetch expenses
    let expensesQ = 'SELECT amount, payment_type FROM expenses';
    let expensesParams = [];
    if (!isAdminUser) {
      expensesQ += ' WHERE user_id = $1';
      expensesParams.push(userId);
    }
    const expensesRes = await pool.query(expensesQ, expensesParams);
    expensesRes.rows.forEach(e => {
      let method = e.payment_type || 'Cash';
      let cleanMethod = method.replace('Bank - ', '');
      if (cleanMethod === 'Cash Account' || cleanMethod.toLowerCase() === 'cash') {
        cleanMethod = 'Cash';
      }
      if (!balances[cleanMethod]) balances[cleanMethod] = 0;
      balances[cleanMethod] -= parseFloat(e.amount) || 0;
    });

    // 5. Fetch salaries
    let salariesQ = 'SELECT amount FROM salary';
    let salariesParams = [];
    if (!isAdminUser) {
      salariesQ += ' WHERE user_id = $1';
      salariesParams.push(userId);
    }
    const salariesRes = await pool.query(salariesQ, salariesParams);
    salariesRes.rows.forEach(s => {
      balances['Cash'] -= parseFloat(s.amount) || 0;
    });

    // 6. Fetch rents
    let rentsQ = 'SELECT amount FROM rent';
    let rentsParams = [];
    if (!isAdminUser) {
      rentsQ += ' WHERE user_id = $1';
      rentsParams.push(userId);
    }
    const rentsRes = await pool.query(rentsQ, rentsParams);
    rentsRes.rows.forEach(r => {
      balances['Cash'] -= parseFloat(r.amount) || 0;
    });

    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all banks
router.get('/', auth, async (req, res) => {
  try {
    let result;
    if (req.user.email === 'admin@erp.com') {
      // Master Admin sees ALL banks
      result = await pool.query('SELECT * FROM bank_accounts ORDER BY id ASC');
    } else {
      // Everyone else sees their own banks, those added for their shop, AND all Admin bank accounts so they can select them as Galla recipients!
      result = await pool.query(
        'SELECT * FROM bank_accounts WHERE user_id = $1 OR module_type = $2 OR user_id IN (SELECT id FROM users WHERE role = \'admin\') ORDER BY id ASC',
        [req.user.id, req.user.module_type || 'Retail 1']
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a bank
router.post('/', auth, async (req, res) => {
  try {
    const { bank_name, account_title, account_number, opening_balance, module_type, is_admin_recipient } = req.body;
    const finalModule = isAdmin(req) ? (module_type || 'Wholesale') : (req.user.module_type || 'Retail 1');
    
    let targetUserId = req.user.id;
    let targetModule = finalModule;
    
    if (is_admin_recipient) {
      const adminRes = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      if (adminRes.rows.length > 0) {
        targetUserId = adminRes.rows[0].id;
        targetModule = 'Admin Recipient';
      }
    }

    const result = await pool.query(
      'INSERT INTO bank_accounts (bank_name, account_title, account_number, opening_balance, user_id, module_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [bank_name, account_title, account_number, opening_balance || 0, targetUserId, targetModule]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a bank account
router.put('/:id', auth, async (req, res) => {
  try {
    const { bank_name, account_title, account_number, opening_balance } = req.body;
    const result = await pool.query(
      'UPDATE bank_accounts SET bank_name=$1, account_title=$2, account_number=$3, opening_balance=$4 WHERE id=$5 AND (user_id=$6 OR $7) RETURNING *',
      [bank_name, account_title, account_number, opening_balance, req.params.id, req.user.id, isAdmin(req)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a bank
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      await pool.query('DELETE FROM bank_accounts WHERE id=$1', [req.params.id]);
    } else {
      await pool.query('DELETE FROM bank_accounts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    }
    res.json({ message: 'Bank deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Balance for a payment method
router.get('/balance/:method', auth, async (req, res) => {
  try {
    const { method } = req.params;
    const { module_type } = req.query;
    const finalModule = module_type || req.user.module_type || 'Wholesale';
    const searchPattern = method === 'Cash' ? 'Cash' : `%${method}%`;
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';

    let salesQ = "SELECT SUM(paid_amount) FROM sales WHERE payment_type LIKE $1 AND sale_type = $2";
    let salesParams = [searchPattern, finalModule];
    if (!isAdminUser) {
      salesQ += " AND user_id = $3";
      salesParams.push(userId);
    }
    const salesSum = await pool.query(salesQ, salesParams);

    let expQ = "SELECT SUM(amount) FROM expenses WHERE payment_type LIKE $1 AND module_type = $2";
    let expParams = [searchPattern, finalModule];
    if (!isAdminUser) {
      expQ += " AND user_id = $3";
      expParams.push(userId);
    }
    const expSum = await pool.query(expQ, expParams);
    
    let supPaid = 0;
    if (method === 'Cash') {
      let supQ = "SELECT SUM(paid_amount) FROM purchases WHERE module_type = $1";
      let supParams = [finalModule];
      if (!isAdminUser) {
        supQ += " AND user_id = $2";
        supParams.push(userId);
      }
      const supSum = await pool.query(supQ, supParams);
      supPaid = parseFloat(supSum.rows[0].sum || 0);
    } else {
      let supQ = "SELECT SUM(delivery_charges) FROM purchases WHERE fare_payment_type LIKE $1 AND module_type = $2";
      let supParams = [searchPattern, finalModule];
      if (!isAdminUser) {
        supQ += " AND user_id = $3";
        supParams.push(userId);
      }
      const poolRes = await pool.query(supQ, supParams);
      supPaid = parseFloat(poolRes.rows[0].sum || 0);
    }
    
    let openingBal = 0;
    if (method === 'Cash') {
       let bankQ = "SELECT SUM(opening_balance) FROM bank_accounts WHERE bank_name ILIKE '%Cash%'";
       let bankParams = [];
       if (!isAdminUser) {
         bankQ += " AND user_id = $1";
         bankParams.push(userId);
       }
       const bankRes = await pool.query(bankQ, bankParams);
       openingBal = parseFloat(bankRes.rows[0].sum || 0);
    } else {
       let bankQ = "SELECT SUM(opening_balance) FROM bank_accounts WHERE bank_name = $1";
       let bankParams = [method];
       if (!isAdminUser) {
         bankQ += " AND user_id = $2";
         bankParams.push(userId);
       }
       const bankRes = await pool.query(bankQ, bankParams);
       openingBal = parseFloat(bankRes.rows[0].sum || 0);
    }
    
    const balance = (parseFloat(salesSum.rows[0].sum || 0) + openingBal) - 
                    (parseFloat(expSum.rows[0].sum || 0) + supPaid);
                    
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register Closeout / Galla Transfer
router.post('/closeout', auth, async (req, res) => {
  try {
    const { amount_sent_to_admin, amount_kept_as_opening, notes } = req.body;
    const userId = req.user.id;
    const moduleType = req.user.module_type || 'Retail 1';

    // Insert closeout expense to deduct cash balance by the amount sent to Admin
    const result = await pool.query(
      `INSERT INTO expenses (description, expense_type, category, amount, payment_type, expense_date, notes, user_id, module_type) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8) RETURNING *`,
      [
        `Daily Galla Closeout: Handover to Admin`,
        'Galla Closeout',
        'Handover',
        amount_sent_to_admin,
        'Cash',
        notes || `Galla cleared. Opening balance Rs. ${amount_kept_as_opening} kept for tomorrow.`,
        userId,
        moduleType
      ]
    );

    res.json({ message: 'Register closed out successfully!', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
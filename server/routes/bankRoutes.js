const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const isAdmin = (req) => req.user.role === 'admin';
const isMasterAdmin = (req) => req.user.role === 'admin' && req.user.email === 'admin@erp.com';

// Get real-time balances for all accounts
router.get('/balances', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';
    const targetModule = req.query.type || req.user.module_type || 'Wholesale';

    // 1. Fetch bank accounts opening balances
    let accountsQ = 'SELECT bank_name, opening_balance FROM bank_accounts';
    let params = [];
    if (!isAdminUser) {
      accountsQ += ' WHERE user_id = $1 OR module_type = $2';
      params.push(userId, targetModule);
    } else {
      accountsQ += ' WHERE module_type = $1';
      params.push(targetModule);
    }
    const accountsRes = await pool.query(accountsQ, params);
    
    const balances = { 'Cash': 0 };
    accountsRes.rows.forEach(acc => {
      let name = acc.bank_name.replace(' Account', '');
      if (name.toLowerCase() === 'cash') name = 'Cash';
      balances[name] = parseFloat(acc.opening_balance) || 0;
    });

    // 2. Fetch sales
    let salesQ = 'SELECT net_amount, paid_amount, payment_type FROM sales WHERE sale_type = $1';
    const salesRes = await pool.query(salesQ, [targetModule]);
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
    let purchasesQ = 'SELECT paid_amount, payment_type FROM purchases WHERE module_type = $1';
    const purchasesRes = await pool.query(purchasesQ, [targetModule]);
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
    let expensesQ = 'SELECT amount, payment_type, expense_type FROM expenses WHERE module_type = $1';
    const expensesRes = await pool.query(expensesQ, [targetModule]);
    expensesRes.rows.forEach(e => {
      let method = e.payment_type || 'Cash';
      let cleanMethod = method.replace('Bank - ', '');
      if (cleanMethod === 'Cash Account' || cleanMethod.toLowerCase() === 'cash') {
        cleanMethod = 'Cash';
      }
      if (!balances[cleanMethod]) balances[cleanMethod] = 0;
      if (e.expense_type === 'Admin Payment') {
        balances[cleanMethod] += parseFloat(e.amount) || 0;
      } else {
        balances[cleanMethod] -= parseFloat(e.amount) || 0;
      }
    });

    // 5. Fetch actual salaries paid from salary_payments
    let salariesQ = 'SELECT amount, payment_type FROM salary_payments WHERE module_type = $1';
    const salariesRes = await pool.query(salariesQ, [targetModule]);
    salariesRes.rows.forEach(s => {
      let method = s.payment_type || 'Cash';
      let cleanMethod = method.replace('Bank - ', '');
      if (cleanMethod === 'Cash Account' || cleanMethod.toLowerCase() === 'cash') {
        cleanMethod = 'Cash';
      }
      if (!balances[cleanMethod]) balances[cleanMethod] = 0;
      balances[cleanMethod] -= parseFloat(s.amount) || 0;
    });


    // 6. Fetch rents
    let rentsQ = 'SELECT amount FROM rent WHERE module_type = $1';
    const rentsRes = await pool.query(rentsQ, [targetModule]);
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
    const includeRecipients = req.query.include_recipients === 'true';
    let result;
    if (req.user.email === 'admin@erp.com') {
      // Master Admin sees ALL banks
      if (includeRecipients) {
        result = await pool.query('SELECT * FROM bank_accounts ORDER BY id ASC');
      } else {
        result = await pool.query('SELECT * FROM bank_accounts WHERE module_type IS NULL OR module_type != \'Admin Recipient\' ORDER BY id ASC');
      }
    } else {
      // Everyone else sees their own banks, those added for their shop
      if (includeRecipients) {
        result = await pool.query(
          'SELECT * FROM bank_accounts WHERE user_id = $1 OR module_type = $2 OR module_type = \'Admin Recipient\' ORDER BY id ASC',
          [req.user.id, req.user.module_type || 'Retail 1']
        );
      } else {
        result = await pool.query(
          'SELECT * FROM bank_accounts WHERE (user_id = $1 OR module_type = $2) AND (module_type IS NULL OR module_type != \'Admin Recipient\') ORDER BY id ASC',
          [req.user.id, req.user.module_type || 'Retail 1']
        );
      }
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

    const finalOpeningBalance = isAdmin(req) ? (opening_balance || 0) : 0;

    const result = await pool.query(
      'INSERT INTO bank_accounts (bank_name, account_title, account_number, opening_balance, user_id, module_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [bank_name, account_title, account_number, finalOpeningBalance, targetUserId, targetModule]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a bank account
router.put('/:id', auth, async (req, res) => {
  try {
    const { bank_name, account_title, account_number, opening_balance, module_type } = req.body;
    let result;
    if (isAdmin(req)) {
      result = await pool.query(
        'UPDATE bank_accounts SET bank_name=$1, account_title=$2, account_number=$3, opening_balance=$4, module_type=$5 WHERE id=$6 RETURNING *',
        [bank_name, account_title, account_number, opening_balance || 0, module_type || 'Wholesale', req.params.id]
      );
    } else {
      result = await pool.query(
        'UPDATE bank_accounts SET bank_name=$1, account_title=$2, account_number=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
        [bank_name, account_title, account_number, req.params.id, req.user.id]
      );
    }
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

    let expQ = "SELECT SUM(CASE WHEN expense_type = 'Admin Payment' THEN -amount ELSE amount END) FROM expenses WHERE payment_type LIKE $1 AND module_type = $2";
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

    // 3b. Salary outflows
    let salQ = "SELECT SUM(amount) FROM salary_payments WHERE payment_type LIKE $1 AND module_type = $2";
    let salParams = [searchPattern, finalModule];
    if (!isAdminUser) {
      salQ += " AND user_id = $3";
      salParams.push(userId);
    }
    const salSum = await pool.query(salQ, salParams);
    const totalSalaryPaid = parseFloat(salSum.rows[0].sum || 0);

    
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
                    (parseFloat(expSum.rows[0].sum || 0) + supPaid + totalSalaryPaid);

                    
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register Closeout / Galla Transfer
router.post('/closeout', auth, async (req, res) => {
  try {
    const { amount_sent_to_admin, amount_kept_as_opening, notes, payment_type, module_type } = req.body;
    const userId = req.user.id;
    const moduleType = module_type || req.user.module_type || 'Retail 1';

    // Insert closeout expense to deduct balance by the amount sent to Admin
    const result = await pool.query(
      `INSERT INTO expenses (description, expense_type, category, amount, payment_type, expense_date, notes, user_id, module_type) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8) RETURNING *`,
      [
        `Daily Galla Closeout: Handover to Admin`,
        'Galla Closeout',
        'Handover',
        amount_sent_to_admin,
        payment_type || 'Cash',
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

// Send Admin Payment to Shop
router.post('/admin-payment', auth, async (req, res) => {
  try {
    const { amount, notes, payment_type, module_type } = req.body;
    const userId = req.user.id;
    const moduleType = module_type || req.user.module_type || 'Retail 1';

    const result = await pool.query(
      `INSERT INTO expenses (description, expense_type, category, amount, payment_type, expense_date, notes, user_id, module_type) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8) RETURNING *`,
      [
        `Received Admin Payment`,
        'Admin Payment',
        'Income',
        amount,
        payment_type || 'Cash',
        notes || `Received payment from Admin bank.`,
        userId,
        moduleType
      ]
    );

    res.json({ message: 'Admin payment sent/received successfully!', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
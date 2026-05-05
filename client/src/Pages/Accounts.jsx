import React, { useState, useEffect, useContext, useMemo } from "react";
import { Landmark, Plus, Search, X, Hash, CreditCard } from "lucide-react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

export default function Accounts() {
  const { user } = useContext(AuthContext);

  // State for bank accounts
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ bank_name: "", account_title: "", account_number: "", opening_balance: "" });

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // State for sales (payment overview)
  const [sales, setSales] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [rents, setRents] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);

  // State for active switcher tab (For Admin)
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'Wholesale' : (user?.module_type || 'Wholesale'));

  const filteredAccounts = useMemo(() => {
    if (user?.role === 'admin') {
      return accounts.filter(a => (a.module_type || 'Wholesale') === activeTab);
    }
    return accounts;
  }, [accounts, activeTab, user]);

  const filteredSales = useMemo(() => {
    if (user?.role === 'admin') {
      return sales.filter(s => (s.sale_type || s.module_type || 'Wholesale') === activeTab);
    }
    return sales;
  }, [sales, activeTab, user]);

  const filteredSupplierPayments = useMemo(() => {
    if (user?.role === 'admin') {
      return supplierPayments.filter(p => (p.module_type || 'Wholesale') === activeTab);
    }
    return supplierPayments;
  }, [supplierPayments, activeTab, user]);

  const filteredGeneralExpenses = useMemo(() => {
    if (user?.role === 'admin') {
      return generalExpenses.filter(e => (e.module_type || 'Wholesale') === activeTab);
    }
    return generalExpenses;
  }, [generalExpenses, activeTab, user]);

  const filteredSalaries = useMemo(() => {
    if (user?.role === 'admin') {
      return salaries.filter(s => (s.module_type || 'Wholesale') === activeTab);
    }
    return salaries;
  }, [salaries, activeTab, user]);

  const filteredRents = useMemo(() => {
    if (user?.role === 'admin') {
      return rents.filter(r => (r.module_type || 'Wholesale') === activeTab);
    }
    return rents;
  }, [rents, activeTab, user]);

  const filteredInvestments = useMemo(() => {
    if (user?.role === 'admin') {
      return investments.filter(i => (i.module_type || 'Wholesale') === activeTab);
    }
    return investments;
  }, [investments, activeTab, user]);

  const filteredOtherExpenses = useMemo(() => {
    if (user?.role === 'admin') {
      return otherExpenses.filter(o => (o.module_type || 'Wholesale') === activeTab);
    }
    return otherExpenses;
  }, [otherExpenses, activeTab, user]);


  // State for Ledger view
  const [showLedger, setShowLedger] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [dateFilter, setDateFilter] = useState('All'); // 'Today', 'Week', 'Month', 'All'

  // State for Bill Viewer
  const [showBill, setShowBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // State & Handlers for Galla Closeout
  const [showCloseoutModal, setShowCloseoutModal] = useState(false);
  const [closeoutForm, setCloseoutForm] = useState({
    amount_sent_to_admin: "",
    amount_kept_as_opening: "",
    admin_bank_id: "",
    notes: ""
  });
  const [showAdminBankModal, setShowAdminBankModal] = useState(false);
  const [adminBankForm, setAdminBankForm] = useState({ bank_name: "", account_title: "", account_number: "" });

  const handleAdminBankSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...adminBankForm, opening_balance: 0, is_admin_recipient: true })
      });
      if (res.ok) {
        setShowAdminBankModal(false);
        setAdminBankForm({ bank_name: "", account_title: "", account_number: "" });
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };


  const handleOpenCloseout = () => {
    setCloseoutForm({
      amount_sent_to_admin: totalCash,
      amount_kept_as_opening: "",
      admin_bank_id: "",
      notes: ""
    });
    setShowCloseoutModal(true);
  };


  const handleCloseoutFieldChange = (field, val) => {
    // Strip leading zeroes from the string (e.g. "04" -> "4", "044" -> "44")
    let cleanVal = String(val).replace(/^0+(?=\d)/, '');
    if (cleanVal === '0' && val === '0') {
      cleanVal = '0';
    } else if (cleanVal === '' || isNaN(parseFloat(cleanVal))) {
      setCloseoutForm(prev => ({
        ...prev,
        [field]: "",
        ...(field === 'amount_sent_to_admin' ? { amount_kept_as_opening: totalCash } : { amount_sent_to_admin: totalCash })
      }));
      return;
    }

    const value = parseFloat(cleanVal) || 0;
    if (field === 'amount_sent_to_admin') {
      const kept = Math.max(0, totalCash - value);
      setCloseoutForm(prev => ({ ...prev, amount_sent_to_admin: cleanVal, amount_kept_as_opening: kept === 0 ? "" : kept }));
    } else if (field === 'amount_kept_as_opening') {
      const sent = Math.max(0, totalCash - value);
      setCloseoutForm(prev => ({ ...prev, amount_kept_as_opening: cleanVal, amount_sent_to_admin: sent === 0 ? "" : sent }));
    } else {
      setCloseoutForm(prev => ({ ...prev, [field]: cleanVal }));
    }
  };


  const handleCloseoutSubmit = async (e) => {
    e.preventDefault();
    if (!closeoutForm.admin_bank_id) {
      alert("Please select the recipient Admin Bank Account!");
      return;
    }
    setLoading(true);
    try {
      const selectedBank = displayAccounts.find(acc => acc.id === closeoutForm.admin_bank_id || String(acc.id) === String(closeoutForm.admin_bank_id));
      const bankDetailsText = selectedBank ? `Recipient Bank: ${selectedBank.bank_name} (A/C: ${selectedBank.account_number}, Title: ${selectedBank.account_title || 'N/A'})` : '';
      const submissionData = {
        ...closeoutForm,
        notes: bankDetailsText ? `${bankDetailsText}. ${closeoutForm.notes}` : closeoutForm.notes
      };
      const res = await fetch('http://localhost:5000/api/banks/closeout', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submissionData)
      });

      if (res.ok) {
        setShowCloseoutModal(false);
        // Refresh all data
        fetchAccounts();
        fetchSales();
        fetchSupplierPayments();
        fetchOthers();
      }
    } catch (err) {
      console.error('Failed to submit closeout', err);
    }
    setLoading(false);
  };


  // Fetch bank accounts
  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch bank accounts', err);
    }
  };

  // Fetch sales for payment summary
  const fetchSales = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/sales', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sales', err);
    }
  };

  // Fetch supplier payments for account deductions
  const fetchSupplierPayments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/purchases/ledger/all', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Could not fetch supplier payments");
      const data = await res.json();
      setSupplierPayments(Array.isArray(data) ? data.filter(p => parseFloat(p.paid_amount) > 0 && (!p.product_name)) : []);
    } catch (err) {
      console.error('Failed to fetch supplier payments', err);
    }
  };

  // Fetch all other modules
  const fetchOthers = async () => {
    const h = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
    try {
      const [salRes, rentRes, invRes, othRes, expRes] = await Promise.all([
        fetch('http://localhost:5000/api/salary', { headers: h }),
        fetch('http://localhost:5000/api/rent', { headers: h }),
        fetch('http://localhost:5000/api/investments', { headers: h }),
        fetch('http://localhost:5000/api/other-expenses', { headers: h }),
        fetch('http://localhost:5000/api/expenses', { headers: h })
      ]);
      setSalaries(await salRes.json());
      setRents(await rentRes.json());
      setInvestments(await invRes.json());
      setOtherExpenses(await othRes.json());
      setGeneralExpenses(await expRes.json());
    } catch (err) { console.error(err); }
  };

  // Initialise data on mount
  useEffect(() => {
    fetchAccounts();
    fetchSales();
    fetchSupplierPayments();
    fetchOthers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `http://localhost:5000/api/banks/${editId}` : 'http://localhost:5000/api/banks';
      
      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, module_type: activeTab })
      });

      setShowModal(false);
      setEditId(null);
      setForm({ bank_name: "", account_title: "", account_number: "", opening_balance: 0 });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to save bank account', err);
    }
    setLoading(false);
  };

  const handleEdit = (acc) => {
    setEditId(acc.id);
    setForm({
      bank_name: acc.bank_name,
      account_title: acc.account_title,
      account_number: acc.account_number,
      opening_balance: acc.opening_balance
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/banks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account', err);
    }
  };

  const handleCashOpeningBalance = () => {
    const cashAcc = accounts.find(a => a.bank_name.toLowerCase() === 'cash' || a.bank_name.toLowerCase() === 'cash account');
    if (cashAcc) {
      handleEdit(cashAcc);
    } else {
      setEditId(null);
      setForm({ bank_name: "Cash", account_title: "Main Counter", account_number: "Cash", opening_balance: 0 });
      setShowModal(true);
    }
  };

  const handlePrintLedger = () => {
    window.print();
  };

  const handleViewBill = (sale) => {
    setSelectedBill(sale);
    setShowBill(true);
  };

  const getTransactionAmount = (s) => {
    if (s.isTransportFare) {
      return parseFloat(s.delivery_charges || s.amount || 0);
    }
    if (s.isExpense) {
      return parseFloat(s.paid_amount || s.amount || 0);
    }
    if (s.isIncome) {
      return parseFloat(s.amount || 0);
    }
    // Sale: Actual cash/bank received is paid_amount
    return parseFloat(s.paid_amount || 0);
  };

  const paymentSummary = useMemo(() => {
    return [
      ...filteredSales, 
      ...filteredSupplierPayments.map(p => ({ ...p, isExpense: true })),
      ...filteredGeneralExpenses.map(e => ({ ...e, isExpense: true })),
      ...filteredSalaries.map(s => ({ ...s, isExpense: true, payment_type: 'Cash' })),
      ...filteredRents.map(r => ({ ...r, isExpense: true, payment_type: 'Cash' })),
      ...filteredOtherExpenses.map(o => ({ ...o, isExpense: true, payment_type: o.payment_method || 'Cash' })),
      ...filteredInvestments.map(i => ({ ...i, isIncome: true, payment_type: 'Cash' })),
      ...filteredSupplierPayments.filter(p => parseFloat(p.delivery_charges) > 0).map(p => ({
        ...p, isExpense: true, payment_type: p.fare_payment_type || 'Cash', 
        isTransportFare: true 
      }))
    ].reduce((acc, s) => {
      const method = s.payment_type || 'Cash';
      let cleanMethod = method.replace('Bank - ', '');
      if (cleanMethod === 'Cash Account' || cleanMethod.toLowerCase() === 'cash') {
        cleanMethod = 'Cash';
      }
      
      const amount = getTransactionAmount(s);
      
      if (!acc[cleanMethod]) acc[cleanMethod] = 0;
      
      if (s.isExpense) {
        acc[cleanMethod] -= amount;
      } else {
        acc[cleanMethod] += amount;
      }
      return acc;
    }, filteredAccounts.reduce((acc, b) => {
      let name = b.bank_name.replace(' Account', '');
      if (name.toLowerCase() === 'cash') name = 'Cash';
      if (!acc[name]) acc[name] = 0;
      acc[name] += parseFloat(b.opening_balance) || 0;
      return acc;
    }, { 'Cash': 0 }));
  }, [filteredSales, filteredSupplierPayments, filteredGeneralExpenses, filteredSalaries, filteredRents, filteredOtherExpenses, filteredInvestments, filteredAccounts]);


  const totalCash = paymentSummary['Cash'] || 0;
  const totalBank = Object.entries(paymentSummary)
    .filter(([k]) => k !== 'Cash')
    .reduce((sum, [, v]) => sum + v, 0);

  // Filter all transactions for the selected ledger account and date range
  const ledgerTransactions = useMemo(() => {
    return [
      ...filteredSales, 
      ...filteredSupplierPayments.map(p => ({ ...p, isExpense: true, customer_name: p.supplier_name || 'Supplier', amount: p.paid_amount, created_at: p.purchase_date })),
      ...filteredSupplierPayments.filter(p => parseFloat(p.delivery_charges) > 0).map(p => ({
        ...p, isExpense: true, customer_name: `Fare: ${p.vehicle_number || 'Vehicle'}`, 
        amount: p.delivery_charges, payment_type: p.fare_payment_type || 'Cash', 
        created_at: p.purchase_date, isTransportFare: true
      })),
      ...filteredGeneralExpenses.map(e => ({ ...e, isExpense: true, customer_name: `General Expense: ${e.title || e.description || 'Office Expense'}`, created_at: e.expense_date })),
      ...filteredSalaries.map(s => ({ ...s, isExpense: true, customer_name: `Salary: ${s.employee_name}`, payment_type: 'Cash', created_at: s.payment_date })),
      ...filteredRents.map(r => ({ ...r, isExpense: true, customer_name: `Rent: ${r.property_name}`, payment_type: 'Cash', created_at: r.rent_date })),
      ...filteredOtherExpenses.map(o => ({ ...o, isExpense: true, customer_name: `Other: ${o.title}`, payment_type: o.payment_method, created_at: o.date })),
      ...filteredInvestments.map(i => ({ ...i, isIncome: true, customer_name: `Invest: ${i.investor}`, payment_type: 'Cash', created_at: i.date }))
    ].filter(s => {
        if (!selectedLedgerAccount) return false;
        
        let method = (s.payment_type || 'Cash').replace('Bank - ', '');
        if (method === 'Cash Account' || method.toLowerCase() === 'cash') {
          method = 'Cash';
        }
        
        const isAccCash = selectedLedgerAccount.isCash || selectedLedgerAccount.bank_name.toLowerCase() === 'cash' || selectedLedgerAccount.bank_name.toLowerCase() === 'cash account';
        let accountMatch = isAccCash ? method === 'Cash' : method === selectedLedgerAccount.bank_name;
        
        if (!accountMatch) return false;
  
        const saleDate = new Date(s.created_at || s.purchase_date || s.date);
        const now = new Date();
        if (dateFilter === 'Today') return saleDate.toDateString() === now.toDateString();
        if (dateFilter === 'Week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return saleDate >= weekAgo;
        }
        if (dateFilter === 'Month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        return true;
      }).sort((a, b) => new Date(b.created_at || b.purchase_date || b.date) - new Date(a.created_at || a.purchase_date || a.date));
  }, [filteredSales, filteredSupplierPayments, filteredGeneralExpenses, filteredSalaries, filteredRents, filteredOtherExpenses, filteredInvestments, selectedLedgerAccount, dateFilter]);

  
  // Calculate running balances chronologically (ascending), then return descending for display
  const calculatedTransactions = useMemo(() => {
    const sortedAsc = [...ledgerTransactions].sort((a, b) => new Date(a.created_at || a.purchase_date || a.date || a.created_at) - new Date(b.created_at || b.purchase_date || b.date || b.created_at));
    let currentBal = parseFloat(selectedLedgerAccount?.opening_balance || 0);
    const withRunning = sortedAsc.map(t => {
      const amt = getTransactionAmount(t);
      if (t.isExpense) {
        currentBal -= amt;
      } else {
        currentBal += amt;
      }
      return { ...t, running_balance: currentBal };
    });
    return withRunning.reverse();
  }, [ledgerTransactions, selectedLedgerAccount]);
  
  // Calculate ledger totals (Opening, Cash In, Cash Out, Closing)
  const ledgerTotals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    ledgerTransactions.forEach(t => {
      const amt = getTransactionAmount(t);
      if (t.isExpense) {
        totalOut += amt;
      } else {
        totalIn += amt;
      }
    });
    const opening = parseFloat(selectedLedgerAccount?.opening_balance || 0);
    return {
      opening,
      totalIn,
      totalOut,
      closing: opening + totalIn - totalOut
    };
  }, [ledgerTransactions, selectedLedgerAccount]);

  const getRecentTransactionsForAccount = (acc) => {
    const isCash = acc.isCash || acc.bank_name.toLowerCase() === 'cash' || acc.bank_name.toLowerCase() === 'cash account';
    const accountTransactions = [
      ...filteredSales,
      ...filteredSupplierPayments.map(p => ({ ...p, isExpense: true, customer_name: p.supplier_name || 'Supplier', amount: p.paid_amount, created_at: p.purchase_date })),
      ...filteredSupplierPayments.filter(p => parseFloat(p.delivery_charges) > 0).map(p => ({
        ...p, isExpense: true, customer_name: `Fare: ${p.vehicle_number || 'Vehicle'}`, 
        amount: p.delivery_charges, payment_type: p.fare_payment_type || 'Cash', 
        created_at: p.purchase_date, isTransportFare: true
      })),
      ...filteredGeneralExpenses.map(e => ({ ...e, isExpense: true, customer_name: `General Expense: ${e.title || e.description || 'Office Expense'}`, created_at: e.expense_date })),
      ...filteredSalaries.map(s => ({ ...s, isExpense: true, customer_name: `Salary: ${s.employee_name}`, payment_type: 'Cash', created_at: s.payment_date })),
      ...filteredRents.map(r => ({ ...r, isExpense: true, customer_name: `Rent: ${r.property_name}`, payment_type: 'Cash', created_at: r.rent_date })),
      ...filteredOtherExpenses.map(o => ({ ...o, isExpense: true, customer_name: `Other: ${o.title}`, payment_type: o.payment_method, created_at: o.date })),
      ...filteredInvestments.map(i => ({ ...i, isIncome: true, customer_name: `Invest: ${i.investor}`, payment_type: 'Cash', created_at: i.date }))
    ].filter(s => {
      const payType = (s.payment_type || 'Cash').replace('Bank - ', '');
      return isCash ? (payType === 'Cash' || payType === 'Cash Account') : payType === acc.bank_name;
    }).sort((a, b) => new Date(b.created_at || b.purchase_date || b.date) - new Date(a.created_at || a.purchase_date || a.date));

    return accountTransactions.slice(0, 3);
  };


  const summarySection = (
    <div className="payment-overview-cards" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px'}}>
      {/* Cash Card */}
      <div className="stat-card" 
        onClick={handleCashOpeningBalance}
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
          padding: '24px', borderRadius: '20px', color: '#fff', 
          boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div>
          <p style={{margin: 0, opacity: 0.9, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Cash (Click to Set Opening)</p>
          <h2 style={{margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 800}}>Rs. {totalCash.toLocaleString()}</h2>
        </div>
        <div style={{background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '16px'}}>
          <CreditCard size={32} />
        </div>
      </div>

      {/* Bank Card */}
      <div className="stat-card" style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', 
        padding: '24px', borderRadius: '20px', color: '#fff', 
        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{margin: 0, opacity: 0.9, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Bank Received</p>
          <h2 style={{margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 800}}>Rs. {totalBank.toLocaleString()}</h2>
        </div>
        <div style={{background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '16px'}}>
          <Landmark size={32} />
        </div>
      </div>
    </div>
  );

  // Access guard removed - Backend now handles isolation


  // Combine Bank Accounts with a virtual "Cash" account ONLY if no real Cash account exists
  const displayAccounts = useMemo(() => {
    const hasRealCash = filteredAccounts.some(a => a.bank_name.toLowerCase() === 'cash' || a.bank_name.toLowerCase() === 'cash account');
    if (hasRealCash) return filteredAccounts;
    return [
      { id: 'cash-id', bank_name: 'Cash Account', account_title: 'Main Counter', account_number: 'N/A', isCash: true, opening_balance: 0 },
      ...filteredAccounts
    ];
  }, [filteredAccounts]);


  const filtered = displayAccounts.filter(acc => acc.bank_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="module-page">
      <div className="module-header no-print">
        <div className="module-title">
          <div className="module-icon" style={{background: '#e0f2fe', color: '#0ea5e9'}}><Landmark size={28} /></div>
          <div>
            <h1>Financial Accounts</h1>
            <p>Manage cash and bank accounts tracking all inflows</p>
          </div>
        </div>

        {user?.role === 'admin' && user?.email === 'admin@erp.com' && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        <div className="module-actions" style={{display: 'flex', gap: '10px'}}>
          <Button label="Galla Closeout" icon="pi pi-lock" onClick={handleOpenCloseout} className="p-button-warning" style={{borderRadius: '12px'}} />
          <Button label="Add Recipient Bank" icon="pi pi-plus-circle" onClick={() => { setAdminBankForm({ bank_name: "", account_title: "", account_number: "" }); setShowAdminBankModal(true); }} className="p-button-success" style={{borderRadius: '12px'}} />
          <Button label="Add Bank Account" icon="pi pi-plus" onClick={() => { setEditId(null); setForm({ bank_name: "", account_title: "", account_number: "", opening_balance: 0 }); setShowModal(true); }} className="p-button-primary" style={{borderRadius: '12px'}} />
        </div>

      </div>


      {/* Payment summary */}
      <div className="no-print">
        {summarySection}
        
        <h3 style={{margin: '25px 0 15px 0', color: '#1e293b', fontWeight: 800, fontSize: '1.3rem'}}>All Accounts & Recent Activity</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '35px'
        }}>
          {displayAccounts.map(acc => {
            const cleanName = acc.bank_name.replace(' Account', '');
            const bal = paymentSummary[cleanName] || paymentSummary[acc.bank_name] || 0;
            const recent = getRecentTransactionsForAccount(acc);

            return (
              <div key={acc.id} 
                onClick={() => { setSelectedLedgerAccount(acc); setDateFilter('All'); setShowLedger(true); }}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '210px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                }}
              >
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div style={{padding: '8px', borderRadius: '10px', background: acc.isCash ? '#f0fdf4' : '#eff6ff', color: acc.isCash ? '#16a34a' : '#2563eb'}}>
                        {acc.isCash ? <CreditCard size={18}/> : <Landmark size={18}/>}
                      </div>
                      <div>
                        <h4 style={{margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '1rem'}}>{acc.bank_name}</h4>
                        {acc.account_number && acc.account_number !== 'N/A' && (
                          <span style={{fontSize: '0.75rem', color: '#64748b'}}>A/C: {acc.account_number}</span>
                        )}
                      </div>
                    </div>
                    <span style={{fontSize: '0.8rem', fontWeight: 700, color: '#64748b'}}>{acc.account_title || 'Counter'}</span>
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase'}}>Current Balance</span>
                    <div style={{fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: '2px'}}>
                      Rs. {bal.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '10px'}}>
                  <h5 style={{margin: '0 0 6px 0', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px'}}>Recent Activity</h5>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {recent.length === 0 ? (
                      <span style={{fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic'}}>No recent activity</span>
                    ) : recent.map((t, index) => {
                      const amt = getTransactionAmount(t);
                      return (
                        <div key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem'}}>
                          <span style={{color: '#475569', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px'}}>
                            {t.customer_name.replace('General Expense: ', '').replace('Salary: ', 'Salary - ')}
                          </span>
                          <span style={{fontWeight: 700, color: t.isExpense ? '#ef4444' : '#16a34a'}}>
                            {t.isExpense ? '-' : '+'} Rs. {amt.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pos-table-actions no-print">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container no-print" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
        <DataTable value={filtered} emptyMessage="No accounts found." className="p-datatable-sm" stripedRows
          onRowClick={(e) => { setSelectedLedgerAccount(e.data); setDateFilter('All'); setShowLedger(true); }} rowHover style={{cursor: 'pointer'}}>
          <Column field="bank_name" header="Account Name" body={acc => (
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{padding: '6px', borderRadius: '8px', background: acc.isCash ? '#f0fdf4' : '#eff6ff', color: acc.isCash ? '#16a34a' : '#2563eb'}}>
                {acc.isCash ? <CreditCard size={16}/> : <Landmark size={16}/>}
              </div>
              <div style={{fontWeight: 700, color: '#1e293b'}}>{acc.bank_name}</div>
            </div>
          )} sortable />
          <Column field="account_title" header="Account Title / No." body={acc => (
            <div>
              <div style={{fontWeight: 700, color: '#1e293b'}}>{acc.account_title || '—'}</div>
              {acc.account_number && acc.account_number !== 'N/A' && (
                <div style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 600}}>A/C: {acc.account_number}</div>
              )}
            </div>
          )} sortable />
          <Column field="opening_balance" header="Opening Bal." body={acc => (
            <div style={{fontWeight: 700, color: '#64748b'}}>Rs. {parseFloat(acc.opening_balance || 0).toLocaleString()}</div>
          )} sortable />
          <Column header="Current Bal." body={acc => {
            const cleanName = acc.bank_name.replace(' Account', '');
            const bal = paymentSummary[cleanName] || paymentSummary[acc.bank_name] || 0;
            return <div style={{fontWeight: 900, color: '#16a34a', fontSize: '1.1rem'}}>Rs. {bal.toLocaleString()}</div>
          }} />
          <Column header="" body={acc => (
            <ActionMenu 
              onDelete={acc.isCash ? null : () => handleDelete(acc.id)} 
              extraItems={[
                { 
                  label: 'Edit Account', 
                  icon: 'pi pi-pencil', 
                  command: () => handleEdit(acc),
                  disabled: acc.isCash
                },
                { 
                  label: 'View Ledger', 
                  icon: 'pi pi-book', 
                  command: () => { setSelectedLedgerAccount(acc); setDateFilter('All'); setShowLedger(true); } 
                }
              ]}
            />
          )} style={{ textAlign: 'center', width: '60px' }} />
        </DataTable>
      </div>

      {/* Ledger Dialog */}
      <Dialog 
        header={
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '40px'}}>
            <span>{selectedLedgerAccount ? `Ledger: ${selectedLedgerAccount.bank_name}` : "Ledger"}</span>
            <div className="no-print" style={{display: 'flex', gap: '10px'}}>
               <Button icon="pi pi-print" label="Print" className="p-button-outlined p-button-secondary" onClick={handlePrintLedger} />
            </div>
          </div>
        } 
        visible={showLedger} 
        style={{ width: '85vw' }} 
        onHide={() => setShowLedger(false)}
        breakpoints={{ '960px': '95vw' }}
        className="ledger-dialog"
      >
        <div className="ledger-content">
          <div className="no-print" style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
            <Button label="Today" className={dateFilter === 'Today' ? 'p-button-primary' : 'p-button-outlined'} onClick={() => setDateFilter('Today')} />
            <Button label="This Week" className={dateFilter === 'Week' ? 'p-button-primary' : 'p-button-outlined'} onClick={() => setDateFilter('Week')} />
            <Button label="This Month" className={dateFilter === 'Month' ? 'p-button-primary' : 'p-button-outlined'} onClick={() => setDateFilter('Month')} />
            <Button label="All Time" className={dateFilter === 'All' ? 'p-button-primary' : 'p-button-outlined'} onClick={() => setDateFilter('All')} />
          </div>

          <div style={{
            marginBottom: '20px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '15px'
          }}>
            <div style={{padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <span style={{color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Opening Balance</span>
              <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#475569', marginTop: '4px'}}>
                Rs. {ledgerTotals.opening.toLocaleString()}
              </div>
            </div>
            <div style={{padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0'}}>
              <span style={{color: '#166534', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Total Cash In (+)</span>
              <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#15803d', marginTop: '4px'}}>
                Rs. {ledgerTotals.totalIn.toLocaleString()}
              </div>
            </div>
            <div style={{padding: '15px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca'}}>
              <span style={{color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Total Cash Out (-)</span>
              <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px'}}>
                Rs. {ledgerTotals.totalOut.toLocaleString()}
              </div>
            </div>
            <div style={{padding: '15px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe'}}>
              <span style={{color: '#1e40af', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Closing Balance</span>
              <div style={{fontSize: '1.3rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px'}}>
                Rs. {ledgerTotals.closing.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Print-only Header */}
          <div className="print-only" style={{marginBottom: '20px', textAlign: 'center'}}>
             <h2 style={{margin: 0}}>Account Statement - {selectedLedgerAccount?.bank_name}</h2>
             <p style={{margin: '5px 0'}}>Filter: {dateFilter} | Date: {new Date().toLocaleDateString()}</p>
             <hr />
          </div>

          <DataTable value={calculatedTransactions} paginator={!window.matchMedia('print').matches} rows={20} className="p-datatable-sm" stripedRows emptyMessage="No transactions found for this period.">
            <Column field="id" header="Bill #" body={s => (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                {s.id ? (
                  <Button 
                    label={`#${s.id}`} 
                    text 
                    className="p-button-link p-0 font-bold" 
                    onClick={() => handleViewBill(s)} 
                    style={{color: '#2563eb'}}
                  />
                ) : <span style={{color: '#64748b'}}>—</span>}
                {s.status === 'Returned' && <span style={{fontSize: '0.65rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '2px'}}>FULL RETURN</span>}
                {s.status === 'Partially Returned' && <span style={{fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '2px'}}>PARTIAL</span>}
              </div>
            )} sortable />
            <Column field="created_at" header="Date" body={s => new Date(s.created_at || s.purchase_date || s.date).toLocaleDateString()} sortable />
            <Column field="customer_name" header="Description" body={s => (
              <div>
                <div style={{fontWeight: 700, color: '#1e293b'}}>{s.customer_name}</div>
                {s.customer_phone && <div style={{fontSize: '0.75rem', color: '#64748b'}}>{s.customer_phone}</div>}
              </div>
            )} sortable />
            <Column header="Details/Items" body={s => {
              const text = s.customer_name || '';
              return (
                <div style={{fontSize: '0.85rem', color: '#475569'}}>
                  {s.isTransportFare ? (
                    <span style={{fontWeight: 600, color: '#0369a1'}}>🚛 Transport Fare for Stock</span>
                  ) : text.startsWith('Salary:') ? (
                    <span style={{fontWeight: 600, color: '#b45309'}}>💼 Salary Payment</span>
                  ) : text.startsWith('Rent:') ? (
                    <span style={{fontWeight: 600, color: '#7c3aed'}}>🏠 Rent Payment</span>
                  ) : text.startsWith('Other:') ? (
                    <span style={{fontWeight: 600, color: '#475569'}}>💸 Other Expense: {text.replace('Other: ', '')}</span>
                  ) : text.startsWith('General Expense:') ? (
                    <span style={{fontWeight: 600, color: '#db2777'}}>💸 {text}</span>
                  ) : s.isExpense ? (
                    <span style={{fontWeight: 600, color: '#e11d48'}}>💸 Paid to Supplier</span>
                  ) : s.isIncome ? (
                    <span style={{fontWeight: 600, color: '#16a34a'}}>💰 Investment Inflow</span>
                  ) : (
                    Array.isArray(s.items) ? (
                      <span style={{fontWeight: 600, color: '#0f766e'}}>🛒 Sale: {s.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</span>
                    ) : 'Details not available'
                  )}
                </div>
              );
            }} />
            <Column header="Cash In (Debit)" body={s => {
              if (s.isExpense) return <span style={{color: '#94a3b8'}}>—</span>;
              const amt = getTransactionAmount(s);
              return <span style={{fontWeight: 700, color: '#16a34a'}}>+ Rs. {amt.toLocaleString()}</span>;
            }} />
            <Column header="Cash Out (Credit)" body={s => {
              if (!s.isExpense) return <span style={{color: '#94a3b8'}}>—</span>;
              const amt = getTransactionAmount(s);
              return <span style={{fontWeight: 700, color: '#ef4444'}}>- Rs. {amt.toLocaleString()}</span>;
            }} />
            <Column header="Balance" body={s => (
              <span style={{fontWeight: 800, color: '#1e293b'}}>Rs. {parseFloat(s.running_balance).toLocaleString()}</span>
            )} />
          </DataTable>
        </div>
      </Dialog>

      {/* Bill Details Dialog (Professional Receipt View) */}
      <Dialog 
        header={
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '40px'}}>
            <span>Bill View: #{selectedBill?.id}</span>
            <Button icon="pi pi-print" label="Print Bill" className="p-button-outlined" onClick={() => window.print()} />
          </div>
        }
        visible={showBill} 
        style={{ width: '400px' }} 
        onHide={() => setShowBill(false)}
        className="bill-viewer-dialog"
      >
        {selectedBill && (
          <div className="thermal-receipt" style={{padding: '0 10px', color: '#000', fontFamily: 'monospace'}}>
            <div style={{textAlign: 'center', marginBottom: '10px'}}>
              <h2 style={{margin: '0', fontSize: '22px'}}>DATA WALEY</h2>
              <h3 style={{margin: '2px 0', fontSize: '14px', fontWeight: 'normal'}}>CEMENT DEALER</h3>
              <p style={{margin: '0', fontSize: '12px'}}>12- Kachehri Main Larhoor Road, Daska</p>
              <p style={{margin: '0', fontSize: '12px'}}>Contact: 0300-0000000</p>
            </div>
            
            <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
            <h3 style={{textAlign: 'center', margin: '5px 0', fontSize: '16px'}}>SALE INVOICE</h3>
            
            <div style={{fontSize: '13px', lineHeight: '1.4'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Bill No</span> <span>: {selectedBill.id}</span></div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Date</span> <span>: {new Date(selectedBill.created_at).toLocaleDateString()}</span></div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Customer</span> <span>: {selectedBill.customer_name}</span></div>
              {selectedBill.customer_phone && <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Phone</span> <span>: {selectedBill.customer_phone}</span></div>}
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Payment</span> <span>: {selectedBill.payment_type}</span></div>
            </div>
            
            <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
            
            <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left'}}>
                  <th style={{paddingBottom: '5px'}}>DESC</th>
                  <th style={{paddingBottom: '5px', textAlign: 'center'}}>QTY</th>
                  <th style={{paddingBottom: '5px', textAlign: 'right'}}>AMT</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(selectedBill.items) && selectedBill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{padding: '4px 0'}}>{item.name}</td>
                    <td style={{textAlign: 'center'}}>{item.quantity}</td>
                    <td style={{textAlign: 'right'}}>{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
            
            <div style={{fontSize: '14px', fontWeight: 'bold'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                <span>BILL TOTAL</span>
                <span>Rs. {parseFloat(selectedBill.net_amount).toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                <span>PAID NOW</span>
                <span>Rs. {parseFloat(selectedBill.paid_amount).toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>REMAINING</span>
                <span>Rs. {parseFloat(selectedBill.balance_amount).toLocaleString()}</span>
              </div>
            </div>
            
            <div style={{borderBottom: '1px dashed #000', margin: '10px 0'}}></div>
            
            <div style={{textAlign: 'center', fontSize: '12px'}}>
              <p style={{margin: '5px 0'}}>Software by: Numan</p>
              <p style={{margin: '0', fontWeight: 'bold'}}>THANKS FOR VISITING!</p>
            </div>
          </div>
        )}
      </Dialog>

      <style jsx="true">{`
        @media print {
          body * { visibility: hidden; }
          .ledger-dialog, .ledger-dialog *, .bill-viewer-dialog, .bill-viewer-dialog *, .print-only, .print-only * { visibility: visible; }
          .ledger-dialog, .bill-viewer-dialog { position: absolute; left: 0; top: 0; width: 100% !important; border: none !important; box-shadow: none !important; }
          .no-print, .p-dialog-header, .p-dialog-footer { display: none !important; }
          .p-dialog-content { padding: 0 !important; }
        }
        .print-only { display: none; }
        @media print { .print-only { display: block; } }
      `}</style>

      {/* Modal for adding Bank Account */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Bank Account" : "Add New Bank Account"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="custom-form p-fluid">
              <div className="field mb-3">
                <label className="block mb-2 font-bold">Bank Name *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><Landmark size={18} /></span>
                  <input type="text" required value={form.bank_name} placeholder="e.g. Meezan Bank"
                    className="p-inputtext p-component"
                    onChange={e => setForm({ ...form, bank_name: e.target.value })} />
                </div>
              </div>

              <div className="field mb-3">
                <label className="block mb-2 font-bold">Account Title</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><CreditCard size={18} /></span>
                  <input type="text" value={form.account_title} placeholder="e.g. Ali Traders"
                    className="p-inputtext p-component"
                    onChange={e => setForm({ ...form, account_title: e.target.value })} />
                </div>
              </div>

              <div className="field mb-3">
                <label className="block mb-2 font-bold">Account Number</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><Hash size={18} /></span>
                  <input type="text" value={form.account_number} placeholder="e.g. 0123456789"
                    className="p-inputtext p-component"
                    onChange={e => setForm({ ...form, account_number: e.target.value })} />
                </div>
              </div>

              <div className="field mb-4">
                <label className="block mb-2 font-bold">Opening Balance (PKR) *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">Rs.</span>
                  <input type="number" required value={form.opening_balance} placeholder="0.00"
                    className="p-inputtext p-component"
                    onChange={e => setForm({ ...form, opening_balance: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" icon="pi pi-times" onClick={() => {setShowModal(false); setEditId(null);}} className="p-button-text" />
                <Button type="submit" label={loading ? "Saving..." : (editId ? "Update Account" : "Add Bank")} icon="pi pi-check" loading={loading} />
              </div>
            </form>
          </div>
        </div>
      )}

      {showCloseoutModal && (
        <div className="modal-overlay" onClick={() => setShowCloseoutModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Daily Galla Closeout / Transfer to Admin</h3>
              <button className="modal-close" onClick={() => setShowCloseoutModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCloseoutSubmit} className="custom-form p-fluid">
              <div style={{
                background: '#f0fdf4',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{margin: 0, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Total Cash in Register</p>
                  <h3 style={{margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 800}}>Rs. {totalCash.toLocaleString()}</h3>
                </div>
                <div style={{fontSize: '1.8rem'}}>💰</div>
              </div>

              <div className="field mb-3">
                <label className="block mb-2 font-bold" style={{color: '#1e293b'}}>Amount Sent to Admin *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">Rs.</span>
                  <input type="number" required value={closeoutForm.amount_sent_to_admin} placeholder="0.00"
                    className="p-inputtext p-component"
                    onChange={e => handleCloseoutFieldChange('amount_sent_to_admin', e.target.value)} />
                </div>
              </div>

              <div className="field mb-3">
                <label className="block mb-2 font-bold" style={{color: '#1e293b'}}>Recipient Admin Bank Account *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">🏦</span>
                  <select 
                    required 
                    value={closeoutForm.admin_bank_id} 
                    className="p-inputtext p-component"
                    style={{borderRadius: '0 8px 8px 0', padding: '10px'}}
                    onChange={e => setCloseoutForm(prev => ({ ...prev, admin_bank_id: e.target.value }))}
                  >
                    <option value="">-- Select Recipient Admin Account --</option>
                    {displayAccounts.filter(acc => !acc.isCash && acc.bank_name.toLowerCase() !== 'cash' && acc.bank_name.toLowerCase() !== 'cash account' && (user?.role === 'admin' || acc.user_id !== user?.id)).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_title}</option>
                    ))}

                  </select>
                </div>
              </div>

              {displayAccounts.find(acc => acc.id === closeoutForm.admin_bank_id || String(acc.id) === String(closeoutForm.admin_bank_id)) && (() => {
                const selectedRecipientBank = displayAccounts.find(acc => acc.id === closeoutForm.admin_bank_id || String(acc.id) === String(closeoutForm.admin_bank_id));
                return (
                  <div style={{
                    background: '#f8fafc',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    color: '#334155'
                  }}>
                    <p style={{margin: '0 0 8px 0', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <span>✅ Recipient Account Verified Details:</span>
                    </p>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                      <div><strong>Bank Name:</strong> {selectedRecipientBank.bank_name}</div>
                      <div><strong>Account Title:</strong> {selectedRecipientBank.account_title || 'N/A'}</div>
                      <div style={{gridColumn: 'span 2'}}><strong>Account Number:</strong> <span style={{fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a'}}>{selectedRecipientBank.account_number || 'N/A'}</span></div>
                    </div>
                  </div>
                );
              })()}

              <div className="field mb-3">

                <label className="block mb-2 font-bold" style={{color: '#1e293b'}}>Remaining Kept as Opening Balance *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">Rs.</span>
                  <input type="number" required value={closeoutForm.amount_kept_as_opening} placeholder="0.00"
                    className="p-inputtext p-component"
                    onChange={e => handleCloseoutFieldChange('amount_kept_as_opening', e.target.value)} />
                </div>
                <small style={{color: '#64748b', marginTop: '5px', display: 'block'}}>This remaining amount will be kept in your drawer for tomorrow's transactions.</small>
              </div>

              <div className="field mb-4">
                <label className="block mb-2 font-bold" style={{color: '#1e293b'}}>Notes / Remarks</label>
                <textarea rows="2" value={closeoutForm.notes} placeholder="e.g. Cleared register after end of shift..."
                  className="p-inputtext p-component" style={{borderRadius: '8px', padding: '10px'}}
                  onChange={e => handleCloseoutFieldChange('notes', e.target.value)} />
              </div>

              <div className="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" icon="pi pi-times" onClick={() => setShowCloseoutModal(false)} className="p-button-text" />
                <Button type="submit" label={loading ? "Submitting..." : "Submit Handover & Close Register"} icon="pi pi-check" loading={loading} className="p-button-warning" />
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminBankModal && (
        <div className="modal-overlay" onClick={() => setShowAdminBankModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Dedicated Admin Recipient Bank</h3>
              <button className="modal-close" onClick={() => setShowAdminBankModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdminBankSubmit} className="custom-form p-fluid">
              <div className="field mb-3">
                <label className="block mb-2 font-bold">Bank Name *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><Landmark size={18} /></span>
                  <input type="text" required value={adminBankForm.bank_name} placeholder="e.g. Meezan Bank"
                    className="p-inputtext p-component"
                    onChange={e => setAdminBankForm({ ...adminBankForm, bank_name: e.target.value })} />
                </div>
              </div>

              <div className="field mb-3">
                <label className="block mb-2 font-bold">Account Title *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><CreditCard size={18} /></span>
                  <input type="text" required value={adminBankForm.account_title} placeholder="e.g. Admin Head Office"
                    className="p-inputtext p-component"
                    onChange={e => setAdminBankForm({ ...adminBankForm, account_title: e.target.value })} />
                </div>
              </div>

              <div className="field mb-3">
                <label className="block mb-2 font-bold">Account Number *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><Hash size={18} /></span>
                  <input type="text" required value={adminBankForm.account_number} placeholder="e.g. 0123456789"
                    className="p-inputtext p-component"
                    onChange={e => setAdminBankForm({ ...adminBankForm, account_number: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" icon="pi pi-times" onClick={() => setShowAdminBankModal(false)} className="p-button-text" />
                <Button type="submit" label={loading ? "Saving..." : "Add Recipient Bank"} icon="pi pi-check" loading={loading} />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect, useContext } from "react";
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
  const [form, setForm] = useState({ bank_name: "", account_title: "", account_number: "" });
  const [showModal, setShowModal] = useState(false);
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

  // State for Ledger view
  const [showLedger, setShowLedger] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [dateFilter, setDateFilter] = useState('All'); // 'Today', 'Week', 'Month', 'All'

  // State for Bill Viewer
  const [showBill, setShowBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

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
      const data = await res.json();
      // Filter only payment entries (usually they have total_amount as 0 or similar, but we check paid_amount)
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

  // Compute totals per payment method (Unified)
  const paymentSummary = [
    ...sales, 
    ...supplierPayments.map(p => ({ ...p, isExpense: true, amount: p.paid_amount })),
    ...generalExpenses.map(e => ({ ...e, isExpense: true })),
    ...salaries.map(s => ({ ...s, isExpense: true, payment_type: 'Cash' })),
    ...rents.map(r => ({ ...r, isExpense: true, payment_type: 'Cash' })),
    ...otherExpenses.map(o => ({ ...o, isExpense: true, payment_type: o.payment_method || 'Cash' })),
    ...investments.map(i => ({ ...i, isIncome: true, payment_type: 'Cash' })),
    // Include delivery charges from purchases as expenses
    ...supplierPayments.filter(p => parseFloat(p.delivery_charges) > 0).map(p => ({
      ...p, isExpense: true, amount: p.delivery_charges, payment_type: p.fare_payment_type || 'Cash', 
      isTransportFare: true 
    }))
  ].reduce((acc, s) => {
    const method = s.payment_type || 'Cash';
    const cleanMethod = method.replace('Bank - ', '');
    const amount = parseFloat(s.amount || s.paid_amount || s.net_amount || 0);
    
    if (!acc[cleanMethod]) acc[cleanMethod] = 0;
    
    if (s.isExpense) {
      acc[cleanMethod] -= amount;
    } else {
      acc[cleanMethod] += amount;
    }
    return acc;
  }, {});

  const totalCash = paymentSummary['Cash'] || 0;
  const totalBank = Object.entries(paymentSummary)
    .filter(([k]) => k !== 'Cash')
    .reduce((sum, [, v]) => sum + v, 0);

  // Filter all transactions for the selected ledger account and date range
  const ledgerTransactions = [
    ...sales, 
    ...supplierPayments.map(p => ({ ...p, isExpense: true, customer_name: p.supplier_name || 'Supplier', amount: p.paid_amount })),
    // Add Transport Fares as separate ledger entries
    ...supplierPayments.filter(p => parseFloat(p.delivery_charges) > 0).map(p => ({
      ...p, isExpense: true, customer_name: `Fare: ${p.vehicle_number || 'Vehicle'}`, 
      amount: p.delivery_charges, payment_type: p.fare_payment_type || 'Cash', 
      created_at: p.purchase_date, isTransportFare: true
    })),
    ...generalExpenses.map(e => ({ ...e, isExpense: true, customer_name: 'General Expense' })),
    ...salaries.map(s => ({ ...s, isExpense: true, customer_name: `Salary: ${s.employee_name}`, payment_type: 'Cash', created_at: s.payment_date })),
    ...rents.map(r => ({ ...r, isExpense: true, customer_name: `Rent: ${r.property_name}`, payment_type: 'Cash', created_at: r.rent_date })),
    ...otherExpenses.map(o => ({ ...o, isExpense: true, customer_name: `Other: ${o.title}`, payment_type: o.payment_method, created_at: o.date })),
    ...investments.map(i => ({ ...i, isIncome: true, customer_name: `Invest: ${i.investor}`, payment_type: 'Cash', created_at: i.date }))
  ].filter(s => {
      if (!selectedLedgerAccount) return false;
      
      const method = (s.payment_type || 'Cash').replace('Bank - ', '');
      let accountMatch = selectedLedgerAccount.isCash ? method === 'Cash' : method === selectedLedgerAccount.bank_name;
      
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

  const summarySection = (
    <div className="payment-overview-cards" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px'}}>
      {/* Cash Card */}
      <div className="stat-card" style={{
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
        padding: '24px', borderRadius: '20px', color: '#fff', 
        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{margin: 0, opacity: 0.9, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Cash Received</p>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('http://localhost:5000/api/banks', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      setShowModal(false);
      setForm({ bank_name: "", account_title: "", account_number: "" });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to add bank account', err);
    }
    setLoading(false);
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

  const handlePrintLedger = () => {
    window.print();
  };

  const handleViewBill = (sale) => {
    setSelectedBill(sale);
    setShowBill(true);
  };

  // Combine Bank Accounts with a virtual "Cash" account
  const displayAccounts = [
    { id: 'cash-id', bank_name: 'Cash Account', account_title: 'Main Counter', account_number: 'N/A', isCash: true },
    ...accounts
  ];

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
        <div className="module-actions">
          <Button label="Add Bank Account" icon="pi pi-plus" onClick={() => setShowModal(true)} className="p-button-primary" />
        </div>
      </div>

      {/* Payment summary */}
      <div className="no-print">
        {summarySection}
      </div>

      <div className="pos-table-actions no-print">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container no-print" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
        <DataTable value={filtered} emptyMessage="No accounts found." className="p-datatable-sm" stripedRows>
          <Column field="bank_name" header="Account Name" body={acc => (
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{padding: '6px', borderRadius: '8px', background: acc.isCash ? '#f0fdf4' : '#eff6ff', color: acc.isCash ? '#16a34a' : '#2563eb'}}>
                {acc.isCash ? <CreditCard size={16}/> : <Landmark size={16}/>}
              </div>
              <div style={{fontWeight: 700, color: '#1e293b'}}>{acc.bank_name}</div>
            </div>
          )} sortable />
          <Column field="account_title" header="Account Title" body={acc => acc.account_title || '—'} sortable />
          <Column field="account_number" header="Account Number" body={acc => (
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Hash size={14} color="#64748b"/> {acc.account_number || '—'}
            </div>
          )} sortable />
          <Column header="" body={acc => (
            <ActionMenu 
              onDelete={acc.isCash ? null : () => handleDelete(acc.id)} 
              extraItems={[
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

          <div style={{marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <span style={{color: '#64748b', fontSize: '0.9rem'}}>Account Balance ({dateFilter})</span>
              <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#1e293b'}}>
                Rs. {ledgerTransactions.reduce((sum, s) => sum + (parseFloat(s.paid_amount) || 0), 0).toLocaleString()}
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <span style={{color: '#64748b', fontSize: '0.9rem'}}>Transactions</span>
              <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#1e293b'}}>{ledgerTransactions.length}</div>
            </div>
          </div>

          {/* Print-only Header */}
          <div className="print-only" style={{marginBottom: '20px', textAlign: 'center'}}>
             <h2 style={{margin: 0}}>Account Statement - {selectedLedgerAccount?.bank_name}</h2>
             <p style={{margin: '5px 0'}}>Filter: {dateFilter} | Date: {new Date().toLocaleDateString()}</p>
             <hr />
          </div>

          <DataTable value={ledgerTransactions} paginator={!window.matchMedia('print').matches} rows={20} className="p-datatable-sm" stripedRows emptyMessage="No transactions found for this period.">
            <Column field="id" header="Bill #" body={s => (
              <Button 
                label={`#${s.id}`} 
                text 
                className="p-button-link p-0 font-bold" 
                onClick={() => handleViewBill(s)} 
                style={{color: '#2563eb'}}
              />
            )} sortable />
            <Column field="created_at" header="Date" body={s => new Date(s.created_at).toLocaleDateString()} sortable />
            <Column field="customer_name" header="Customer" body={s => (
              <div>
                <div style={{fontWeight: 700, color: '#1e293b'}}>{s.customer_name}</div>
                {s.customer_phone && <div style={{fontSize: '0.75rem', color: '#64748b'}}>{s.customer_phone}</div>}
              </div>
            )} sortable />
            <Column header="Details/Items" body={s => (
              <div style={{fontSize: '0.85rem', color: '#475569'}}>
                {s.isTransportFare ? (
                  <span style={{fontWeight: 600, color: '#0369a1'}}>🚛 Transport Fare for Stock</span>
                ) : s.isExpense ? (
                  <span style={{fontWeight: 600, color: '#e11d48'}}>💸 Payment Sent to Supplier</span>
                ) : (
                  Array.isArray(s.items) ? s.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : 'Details not available'
                )}
              </div>
            )} />
            <Column field="paid_amount" header="Amount" body={s => {
              const amt = parseFloat(s.amount || s.paid_amount || s.net_amount || 0);
              return (
                <div style={{fontWeight: 800, color: s.isExpense ? '#e11d48' : '#16a34a'}}>
                  {s.isExpense ? '-' : '+'} Rs. {amt.toLocaleString()}
                </div>
              );
            }} sortable />
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
              <h3>Add New Bank Account</h3>
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

              <div className="field mb-4">
                <label className="block mb-2 font-bold">Account Number (IBAN/Phone)</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><Hash size={18} /></span>
                  <input type="text" value={form.account_number} placeholder="e.g. PK00MEZN..."
                    className="p-inputtext p-component"
                    onChange={e => setForm({ ...form, account_number: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text" />
                <Button type="submit" label={loading ? "Saving..." : "Add Bank"} icon="pi pi-check" loading={loading} />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

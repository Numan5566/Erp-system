import React, { useState, useEffect, useContext, useMemo } from "react";
import { 
  Truck, Plus, Pencil, Trash2, X, Search, Phone, Mail, 
  MapPin, Building, CreditCard, Banknote, ClipboardList, Package, FileText
} from "lucide-react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/suppliers";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  company: "",
  address: "",
  balance: "0",
};

export default function Suppliers({ type }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(type || (user?.email === 'admin@erp.com' ? "" : user?.module_type || "Wholesale"));

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user?.email !== 'admin@erp.com') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.email]);

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", notes: "Payment via Cash/Bank" });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [paymentSource, setPaymentSource] = useState("Cash");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("all");
   const [ledgerData, setLedgerData] = useState([]);
  const sortedLedgerData = useMemo(() => {
    return [...ledgerData].sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));
  }, [ledgerData]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveBalances, setLiveBalances] = useState({});

  useEffect(() => {
    if (showPaymentModal) {
      const fetchLiveBalances = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/banks/balances', {
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setLiveBalances(data);
          }
        } catch (e) { console.error(e); }
      };
      fetchLiveBalances();
    }
  }, [showPaymentModal]);

  const fetchRecords = async () => {
    if (!activeTab) return;
    try {
      const res = await fetch(`${API}?type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
      return [];
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBankAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch banks", err);
    }
  };

  useEffect(() => { 
    fetchRecords(); 
    fetchBanks();
  }, [activeTab]);

  // If Admin and no counter selected, show selection screen
  if (user?.email === 'admin@erp.com' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's supplier directory you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">🚛</div>
            <h3>Wholesale</h3>
            <span>Main Warehouse</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">🏭</div>
            <h3>Retail 1</h3>
            <span>Counter A</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">🏗️</div>
            <h3>Retail 2</h3>
            <span>Counter B</span>
          </div>
        </div>
      </div>
    );
  }

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      name: rec.name,
      phone: rec.phone || "",
      email: rec.email || "",
      company: rec.company || "",
      address: rec.address || "",
      balance: rec.balance,
    });
    setEditId(rec.id);
    setShowModal(true);
  };

  const openLedger = async (supplier, from = "", to = "", filter = "all") => {
    setSelectedSupplier(supplier);
    setLedgerFrom(from);
    setLedgerTo(to);
    setLedgerFilter(filter);
    setLedgerData([]);
    setShowLedgerModal(true);
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/purchases/supplier/${supplier.id}?type=${activeTab}`;
      if (from && to) url += `&from=${from}&to=${to}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLedgerData(data);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    }
    setLoading(false);
  };

  const applyLedgerFilter = (filterKey) => {
    let from = "", to = "";
    const today = new Date();
    
    if (filterKey === 'today') {
      from = today.toISOString().split('T')[0];
      to = from;
    } else if (filterKey === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      from = weekAgo.toISOString().split('T')[0];
      to = today.toISOString().split('T')[0];
    } else if (filterKey === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      to = today.toISOString().split('T')[0];
    }

    if (filterKey === 'custom') {
      setLedgerFilter('custom');
      return;
    }

    openLedger(selectedSupplier, from, to, filterKey);
  };

  const openPayment = (supplier) => {
    setSelectedSupplier(supplier);
    setPaymentForm({ amount: "", notes: "Payment Sent" });
    setSelectedBank("");
    setPaymentSource("Cash");
    fetchBanks(); // Refresh banks list when modal opens
    setShowPaymentModal(true);
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    const currentBalance = parseFloat(selectedSupplier.balance || 0);
    const amt = parseFloat(paymentForm.amount || 0);
    
    // Only restrict if there is a positive balance (money we owe them)
    if (currentBalance > 0 && amt > currentBalance) {
      alert(`Invalid Payment: You cannot pay more than the outstanding balance (Rs. ${currentBalance})!`);
      return;
    }
    setLoading(true);
    
    let finalPaymentType = selectedBank ? `Bank - ${selectedBank}` : 'Cash';
    const targetAccountName = selectedBank || 'Cash';
    const currentAvailable = liveBalances[targetAccountName] || 0;

    if (amt > currentAvailable) {
      setLoading(false);
      return;
    }

    try {
      // 3. Save the payment
      const res = await fetch(`http://localhost:5000/api/purchases/payment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          paid_amount: paymentForm.amount,
          notes: paymentForm.notes,
          payment_type: finalPaymentType,
          module_type: activeTab
        })
      });
      if (res.ok) {
        setShowPaymentModal(false);
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to make payment", err);
    }
    setLoading(false);
  };

  const handleEntryUpdate = async (purchaseId, newQty, newRate) => {
    try {
      const res = await fetch("http://localhost:5000/api/purchases/update-ledger-entry", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          purchase_id: purchaseId, 
          new_qty: newQty, 
          new_rate: newRate 
        }),
      });
      if (res.ok) {
        const updatedRecords = await fetchRecords(); // Refresh main balances
        // Find updated supplier and refresh selected state
        const updatedSup = (updatedRecords || []).find(s => s.id === selectedSupplier.id);
        if (updatedSup) setSelectedSupplier(updatedSup);
        
        openLedger(updatedSup || selectedSupplier, ledgerFrom, ledgerTo, ledgerFilter); // Refresh ledger
      }
    } catch (err) {
      console.error("Failed to update entry", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API}/${editId}` : API;
      await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, module_type: activeTab }),
      });
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      console.error("Failed to save supplier", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalReceivable = filtered.filter(r => parseFloat(r.balance) < 0).reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);
  const totalPayable = filtered.filter(r => parseFloat(r.balance) > 0).reduce((sum, r) => sum + parseFloat(r.balance), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon" style={{background: '#fff7ed', color: '#f59e0b'}}><Package size={28} /></div>
          <div>
            <h1>{activeTab} Suppliers</h1>
            <p>Manage vendors, factory contacts and purchase ledgers</p>
          </div>
        </div>

        {user?.role === 'admin' && !user?.module_type && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add New Supplier
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon orange"><Building size={24} /></div>
          <div className="info">
            <span className="label">Total Vendors</span>
            <span className="value">{filtered.length} Companies</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><CreditCard size={24} /></div>
          <div className="info">
            <span className="label">Pending Payments</span>
            <span className="value">Rs. {totalPayable.toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><Banknote size={24} /></div>
          <div className="info">
            <span className="label">Advance Paid</span>
            <span className="value">Rs. {totalReceivable.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search by name or company..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
        <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} 
                   emptyMessage="No suppliers found." className="p-datatable-sm" stripedRows responsiveLayout="scroll">
          <Column field="id" header="ID" body={(rec) => <span style={{fontWeight: 600, color: '#64748b'}}>#{rec.id}</span>} sortable style={{ width: '80px' }} />
          
          <Column field="name" header="Supplier Name" body={(rec) => (
            <span style={{fontWeight: 700, fontSize: '1rem', color: '#1e293b'}}>{rec.name}</span>
          )} sortable />

          <Column field="company" header="Company / Brand" body={(rec) => (
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Building size={16} color="#64748b"/>
              <span style={{fontWeight: 600, color: '#475569'}}>{rec.company || "N/A"}</span>
            </div>
          )} sortable />
          
          <Column header="Contact Details" body={(rec) => (
            <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem', fontWeight:'600', color: '#334155'}}><Phone size={12}/> {rec.phone || "—"}</div>
              <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.8rem', color:'#64748b'}}><Mail size={12}/> {rec.email || "—"}</div>
            </div>
          )} />
          
          <Column header="Location" body={(rec) => (
            <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem', color: '#475569'}}><MapPin size={12}/> {rec.address || "—"}</div>
          )} />
          
          <Column field="balance" header="Ledger Balance" body={(rec) => (
            <span style={{fontWeight: 800, fontSize: '1rem', color: parseFloat(rec.balance) > 0 ? '#e11d48' : parseFloat(rec.balance) < 0 ? '#16a34a' : '#64748b'}}>
              Rs. {Math.abs(parseFloat(rec.balance)).toLocaleString()}
              <small style={{display:'block', fontSize:'0.75rem', fontWeight:'normal'}}>
                {parseFloat(rec.balance) > 0 ? 'Payable' : parseFloat(rec.balance) < 0 ? 'Advance' : 'Clear'}
              </small>
            </span>
          )} sortable />
          
          <Column header="" body={(rec) => (
            <ActionMenu 
              onEdit={() => openEdit(rec)} 
              onDelete={() => handleDelete(rec.id)}
              extraItems={[
                { label: 'View Ledger', icon: 'pi pi-book', command: () => openLedger(rec) },
                { label: 'Make Payment', icon: 'pi pi-money-bill', command: () => openPayment(rec) }
              ]}
            />
          )} style={{ textAlign: 'center', width: '80px' }} />
        </DataTable>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Supplier Record" : "Add New Factory/Vendor"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Company Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <div className="input-wrapper">
                    <Building size={18} />
                    <input type="text" required value={form.company} placeholder="e.g. Lucky Cement"
                      onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <div className="input-wrapper">
                    <ClipboardList size={18} />
                    <input type="text" value={form.name} placeholder="e.g. Mr. Khan"
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={18} />
                    <input type="text" value={form.phone} placeholder="e.g. 0300-1234567"
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Factory Address</label>
                  <div className="input-wrapper">
                    <MapPin size={18} />
                    <input type="text" value={form.address} placeholder="City, Factory Area"
                      onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="section-label">Financial Balance</div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Initial Balance (Rs.)</label>
                  <div className="input-wrapper">
                    <Banknote size={18} />
                    <input type="number" value={form.balance}
                      onChange={(e) => setForm({ ...form, balance: e.target.value })} 
                      placeholder="Positive: Payable to vendor | Negative: Advance paid" />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Record" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Ledger Modal */}
      {showLedgerModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowLedgerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header no-print">
              <div className="header-info" style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <FileText size={24} color="#3b82f6" />
                <h3>Ledger: {selectedSupplier.company || selectedSupplier.name}</h3>
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="btn-secondary" onClick={() => window.print()} style={{padding: '6px 12px', display:'flex', alignItems:'center', gap:'6px'}}>
                  <ClipboardList size={16} /> Print Report
                </button>
                <button className="modal-close" onClick={() => setShowLedgerModal(false)}><X size={20} /></button>
              </div>
            </div>

            {/* Print Only Ledger Report */}
            <div className="ledger-report print-only" style={{padding: '20px', color: 'black'}}>
              <div style={{textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px'}}>
                <h2 style={{margin: 0}}>DATA WALEY CEMENT DEALER</h2>
                <p style={{margin: '5px 0'}}>Supplier Purchase Ledger Report</p>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px'}}>
                  <span><strong>Supplier:</strong> {selectedSupplier.name} ({selectedSupplier.company})</span>
                  <span><strong>Period:</strong> {ledgerFilter === 'all' ? 'All Time' : `${ledgerFrom} to ${ledgerTo}`}</span>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                <thead>
                  <tr style={{background: '#f1f5f9'}}>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '50px'}}>S.No.</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left'}}>Date</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left'}}>Product/Details</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Total Bill</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Paid</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLedgerData.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{index + 1}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{new Date(row.purchase_date).toLocaleDateString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>
                        {row.product_name ? `${row.product_name} (${row.quantity} ${row.unit})` : row.vehicle_number || 'Payment'}
                      </td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.total_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.paid_amount).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.balance_amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background: '#f8fafc', fontWeight: 'bold'}}>
                    <td colSpan="3" style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Final Outstanding Balance:</td>
                    <td colSpan="3" style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', color: parseFloat(selectedSupplier.balance) > 0 ? 'red' : 'green'}}>
                      Rs. {Math.abs(parseFloat(selectedSupplier.balance)).toLocaleString()} ({parseFloat(selectedSupplier.balance) > 0 ? 'Payable' : 'Advance'})
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div style={{marginTop: '40px', display: 'flex', justifyContent: 'space-between'}}>
                <div style={{borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Supplier Signature</div>
                <div style={{borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Manager Signature</div>
              </div>
            </div>

            <div className="detail-body no-print" style={{padding: '24px'}}>
              {/* Date Filter Bar */}
              <div className="profit-filter-bar" style={{marginBottom: '20px', padding: '10px', background: '#f8fafc', borderRadius: '8px'}}>
                <span className="filter-label" style={{marginRight: '12px', fontWeight: 600, color: '#64748b'}}>📅 Period:</span>
                {[
                  { key:'all',   label:'All Time' },
                  { key:'today', label:'Today' },
                  { key:'week',  label:'7 Days' },
                  { key:'month', label:'Month' },
                  { key:'custom',label:'Custom Range' },
                ].map(f => (
                  <button key={f.key} onClick={() => applyLedgerFilter(f.key)}
                    className={`filter-btn ${ledgerFilter === f.key ? 'active' : ''}`}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      marginRight: '8px',
                      fontSize: '0.85rem',
                      background: ledgerFilter === f.key ? '#3b82f6' : 'white',
                      color: ledgerFilter === f.key ? 'white' : '#64748b',
                      cursor: 'pointer'
                    }}>
                    {f.label}
                  </button>
                ))}

                {ledgerFilter === 'custom' && (
                  <div className="custom-date-row" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '12px'}}>
                    <input type="date" value={ledgerFrom} onChange={e => setLedgerFrom(e.target.value)} style={{padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1'}} />
                    <span className="sep">→</span>
                    <input type="date" value={ledgerTo} onChange={e => setLedgerTo(e.target.value)} style={{padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1'}} />
                    <button className="btn-primary" onClick={() => openLedger(selectedSupplier, ledgerFrom, ledgerTo, 'custom')} style={{padding: '2px 10px', fontSize: '0.8rem'}}>Apply Range</button>
                  </div>
                )}
              </div>

              <div className="stats-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Purchases</div>
                  <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>{ledgerData.length}</div>
                </div>
                <div className="stat-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Billed Value</div>
                  <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Rs. {ledgerData.reduce((sum, item) => sum + parseFloat(item.total_amount), 0).toLocaleString()}</div>
                </div>
                <div className="stat-item" style={{ background: parseFloat(selectedSupplier.balance) > 0 ? '#fff1f2' : '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Balance</div>
                  <div style={{ fontSize: '1.25rem', color: parseFloat(selectedSupplier.balance) > 0 ? '#e11d48' : '#16a34a', fontWeight: 700 }}>
                    Rs. {Math.abs(parseFloat(selectedSupplier.balance)).toLocaleString()} 
                    <span style={{fontSize:'0.8rem', marginLeft:'8px'}}>({parseFloat(selectedSupplier.balance) > 0 ? 'Payable' : 'Advance'})</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>Loading ledger data...</div>
              ) : (
                <div className="module-table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                  <table className="module-table">
                    <thead>
                      <tr>
                        <th style={{width: '50px'}}>S.No.</th>
                        <th>Date</th>
                        <th>Product & Vehicle</th>
                        <th>Quantity & Rate</th>
                        <th>Total Bill</th>
                        <th>Paid Now</th>
                        <th>Balance Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLedgerData.length === 0 ? (
                        <tr><td colSpan="7" className="empty-msg">No purchase history found for this supplier.</td></tr>
                      ) : (
                        sortedLedgerData.map((row, index) => (
                          <tr key={row.id}>
                            <td style={{fontWeight: '700', color: '#64748b'}}>{index + 1}</td>
                            <td>{new Date(row.purchase_date).toLocaleDateString()}<br/><small style={{color:'#64748b'}}>{new Date(row.purchase_date).toLocaleTimeString()}</small></td>
                            <td>
                              {row.product_name ? (
                                <>
                                  <strong>{row.brand} {row.product_name}</strong>
                                  <br/><small style={{color:'#64748b'}}><Truck size={10}/> {row.vehicle_number || 'N/A'}</small>
                                </>
                              ) : (
                                <strong><Banknote size={14} style={{color:'#10b981', marginRight:'4px'}}/> {row.vehicle_number || 'Payment Sent'}</strong>
                              )}
                            </td>
                            <td style={{padding: '16px'}}>
                              {parseFloat(row.total_amount) > 0 ? (
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                  {user?.role === 'admin' ? (
                                    <>
                                      <input 
                                        type="number" 
                                        defaultValue={row.quantity} 
                                        style={{width: '60px', padding: '4px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                        onBlur={(e) => {
                                          if (e.target.value !== String(row.quantity)) {
                                            handleEntryUpdate(row.id, e.target.value, row.rate);
                                          }
                                        }}
                                      />
                                      <span style={{fontSize: '0.75rem', color: '#64748b'}}>{row.unit} @ Rs.</span>
                                      <input 
                                        type="number" 
                                        defaultValue={row.rate} 
                                        style={{width: '80px', padding: '4px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                        onBlur={(e) => {
                                          if (e.target.value !== String(row.rate)) {
                                            handleEntryUpdate(row.id, row.quantity, e.target.value);
                                          }
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <span style={{fontSize: '0.9rem', color: '#1e293b', fontWeight: 600}}>
                                      {row.quantity} {row.unit} @ Rs. {row.rate}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{color: '#64748b', fontSize: '0.9rem'}}>—</span>
                              )}
                            </td>
                            <td className="bold">Rs. {parseFloat(row.total_amount).toLocaleString()}</td>
                            <td className="text-green">Rs. {parseFloat(row.paid_amount).toLocaleString()}</td>
                            <td className="text-red">Rs. {parseFloat(row.balance_amount).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end'}}>
              <button className="btn-secondary" onClick={() => setShowLedgerModal(false)}>Close Ledger</button>
            </div>
          </div>
        </div>
      )}

      {/* Make Payment Modal */}
      {showPaymentModal && selectedSupplier && (() => {
        const supplierTargetAccount = paymentSource === "Bank" ? selectedBank : "Cash";
        const supplierAvailableBal = liveBalances[supplierTargetAccount] || 0;
        const isSupplierInsufficient = parseFloat(paymentForm.amount || 0) > supplierAvailableBal;
        return (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3>Make Payment to {selectedSupplier.company || selectedSupplier.name}</h3>
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
              </div>
              
              <form onSubmit={handleMakePayment} className="custom-form">
              <div style={{background: '#fff1f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontWeight: 600, color: '#e11d48'}}>Current Balance:</span>
                <span style={{fontWeight: 700, color: '#e11d48'}}>Rs. {parseFloat(selectedSupplier.balance).toLocaleString()}</span>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Amount Paid (Rs.) *</label>
                <div className="input-wrapper">
                  <Banknote size={18} />
                  <input type="number" step="0.01" required value={paymentForm.amount} placeholder="e.g. 50000"
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Payment Source *</label>
                <select 
                  value={paymentSource}
                  style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}}
                  onChange={(e) => {
                    setPaymentSource(e.target.value);
                    if (e.target.value === "Cash") setSelectedBank("");
                  }}
                >
                  <option value="Cash">Main Cash (Counter)</option>
                  <option value="Bank">Bank / Online Account</option>
                </select>
              </div>

              {/* Show Bank Dropdown ONLY if source is Bank */}
              {paymentSource === "Bank" && (
                <div className="form-group" style={{marginBottom: '15px'}}>
                  <label>Select Sending Bank *</label>
                  <select 
                    value={selectedBank} 
                    onChange={(e) => setSelectedBank(e.target.value)} 
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f0f9ff', borderColor: '#3b82f6'}}
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {bankAccounts.filter(b => !b.bank_name.toLowerCase().includes('cash')).map(b => (
                      <option key={b.id} value={b.bank_name}>{b.bank_name} - {b.account_number}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {isSupplierInsufficient && (
                <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  ⚠️ Insufficient Balance! Available: Rs. {supplierAvailableBal.toLocaleString()}
                </div>
              )}
              
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Payment Notes / Reference</label>
                <div className="input-wrapper">
                  <ClipboardList size={18} />
                  <input type="text" value={paymentForm.notes} placeholder="e.g. Paid via Check #123" required
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#10b981', borderColor: '#10b981'}} disabled={loading || isSupplierInsufficient}>
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

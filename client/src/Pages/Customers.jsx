import React, { useState, useEffect, useContext } from "react";
import { 
  Users as UsersIcon, Plus, Pencil, Trash2, X, Search, Phone, Mail, 
  MapPin, ChevronLeft, CreditCard, Banknote, UserPlus, Info, FileText
} from "lucide-react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/customers";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  balance: "0",
};

export default function Customers({ type }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(type || (user?.role === 'admin' ? "" : user?.module_type || "Wholesale"));

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user.role !== 'admin') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.role]);

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");

  const fetchRecords = async () => {
    if (!activeTab) return;
    try {
      const res = await fetch(`${API}?type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);

      const banksRes = await fetch(`http://localhost:5000/api/banks`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const banksData = await banksRes.json();
      setBankAccounts(Array.isArray(banksData) ? banksData : []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => { fetchRecords(); }, [activeTab]);

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's customer directory you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">🏢</div>
            <h3>Wholesale</h3>
            <span>Main Warehouse</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">🏪</div>
            <h3>Retail 1</h3>
            <span>Counter A</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">🏬</div>
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
      address: rec.address || "",
      balance: rec.balance,
    });
    setEditId(rec.id);
    setShowModal(true);
  };

  const openLedger = async (customer) => {
    setSelectedCustomer(customer);
    setShowLedgerModal(true);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/sales/ledger/${customer.id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLedgerData(data);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    }
    setLoading(false);
  };

  const openPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount("");
    setPaymentRef("");
    setPaymentType("Cash");
    setSelectedBank("");
    setShowPaymentModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) return alert("Enter a valid amount");
    
    let finalPaymentType = paymentType;
    if (paymentType === 'Bank') {
      if (!selectedBank) return alert("Select a bank account");
      finalPaymentType = `Bank - ${selectedBank}`;
    }

    setLoading(true);
    try {
      await fetch("http://localhost:5000/api/sales/payment", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          customer_id: selectedCustomer.id, 
          amount: parseFloat(paymentAmount), 
          payment_reference: paymentRef,
          payment_type: finalPaymentType,
          module_type: activeTab
        }),
      });
      setShowPaymentModal(false);
      fetchRecords();
      if (showLedgerModal) {
        openLedger(selectedCustomer); // refresh ledger
      }
    } catch (err) {
      console.error("Payment failed", err);
    }
    setLoading(false);
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
      console.error("Failed to save customer", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.phone || "").includes(search)
  );

  const totalReceivable = filtered.filter(r => parseFloat(r.balance) > 0).reduce((sum, r) => sum + parseFloat(r.balance), 0);
  const totalPayable = filtered.filter(r => parseFloat(r.balance) < 0).reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon" style={{background: '#eff6ff', color: '#3b82f6'}}><UsersIcon size={28} /></div>
          <div>
            <h1>{activeTab} CRM</h1>
            <p>Manage customer directory and ledger balances</p>
          </div>
        </div>

        {user?.role === 'admin' && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add New Customer
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><UsersIcon size={24} /></div>
          <div className="info">
            <span className="label">Total Customers</span>
            <span className="value">{filtered.length} Users</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><CreditCard size={24} /></div>
          <div className="info">
            <span className="label">Receivables</span>
            <span className="value">Rs. {totalReceivable.toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><Banknote size={24} /></div>
          <div className="info">
            <span className="label">Payables</span>
            <span className="value">Rs. {totalPayable.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
        <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} 
                   emptyMessage="No customers found." className="p-datatable-sm" stripedRows>
          <Column field="name" header="Customer Profile" body={(rec) => (
            <div className="prod-main-info">
              <span className="name" style={{fontWeight: 700, fontSize: '1rem', color: '#1e293b'}}>{rec.name}</span>
              <span className="v-num" style={{color: '#64748b', fontSize: '0.8rem'}}><UserPlus size={12}/> ID: #{rec.id}</span>
            </div>
          )} sortable />
          
          <Column header="Contact Details" body={(rec) => (
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.9rem', fontWeight:'600', color: '#334155'}}><Phone size={14}/> {rec.phone || "—"}</div>
              <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem', color:'#64748b'}}><Mail size={14}/> {rec.email || "—"}</div>
            </div>
          )} />
          
          <Column header="Location" body={(rec) => (
            <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.9rem', color: '#475569'}}><MapPin size={14}/> {rec.address || "—"}</div>
          )} />
          
          <Column field="balance" header="Ledger Balance" body={(rec) => (
            <span style={{fontWeight: 800, fontSize: '1rem', color: parseFloat(rec.balance) > 0 ? '#16a34a' : parseFloat(rec.balance) < 0 ? '#e11d48' : '#64748b'}}>
              Rs. {parseFloat(rec.balance).toLocaleString()}
            </span>
          )} sortable />
          
          <Column header="" body={(rec) => (
            <ActionMenu 
              onEdit={() => openEdit(rec)} 
              onDelete={() => handleDelete(rec.id)}
              extraItems={[
                { label: 'View Ledger', icon: 'pi pi-book', command: () => openLedger(rec) },
                { label: 'Receive Payment', icon: 'pi pi-money-bill', command: () => openPayment(rec) }
              ]}
            />
          )} style={{ textAlign: 'center', width: '80px' }} />
        </DataTable>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Customer Profile" : "Create New Customer"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Identity & Contact</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <div className="input-wrapper">
                    <UsersIcon size={18} />
                    <input type="text" required value={form.name} placeholder="e.g. Ali Ahmed"
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
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input type="email" value={form.email} placeholder="e.g. ali@example.com"
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Home/Office Address</label>
                  <div className="input-wrapper">
                    <MapPin size={18} />
                    <input type="text" value={form.address} placeholder="City, Area, Street"
                      onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="section-label">Financial Ledger</div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Opening Balance (Rs.)</label>
                  <div className="input-wrapper">
                    <Banknote size={18} />
                    <input type="number" value={form.balance}
                      onChange={(e) => setForm({ ...form, balance: e.target.value })} 
                      placeholder="Positive: Receivable | Negative: Payable" />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Profile" : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {showLedgerModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowLedgerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header">
              <div className="header-info" style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <UsersIcon size={24} color="#3b82f6" />
                <h3>Ledger: {selectedCustomer.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowLedgerModal(false)}><X size={20} /></button>
            </div>
            
            <div className="detail-body" style={{padding: '24px'}}>
              <div className="stats-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Sales</div>
                  <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>{ledgerData.length}</div>
                </div>
                <div className="stat-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Billed Value</div>
                  <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Rs. {ledgerData.reduce((sum, item) => sum + parseFloat(item.total_amount), 0).toLocaleString()}</div>
                </div>
                <div className="stat-item" style={{ background: parseFloat(selectedCustomer.balance) > 0 ? '#fff1f2' : '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Balance</div>
                  <div style={{ fontSize: '1.25rem', color: parseFloat(selectedCustomer.balance) > 0 ? '#e11d48' : '#16a34a', fontWeight: 700 }}>
                    Rs. {Math.abs(parseFloat(selectedCustomer.balance)).toLocaleString()} 
                    <span style={{fontSize:'0.8rem', marginLeft:'8px'}}>({parseFloat(selectedCustomer.balance) > 0 ? 'Receivable' : 'Advance'})</span>
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
                        <th>Date</th>
                        <th>Bill No.</th>
                        <th>Details</th>
                        <th>Total Bill</th>
                        <th>Paid Amount</th>
                        <th>Balance Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerData.length === 0 ? (
                        <tr><td colSpan="6" className="empty-msg">No history found.</td></tr>
                      ) : (
                        ledgerData.map((row) => (
                          <tr key={row.id}>
                            <td>{new Date(row.created_at).toLocaleDateString()}<br/><small style={{color:'#64748b'}}>{new Date(row.created_at).toLocaleTimeString()}</small></td>
                            <td>#SAL-{row.id}</td>
                            <td>
                              {parseFloat(row.total_amount) > 0 ? (
                                <strong>Products Sold</strong>
                              ) : (
                                <strong><Banknote size={14} style={{color:'#10b981', marginRight:'4px'}}/> Payment Received</strong>
                              )}
                              <br/>
                              <small style={{color:'#64748b'}}>{row.payment_type}</small>
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
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Receive Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePayment} className="custom-form">
              <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0'}}>
                <div style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600}}>Customer</div>
                <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#1e293b'}}>{selectedCustomer.name}</div>
                <div style={{marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: '0.85rem', color: '#64748b'}}>Current Balance:</span>
                  <span style={{fontWeight: 700, color: parseFloat(selectedCustomer.balance) > 0 ? '#e11d48' : '#16a34a'}}>
                    Rs. {Math.abs(parseFloat(selectedCustomer.balance)).toLocaleString()} {parseFloat(selectedCustomer.balance) > 0 ? '(Receivable)' : '(Advance)'}
                  </span>
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Payment Amount *</label>
                <div className="input-wrapper">
                  <Banknote size={18} />
                  <input type="number" required min="1" value={paymentAmount} placeholder="e.g. 5000"
                    onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Payment Method *</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}}>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {paymentType === 'Bank' && (
                <div className="form-group" style={{marginBottom: '15px'}}>
                  <label>Select Receiving Bank *</label>
                  <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}}>
                    <option value="">Select Admin Bank</option>
                    {bankAccounts.map(b => {
                      const digits = b.account_number ? b.account_number.slice(-4) : '';
                      return <option key={b.id} value={`${b.bank_name} ${digits ? `(****${digits})` : ''}`}>{b.bank_name} {digits ? `(****${digits})` : ''}</option>;
                    })}
                  </select>
                </div>
              )}

              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Reference / Note (Optional)</label>
                <div className="input-wrapper">
                  <FileText size={18} />
                  <input type="text" value={paymentRef} placeholder="e.g. Sent via Easypaisa"
                    onChange={(e) => setPaymentRef(e.target.value)} />
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

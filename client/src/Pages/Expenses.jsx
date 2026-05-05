import React, { useState, useEffect, useContext } from "react";
import { 
  Receipt, Plus, Pencil, Trash2, X, Search, 
  Home, Building2, Coffee, Zap, UserMinus, Wallet,
  Calendar, Tag, FileText, CircleDollarSign, ChevronLeft
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ActionMenu from '../components/ActionMenu';
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/expenses";

const emptyForm = {
  title: "",
  expense_type: "Office",
  category: "General",
  amount: "",
  expense_date: new Date().toISOString().split('T')[0],
  notes: "",
  payment_source: "Cash",
  bank_name: ""
};

const CATEGORIES = {
  Office: ["Rent", "Electricity", "Staff Tea", "Stationery", "Internet", "Maintenance", "Other"],
  House: ["Grocery", "Personal Withdrawal", "Utility Bills", "Education", "Travel", "Other"]
};

export default function Expenses({ type }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(type || user?.module_type || "Wholesale");
  const [records, setRecords] = useState([]);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type) {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type]);

  const fetchRecords = async () => {
    if (!activeTab) return;
    try {
      const res = await fetch(`${API}?type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBanks(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchRecords();
    fetchBanks();
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API}/${editId}` : API;
      
      // Determine final payment type
      const finalPaymentType = form.payment_source === 'Bank' ? `Bank - ${form.bank_name}` : 'Cash';
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, payment_type: finalPaymentType, module_type: activeTab }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchRecords();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchRecords();
    } catch (err) { console.error(err); }
  };

  const filtered = records.filter(r => {
    const matchType = filterType === "All" || r.expense_type === filterType;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                        (r.category || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon expense-icon" style={{background: '#fef2f2', color: '#ef4444'}}><Receipt size={28} /></div>
          <div>
            <h1>{activeTab} Expenses</h1>
            <p>Track office overheads and personal expenditures</p>
          </div>
        </div>

        {user?.role === 'admin' && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true); }}>
          <Plus size={18} /> Record Expense
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><Building2 size={24} /></div>
          <div className="info">
            <span className="label">Office Total</span>
            <span className="value">Rs. {records.filter(r => r.expense_type === "Office").reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon orange"><Home size={24} /></div>
          <div className="info">
            <span className="label">House Total</span>
            <span className="value">Rs. {records.filter(r => r.expense_type === "House").reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><Wallet size={24} /></div>
          <div className="info">
            <span className="label">Grand Total</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group" style={{display:'flex', gap:'10px'}}>
           {["All", "Office", "House"].map(t => (
             <button key={t} className={`tab-btn ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>{t}</button>
           ))}
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type / Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="empty-msg">No expenses found for {activeTab}.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.expense_date).toLocaleDateString()}</td>
                  <td>
                    <div className="prod-main-info">
                      <span className={`type-tag ${r.expense_type.toLowerCase()}`} style={{fontSize:'0.7rem', width:'fit-content'}}>
                        {r.expense_type}
                      </span>
                      <span className="v-num">{r.category}</span>
                    </div>
                  </td>
                  <td className="bold">
                    {r.title}
                    <div style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 400}}>
                      Payment: {r.payment_type || 'Cash'}
                    </div>
                  </td>
                  <td className="bold text-red">Rs. {parseFloat(r.amount).toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <ActionMenu 
                      onEdit={() => { setForm(r); setEditId(r.id); setShowModal(true); }}
                      onDelete={() => handleDelete(r.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Expense Entry" : "Record New Expense"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Category & Date</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Expense Type</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <select value={form.expense_type} onChange={(e) => setForm({...form, expense_type: e.target.value, category: CATEGORIES[e.target.value][0]})}>
                      <option value="Office">Office Expense</option>
                      <option value="House">House Expense</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <div className="input-wrapper">
                    <FileText size={18} />
                    <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                      {CATEGORIES[form.expense_type].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Expense Date</label>
                  <div className="input-wrapper">
                    <Calendar size={18} />
                    <input type="date" value={form.expense_date} onChange={(e) => setForm({...form, expense_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Amount (Rs.) *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" required value={form.amount} placeholder="0.00" onChange={(e) => setForm({...form, amount: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="section-label">Payment Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Payment Source *</label>
                  <div className="input-wrapper">
                    <Wallet size={18} />
                    <select 
                      value={form.payment_source || 'Cash'} 
                      onChange={(e) => setForm({...form, payment_source: e.target.value, bank_name: e.target.value === 'Bank' ? (banks[0]?.bank_name || '') : ''})}
                    >
                      <option value="Cash">Cash Payment</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                {form.payment_source === 'Bank' && (
                  <div className="form-group">
                    <label>Select Bank *</label>
                    <div className="input-wrapper">
                      <Building2 size={18} />
                      <select 
                        value={form.bank_name} 
                        required
                        onChange={(e) => setForm({...form, bank_name: e.target.value})}
                      >
                        <option value="">Choose Bank...</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.bank_name}>{b.bank_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="section-label">Description & Notes</div>
              <div className="form-group full-width">
                <label>Expense Title *</label>
                <div className="input-wrapper">
                  <Receipt size={18} />
                  <input type="text" required value={form.title} placeholder="e.g. Electricity Bill July" onChange={(e) => setForm({...form, title: e.target.value})} />
                </div>
              </div>
              <div className="form-group full-width" style={{marginTop:'15px'}}>
                <textarea rows="2" placeholder="Add any specific details or notes..." value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Processing..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

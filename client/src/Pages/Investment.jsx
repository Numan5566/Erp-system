import React, { useState, useEffect, useContext } from "react";
import { 
  TrendingUp, Plus, Pencil, Trash2, X, Activity, CheckCircle, Search,
  CircleDollarSign, Calendar, Tag, Briefcase, BarChart3, Info
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/investment";

const CATEGORIES = ["Real Estate", "Stock Market", "Business", "Gold", "Bonds", "Fixed Deposit", "Other"];

const emptyForm = {
  title: "",
  investor: "",
  category: "Business",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function Investment({ type }) {
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
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    if (!activeTab) return;
    try {
      const res = await fetch(`${API}?type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch investments", err);
    }
  };

  useEffect(() => { fetchRecords(); }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API}/${editId}` : API;
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, module_type: activeTab }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchRecords();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this investment record?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch = (r.title || "").toLowerCase().includes(search.toLowerCase()) || 
                        (r.investor || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || r.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's investment portfolio you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">📈</div>
            <h3>Wholesale</h3>
            <span>Master Investment</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">💰</div>
            <h3>Retail 1</h3>
            <span>Counter A Fund</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">💎</div>
            <h3>Retail 2</h3>
            <span>Counter B Fund</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon" style={{background: '#f0fdf4', color: '#10b981'}}><TrendingUp size={28} /></div>
          <div>
            <h1>{activeTab} Investments</h1>
            <p>Monitor capital growth and asset performance</p>
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
          <Plus size={18} /> Add Investment
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><Briefcase size={24} /></div>
          <div className="info">
            <span className="label">Total Capital</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><BarChart3 size={24} /></div>
          <div className="info">
            <span className="label">Total Assets</span>
            <span className="value">{records.length} Portfolios</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon orange"><CircleDollarSign size={24} /></div>
          <div className="info">
            <span className="label">Avg Investment</span>
            <span className="value">Rs. {records.length ? (records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0) / records.length).toLocaleString() : 0}</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search investment or investor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
           <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="tab-select">
             <option value="All">All Categories</option>
             {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Investment / Asset</th>
              <th>Investor</th>
              <th>Amount</th>
              <th>Category</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty-msg">No investments found for {activeTab}.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td><div className="bold">{new Date(r.date).toLocaleDateString()}</div></td>
                  <td><span className="bold">{r.title}</span></td>
                  <td><div style={{display:'flex', alignItems:'center', gap:'4px'}}><Tag size={12}/> {r.investor || '—'}</div></td>
                  <td className="bold text-green">Rs. {parseFloat(r.amount).toLocaleString()}</td>
                  <td><span className="type-tag office" style={{fontSize:'0.75rem'}}>{r.category}</span></td>
                  <td>
                    <div className="adjust-btns">
                      <button className="btn-adjust plus" onClick={() => { setForm(r); setEditId(r.id); setShowModal(true); }}><Pencil size={14}/></button>
                      <button className="btn-adjust minus" onClick={() => handleDelete(r.id)}><Trash2 size={14}/></button>
                    </div>
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
              <h3>{editId ? "Edit Investment" : "Record New Investment"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Asset Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Investment Name *</label>
                  <div className="input-wrapper">
                    <TrendingUp size={18} />
                    <input type="text" required value={form.title} placeholder="e.g. New Warehouse Plot"
                      onChange={(e) => setForm({...form, title: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Investor/Owner</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <input type="text" value={form.investor} placeholder="Who invested?"
                      onChange={(e) => setForm({...form, investor: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <div className="input-wrapper">
                    <Briefcase size={18} />
                    <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Investment Date</label>
                  <div className="input-wrapper">
                    <Calendar size={18} />
                    <input type="date" value={form.date}
                      onChange={(e) => setForm({...form, date: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="section-label">Financial Value</div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Amount (Rs.) *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" required value={form.amount} placeholder="0.00"
                      onChange={(e) => setForm({...form, amount: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="section-label">Additional Notes</div>
              <div className="form-group full-width">
                <textarea rows="2" placeholder="Describe the investment or terms..." value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Processing..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

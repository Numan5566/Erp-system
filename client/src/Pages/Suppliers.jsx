import React, { useState, useEffect, useContext } from "react";
import { 
  Truck, Plus, Pencil, Trash2, X, Search, Phone, Mail, 
  MapPin, Building, CreditCard, Banknote, ClipboardList, Package
} from "lucide-react";
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

  const fetchRecords = async () => {
    if (!activeTab) return;
    try {
      const res = await fetch(`${API}?type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    }
  };

  useEffect(() => { fetchRecords(); }, [activeTab]);

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
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
    if (!window.confirm("Delete this supplier?")) return;
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

        {user?.role === 'admin' && !type && (
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

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Company / Brand</th>
              <th>Contact Person</th>
              <th>Location</th>
              <th>Ledger Balance</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="empty-msg">No suppliers found in {activeTab}.</td></tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div className="prod-main-info">
                      <span className="name">{rec.company || "N/A"}</span>
                      <span className="v-num"><Package size={12}/> {rec.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.85rem', fontWeight:'600'}}><Phone size={12}/> {rec.phone || "—"}</div>
                      <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem', color:'#94a3b8'}}><Mail size={12}/> {rec.email || "—"}</div>
                    </div>
                  </td>
                  <td><div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.85rem'}}><MapPin size={12}/> {rec.address || "—"}</div></td>
                  <td className="bold">
                    <span className={parseFloat(rec.balance) > 0 ? 'text-red' : parseFloat(rec.balance) < 0 ? 'text-green' : ''}>
                      Rs. {Math.abs(parseFloat(rec.balance)).toLocaleString()}
                      <small style={{display:'block', fontSize:'0.65rem', fontWeight:'normal'}}>
                        {parseFloat(rec.balance) > 0 ? 'Payable' : parseFloat(rec.balance) < 0 ? 'Advance' : 'Clear'}
                      </small>
                    </span>
                  </td>
                  <td>
                    <div className="adjust-btns">
                      <button className="btn-adjust plus" onClick={() => openEdit(rec)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn-adjust minus" onClick={() => handleDelete(rec.id)} title="Delete"><Trash2 size={14} /></button>
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
    </div>
  );
}

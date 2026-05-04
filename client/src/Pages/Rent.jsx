import React, { useState, useEffect, useContext } from "react";
import { 
  Home, Plus, Pencil, Trash2, X, CheckCircle, Clock, Search,
  Calendar, User, Building, CircleDollarSign, Tag, Info
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/rent";

const emptyForm = {
  property_name: "",
  landlord_name: "",
  amount: "",
  rent_date: new Date().toISOString().split("T")[0],
  status: "Paid",
  notes: "",
};

export default function Rent({ type }) {
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
  const [filterStatus, setFilterStatus] = useState("All");
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
      console.error("Failed to fetch rent records", err);
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
    if (!window.confirm("Delete this rent record?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch = (r.property_name || "").toLowerCase().includes(search.toLowerCase()) ||
                        (r.landlord_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's rent & property records you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">🏢</div>
            <h3>Wholesale</h3>
            <span>Main Warehouse Rent</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">🏠</div>
            <h3>Retail 1</h3>
            <span>Counter A Rent</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">🏬</div>
            <h3>Retail 2</h3>
            <span>Counter B Rent</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon rent-icon" style={{background: '#fef2f2', color: '#ef4444'}}><Home size={28} /></div>
          <div>
            <h1>{activeTab} Rent Management</h1>
            <p>Track property lease and monthly rent schedules</p>
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
          <Plus size={18} /> Record Rent
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><Building size={24} /></div>
          <div className="info">
            <span className="label">Total Properties</span>
            <span className="value">{new Set(records.map(r => r.property_name)).size} Units</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><CircleDollarSign size={24} /></div>
          <div className="info">
            <span className="label">Total Paid (Rs.)</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><CheckCircle size={24} /></div>
          <div className="info">
            <span className="label">Settled Bills</span>
            <span className="value">{records.filter(r => r.status === 'Paid').length} Paid</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search property or landlord..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="tab-select">
             <option value="All">All Status</option>
             <option value="Paid">Paid</option>
             <option value="Pending">Pending</option>
           </select>
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Property / Unit</th>
              <th>Landlord</th>
              <th>Rent Amount</th>
              <th>Status</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty-msg">No rent records found for {activeTab}.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td><div className="bold">{new Date(r.rent_date).toLocaleDateString()}</div></td>
                  <td><span className="bold">{r.property_name}</span></td>
                  <td><div style={{display:'flex', alignItems:'center', gap:'4px'}}><User size={12}/> {r.landlord_name || '—'}</div></td>
                  <td className="bold text-red">Rs. {parseFloat(r.amount).toLocaleString()}</td>
                  <td><span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
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
              <h3>{editId ? "Edit Rent Record" : "Add Rent Payment"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Property Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Property/Shop Name *</label>
                  <div className="input-wrapper">
                    <Building size={18} />
                    <input type="text" required value={form.property_name} placeholder="e.g. Warehouse A"
                      onChange={(e) => setForm({...form, property_name: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Landlord Name</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input type="text" value={form.landlord_name} placeholder="Owner of property"
                      onChange={(e) => setForm({...form, landlord_name: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="section-label">Payment Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Rent Amount (Rs.) *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" required value={form.amount} placeholder="0.00"
                      onChange={(e) => setForm({...form, amount: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Date</label>
                  <div className="input-wrapper">
                    <Calendar size={18} />
                    <input type="date" value={form.rent_date}
                      onChange={(e) => setForm({...form, rent_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="section-label">Additional Notes</div>
              <div className="form-group full-width">
                <textarea rows="2" placeholder="Any specific details about this payment..." value={form.notes}
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

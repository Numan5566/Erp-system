import React, { useState, useEffect } from "react";
import { Users as UsersIcon, Plus, Pencil, Trash2, X, Search, Phone, Mail, MapPin } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/customers";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  balance: "0",
};

export default function Customers() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch(API, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

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
        body: JSON.stringify(form),
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
          <div className="module-icon investment-icon"><UsersIcon size={28} /></div>
          <div>
            <h1>Customer CRM</h1>
            <p>Manage customer contacts and ledger balances</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add New Customer
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Customers</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Receivable</span>
          <span className="summary-value green">Rs. {totalReceivable.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Payable</span>
          <span className="summary-value red">Rs. {totalPayable.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active Ledger</span>
          <span className="summary-value accent">{filtered.filter(r => parseFloat(r.balance) !== 0).length}</span>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Balance (Rs.)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="empty-row">No customers found.</td></tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id}>
                  <td><strong>{rec.name}</strong></td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem'}}><Phone size={12}/> {rec.phone || "—"}</div>
                      <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.8rem', color:'#94a3b8'}}><Mail size={12}/> {rec.email || "—"}</div>
                    </div>
                  </td>
                  <td><div style={{display:'flex', alignItems:'center', gap:'4px'}}><MapPin size={12}/> {rec.address || "—"}</div></td>
                  <td className={`amount ${parseFloat(rec.balance) > 0 ? 'green' : parseFloat(rec.balance) < 0 ? 'red' : ''}`}>
                    Rs. {parseFloat(rec.balance).toLocaleString()}
                  </td>
                  <td className="actions">
                    <button className="btn-icon edit" onClick={() => openEdit(rec)}><Pencil size={15} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(rec.id)}><Trash2 size={15} /></button>
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
              <h3>{editId ? "Edit Customer" : "Add Customer"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group full-width">
                <label>Customer Name *</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <input type="text" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Opening Balance (Rs.)</label>
                <input type="number" value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })} 
                  placeholder="Positive for receivable, Negative for payable" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

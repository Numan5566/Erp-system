import React, { useState, useEffect, useContext } from "react";
import { Landmark, Plus, Trash2, Search, X, Hash, CreditCard } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

export default function Accounts() {
  const { user } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ bank_name: "", account_title: "", account_number: "" });
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch bank accounts", err);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  if (user?.role !== 'admin') {
    return <div style={{padding: '40px', textAlign: 'center'}}><h2>Access Denied</h2><p>Only Administrators can manage Bank Accounts.</p></div>;
  }

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
      console.error("Failed to add bank account", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) return;
    try {
      await fetch(`http://localhost:5000/api/banks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to delete account", err);
    }
  };

  const filtered = accounts.filter(acc => acc.bank_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon" style={{background: '#e0f2fe', color: '#0ea5e9'}}><Landmark size={28} /></div>
          <div>
            <h1>Bank Accounts</h1>
            <p>Manage supported payment methods and bank accounts</p>
          </div>
        </div>
        <div className="module-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Bank Account
          </button>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Account Title</th>
              <th>Account Number</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="4" className="empty-msg">No bank accounts added yet.</td></tr>
            ) : (
              filtered.map(acc => (
                <tr key={acc.id}>
                  <td>
                    <div className="prod-main-info">
                      <span className="name">{acc.bank_name}</span>
                    </div>
                  </td>
                  <td>{acc.account_title || "—"}</td>
                  <td><div style={{display:'flex', alignItems:'center', gap:'6px'}}><Hash size={14} color="#64748b"/> {acc.account_number || "—"}</div></td>
                  <td>
                    <div className="adjust-btns" style={{justifyContent: 'center'}}>
                      <button className="btn-adjust minus" onClick={() => handleDelete(acc.id)} title="Delete"><Trash2 size={14} /></button>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Add New Bank Account</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="custom-form">
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Bank Name (e.g. Meezan, UBL, Easypaisa) *</label>
                <div className="input-wrapper">
                  <Landmark size={18} />
                  <input type="text" required value={form.bank_name} placeholder="e.g. Meezan Bank"
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Account Title</label>
                <div className="input-wrapper">
                  <CreditCard size={18} />
                  <input type="text" value={form.account_title} placeholder="e.g. Ali Traders"
                    onChange={(e) => setForm({ ...form, account_title: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Account Number (IBAN/Phone)</label>
                <div className="input-wrapper">
                  <Hash size={18} />
                  <input type="text" value={form.account_number} placeholder="e.g. PK00MEZN..."
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Add Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

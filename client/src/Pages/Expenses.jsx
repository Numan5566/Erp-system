import React, { useState, useEffect } from "react";
import { Wallet, Plus, Pencil, Trash2, X, Search, CreditCard } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/expenses";

const CATEGORIES = ["Office", "Travel", "Food", "Repairs", "Marketing", "Electricity", "Internet", "Water", "Other"];

const emptyForm = {
  title: "",
  category: "Office",
  amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function Expenses() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch(API, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      title: rec.title,
      category: rec.category || "Office",
      amount: rec.amount,
      expense_date: rec.expense_date?.split("T")[0] || "",
      notes: rec.notes || "",
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
      console.error("Failed to save expense", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => 
    r.title.toLowerCase().includes(search.toLowerCase()) &&
    (filterCategory === "All" || r.category === filterCategory)
  );

  const totalAmount = filtered.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon"><Wallet size={28} /></div>
          <div>
            <h1>Daily Expenses</h1>
            <p>Track your business operational costs and bills</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add New Expense
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Expenses</span>
          <span className="summary-value red">Rs. {totalAmount.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Records</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Average</span>
          <span className="summary-value accent">Rs. {filtered.length ? Math.round(totalAmount/filtered.length).toLocaleString() : 0}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Categories</span>
          <span className="summary-value orange">{new Set(filtered.map(r => r.category)).size}</span>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search expense..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Amount (Rs.)</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">No expenses found.</td></tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id}>
                  <td><strong>{rec.title}</strong></td>
                  <td><span className="tag">{rec.category}</span></td>
                  <td className="amount red">Rs. {parseFloat(rec.amount).toLocaleString()}</td>
                  <td>{rec.expense_date?.split("T")[0]}</td>
                  <td className="notes">{rec.notes || "—"}</td>
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
              <h3>{editId ? "Edit Expense" : "Add Expense"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group full-width">
                <label>Expense Title *</label>
                <input type="text" required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  placeholder="e.g. Electricity Bill, Stationery" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (Rs.) *</label>
                  <input type="number" required value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Expense Date</label>
                <input type="date" value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

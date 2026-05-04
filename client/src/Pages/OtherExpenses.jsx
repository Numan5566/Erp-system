import React, { useState, useEffect } from "react";
import { MoreHorizontal, Plus, Pencil, Trash2, X, Search } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/other-expenses";

const CATEGORIES = [
  "Utilities", "Maintenance", "Office Supplies", "Marketing",
  "Legal", "Insurance", "Miscellaneous", "Other"
];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online", "Credit Card"];

const emptyForm = {
  title: "",
  category: "Miscellaneous",
  amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  payment_method: "Cash",
  notes: "",
};

export default function OtherExpenses() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMethod, setFilterMethod] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch other expenses", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      title: rec.title,
      category: rec.category || "Miscellaneous",
      amount: rec.amount,
      expense_date: rec.expense_date?.split("T")[0] || "",
      payment_method: rec.payment_method || "Cash",
      notes: rec.notes || "",
    });
    setEditId(rec.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await fetch(`${API}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      console.error("Failed to save expense", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense record?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || r.category === filterCategory;
    const matchMethod = filterMethod === "All" || r.payment_method === filterMethod;
    return matchSearch && matchCategory && matchMethod;
  });

  const totalAmount = filtered.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  // Category breakdown
  const categoryTotals = CATEGORIES.map(cat => ({
    name: cat,
    total: filtered.filter(r => r.category === cat).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
  })).filter(c => c.total > 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon otherexp-icon"><MoreHorizontal size={28} /></div>
          <div>
            <h1>Other Expenses</h1>
            <p>Track miscellaneous and additional business expenses</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd} id="add-otherexp-btn">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Records</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Spent</span>
          <span className="summary-value accent">Rs. {totalAmount.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Categories</span>
          <span className="summary-value">{categoryTotals.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">This Month</span>
          <span className="summary-value orange">
            Rs. {filtered
              .filter(r => new Date(r.expense_date).getMonth() === new Date().getMonth())
              .reduce((s, r) => s + parseFloat(r.amount || 0), 0)
              .toLocaleString()}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <div className="breakdown-row">
          {categoryTotals.map(c => (
            <div key={c.name} className="breakdown-chip">
              <span className="chip-label">{c.name}</span>
              <span className="chip-value">Rs. {c.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search expense title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="otherexp-search"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} id="otherexp-cat-filter">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} id="otherexp-method-filter">
          <option value="All">All Payment Methods</option>
          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount (Rs.)</th>
              <th>Date</th>
              <th>Payment Method</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="empty-row">No expense records found.</td></tr>
            ) : (
              filtered.map((rec, idx) => (
                <tr key={rec.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{rec.title}</strong></td>
                  <td><span className="tag">{rec.category || "—"}</span></td>
                  <td className="amount">Rs. {parseFloat(rec.amount).toLocaleString()}</td>
                  <td>{rec.expense_date?.split("T")[0] || "—"}</td>
                  <td><span className="badge badge-paid">{rec.payment_method}</span></td>
                  <td className="notes">{rec.notes || "—"}</td>
                  <td className="actions">
                    <button className="btn-icon edit" onClick={() => openEdit(rec)} title="Edit"><Pencil size={15} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(rec.id)} title="Delete"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Total</strong></td>
                <td className="amount"><strong>Rs. {totalAmount.toLocaleString()}</strong></td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Expense" : "Add Expense"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Generator Repair, AC Maintenance" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (Rs.) *</label>
                  <input type="number" required min="0" step="0.01" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 5000" />
                </div>
                <div className="form-group">
                  <label>Expense Date</label>
                  <input type="date" value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Expense" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

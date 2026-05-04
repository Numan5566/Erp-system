import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, Pencil, Trash2, X, Activity, CheckCircle, Search } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/investments";

const CATEGORIES = ["Real Estate", "Stock Market", "Business", "Gold", "Bonds", "Fixed Deposit", "Other"];

const emptyForm = {
  investment_name: "",
  category: "Business",
  amount_invested: "",
  expected_return: "",
  investment_date: new Date().toISOString().split("T")[0],
  status: "Active",
  notes: "",
};

export default function Investment() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch investments", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      investment_name: rec.investment_name,
      category: rec.category || "Business",
      amount_invested: rec.amount_invested,
      expected_return: rec.expected_return || "",
      investment_date: rec.investment_date?.split("T")[0] || "",
      status: rec.status,
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
      console.error("Failed to save investment", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this investment record?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch = r.investment_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchCategory = filterCategory === "All" || r.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalInvested = filtered.reduce((sum, r) => sum + parseFloat(r.amount_invested || 0), 0);
  const totalExpected = filtered.reduce((sum, r) => sum + parseFloat(r.expected_return || 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon"><TrendingUp size={28} /></div>
          <div>
            <h1>Investment Tracker</h1>
            <p>Monitor your investments, returns, and portfolio status</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd} id="add-investment-btn">
          <Plus size={18} /> Add Investment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Investments</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Invested</span>
          <span className="summary-value accent">Rs. {totalInvested.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Expected Returns</span>
          <span className="summary-value green">Rs. {totalExpected.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active</span>
          <span className="summary-value green">{filtered.filter(r => r.status === "Active").length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search investment name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="investment-search"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} id="investment-status-filter">
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Withdrawn">Withdrawn</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} id="investment-category-filter">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Investment Name</th>
              <th>Category</th>
              <th>Amount Invested (Rs.)</th>
              <th>Expected Return (Rs.)</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className="empty-row">No investment records found.</td></tr>
            ) : (
              filtered.map((rec, idx) => (
                <tr key={rec.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{rec.investment_name}</strong></td>
                  <td><span className="tag">{rec.category || "—"}</span></td>
                  <td className="amount">Rs. {parseFloat(rec.amount_invested).toLocaleString()}</td>
                  <td className="amount green">Rs. {parseFloat(rec.expected_return || 0).toLocaleString()}</td>
                  <td>{rec.investment_date?.split("T")[0] || "—"}</td>
                  <td>
                    <span className={`badge badge-${rec.status?.toLowerCase()}`}>
                      {rec.status === "Active" ? <Activity size={12} /> : <CheckCircle size={12} />}
                      {rec.status}
                    </span>
                  </td>
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
                <td colSpan="3"><strong>Totals</strong></td>
                <td className="amount"><strong>Rs. {totalInvested.toLocaleString()}</strong></td>
                <td className="amount green"><strong>Rs. {totalExpected.toLocaleString()}</strong></td>
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
              <h3>{editId ? "Edit Investment" : "Add Investment"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Investment Name *</label>
                  <input type="text" required value={form.investment_name}
                    onChange={(e) => setForm({ ...form, investment_name: e.target.value })}
                    placeholder="e.g. Plot in DHA, Stock Portfolio" />
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
                  <label>Amount Invested (Rs.) *</label>
                  <input type="number" required min="0" step="0.01" value={form.amount_invested}
                    onChange={(e) => setForm({ ...form, amount_invested: e.target.value })}
                    placeholder="e.g. 500000" />
                </div>
                <div className="form-group">
                  <label>Expected Return (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={form.expected_return}
                    onChange={(e) => setForm({ ...form, expected_return: e.target.value })}
                    placeholder="e.g. 600000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Investment Date</label>
                  <input type="date" value={form.investment_date}
                    onChange={(e) => setForm({ ...form, investment_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Investment" : "Add Investment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

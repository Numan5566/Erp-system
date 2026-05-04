import React, { useState, useEffect } from "react";
import { Home, Plus, Pencil, Trash2, X, CheckCircle, Clock, Search } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/rent";

const emptyForm = {
  property_name: "",
  landlord_name: "",
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  status: "Paid",
  notes: "",
};

export default function Rent() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch rent records", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      property_name: rec.property_name,
      landlord_name: rec.landlord_name || "",
      amount: rec.amount,
      payment_date: rec.payment_date?.split("T")[0] || "",
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
      console.error("Failed to save rent record", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rent record?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch =
      r.property_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.landlord_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon rent-icon"><Home size={28} /></div>
          <div>
            <h1>Rent Management</h1>
            <p>Track all property rent payments and records</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd} id="add-rent-btn">
          <Plus size={18} /> Add Rent Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Records</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Amount</span>
          <span className="summary-value accent">Rs. {totalAmount.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Paid</span>
          <span className="summary-value green">{filtered.filter(r => r.status === "Paid").length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Pending</span>
          <span className="summary-value orange">{filtered.filter(r => r.status === "Pending").length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search property or landlord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="rent-search"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} id="rent-status-filter">
          <option value="All">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Property Name</th>
              <th>Landlord</th>
              <th>Amount (Rs.)</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="empty-row">No rent records found.</td></tr>
            ) : (
              filtered.map((rec, idx) => (
                <tr key={rec.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{rec.property_name}</strong></td>
                  <td>{rec.landlord_name || "—"}</td>
                  <td className="amount">Rs. {parseFloat(rec.amount).toLocaleString()}</td>
                  <td>{rec.payment_date?.split("T")[0] || "—"}</td>
                  <td>
                    <span className={`badge badge-${rec.status?.toLowerCase()}`}>
                      {rec.status === "Paid" ? <CheckCircle size={12} /> : <Clock size={12} />}
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
              <h3>{editId ? "Edit Rent Record" : "Add Rent Record"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Property Name *</label>
                  <input type="text" required value={form.property_name}
                    onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                    placeholder="e.g. Main Shop, Warehouse A" />
                </div>
                <div className="form-group">
                  <label>Landlord Name</label>
                  <input type="text" value={form.landlord_name}
                    onChange={(e) => setForm({ ...form, landlord_name: e.target.value })}
                    placeholder="e.g. Mr. Ahmed" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (Rs.) *</label>
                  <input type="number" required min="0" step="0.01" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 25000" />
                </div>
                <div className="form-group">
                  <label>Payment Date</label>
                  <input type="date" value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
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
                  {loading ? "Saving..." : editId ? "Update Record" : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

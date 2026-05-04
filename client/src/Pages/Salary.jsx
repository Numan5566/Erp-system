import React, { useState, useEffect } from "react";
import { Banknote, Plus, Pencil, Trash2, X, Search, CheckCircle, Clock } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/salary";

const STATUSES = ["Paid", "Pending", "Processing", "Cancelled"];

const emptyForm = {
  employee_name: "",
  designation: "",
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  status: "Paid",
  notes: "",
};

export default function Salary() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch(API, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch salary records", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      employee_name: rec.employee_name,
      designation: rec.designation || "",
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
      console.error("Failed to save salary record", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this salary record?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch = r.employee_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSalary = filtered.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon"><Banknote size={28} /></div>
          <div>
            <h1>Salary Management</h1>
            <p>Track employee payroll and payment history</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Salary Record
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Payments</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Amount</span>
          <span className="summary-value accent">Rs. {totalSalary.toLocaleString()}</span>
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

      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Amount (Rs.)</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No records found.</td></tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id}>
                  <td><strong>{rec.employee_name}</strong></td>
                  <td>{rec.designation || "—"}</td>
                  <td className="amount">Rs. {parseFloat(rec.amount).toLocaleString()}</td>
                  <td>{rec.payment_date?.split("T")[0]}</td>
                  <td>
                    <span className={`badge badge-${rec.status.toLowerCase()}`}>
                      {rec.status === "Paid" ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {rec.status}
                    </span>
                  </td>
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
              <h3>{editId ? "Edit Salary" : "Add Salary"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Employee Name *</label>
                  <input type="text" required value={form.employee_name}
                    onChange={(e) => setForm({ ...form, employee_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input type="text" value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (Rs.) *</label>
                  <input type="number" required value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
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

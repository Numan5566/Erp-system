import React, { useState, useEffect } from "react";
import { Truck, Plus, Pencil, Trash2, X, Search, CheckCircle, Clock, MapPin } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/transport";

const STATUSES = ["Pending", "In Transit", "Delivered", "Cancelled"];

const emptyForm = {
  vehicle_number: "",
  driver_name: "",
  customer_name: "",
  destination: "",
  fare_amount: "",
  expense_amount: "",
  transport_date: new Date().toISOString().split("T")[0],
  status: "Pending",
};

export default function Transport() {
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
      console.error("Failed to fetch transport records", err);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => {
    setForm({
      vehicle_number: rec.vehicle_number || "",
      driver_name: rec.driver_name || "",
      customer_name: rec.customer_name || "",
      destination: rec.destination || "",
      fare_amount: rec.fare_amount,
      expense_amount: rec.expense_amount || "",
      transport_date: rec.transport_date?.split("T")[0] || "",
      status: rec.status,
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
      console.error("Failed to save transport record", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transport record?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter((r) => {
    const matchSearch = 
      (r.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.driver_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.vehicle_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalFare = filtered.reduce((sum, r) => sum + parseFloat(r.fare_amount || 0), 0);
  const totalExpense = filtered.reduce((sum, r) => sum + parseFloat(r.expense_amount || 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon"><Truck size={28} /></div>
          <div>
            <h1>Transport Management</h1>
            <p>Track vehicles, drivers, and delivery fares</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Transport Record
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Fare</span>
          <span className="summary-value accent">Rs. {totalFare.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Expense</span>
          <span className="summary-value red">Rs. {totalExpense.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Net Profit</span>
          <span className="summary-value green">Rs. {(totalFare - totalExpense).toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Delivered</span>
          <span className="summary-value green">{filtered.filter(r => r.status === "Delivered").length}</span>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search customer, driver or vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Customer</th>
              <th>Destination</th>
              <th>Fare (Rs.)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No transport records found.</td></tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id}>
                  <td><strong>{rec.vehicle_number || "—"}</strong></td>
                  <td>{rec.driver_name || "—"}</td>
                  <td>{rec.customer_name || "—"}</td>
                  <td><div style={{display:'flex', alignItems:'center', gap:'4px'}}><MapPin size={12}/> {rec.destination || "—"}</div></td>
                  <td className="amount">Rs. {parseFloat(rec.fare_amount).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${rec.status.toLowerCase().replace(" ", "-")}`}>
                      {rec.status}
                    </span>
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
              <h3>{editId ? "Edit Transport" : "Add Transport"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input type="text" value={form.vehicle_number}
                    onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Driver Name</label>
                  <input type="text" value={form.driver_name}
                    onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input type="text" value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fare Amount (Rs.) *</label>
                  <input type="number" required value={form.fare_amount}
                    onChange={(e) => setForm({ ...form, fare_amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Expense Amount (Rs.)</label>
                  <input type="number" value={form.expense_amount}
                    onChange={(e) => setForm({ ...form, expense_amount: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.transport_date}
                    onChange={(e) => setForm({ ...form, transport_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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

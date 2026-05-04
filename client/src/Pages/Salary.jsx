import React, { useState, useEffect, useContext } from "react";
import { 
  Users, Plus, Pencil, Trash2, X, Search, 
  CreditCard, Calendar, UserCheck, Banknote, Briefcase, Tag, Info, CircleDollarSign
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/salary";

const emptyForm = {
  employee_name: "",
  designation: "",
  cnic: "",
  salary_amount: "",
  advance_salary: 0,
  joining_date: new Date().toISOString().split('T')[0],
  payment_date: new Date().toISOString().split('T')[0],
  status: "Paid",
  notes: ""
};

export default function Salary({ type }) {
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
    } catch (err) { console.error(err); }
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

  const openEdit = (rec) => {
    setForm({
      ...rec,
      salary_amount: rec.salary_amount || rec.amount || "",  // map DB 'amount' → form 'salary_amount'
      joining_date: rec.joining_date ? rec.joining_date.split('T')[0] : "",
      payment_date: rec.payment_date ? rec.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setEditId(rec.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff record?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter(r => 
    (r.employee_name || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.cnic || "").includes(search)
  );

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's staff & payroll records you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">👷</div>
            <h3>Wholesale</h3>
            <span>Main Warehouse Staff</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">👨‍💼</div>
            <h3>Retail 1</h3>
            <span>Counter A Staff</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">👩‍💻</div>
            <h3>Retail 2</h3>
            <span>Counter B Staff</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon salary-icon" style={{background: '#eff6ff', color: '#3b82f6'}}><Users size={28} /></div>
          <div>
            <h1>{activeTab} Staff Management</h1>
            <p>Payroll, designation and advance tracking for employees</p>
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
          <Plus size={18} /> Add New Staff
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><Briefcase size={24} /></div>
          <div className="info">
            <span className="label">Total Employees</span>
            <span className="value">{records.length} Staff</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><Banknote size={24} /></div>
          <div className="info">
            <span className="label">Monthly Payroll</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><CreditCard size={24} /></div>
          <div className="info">
            <span className="label">Total Advances</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.advance_salary || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search by name or CNIC..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Employee Info</th>
              <th>Designation</th>
              <th>CNIC</th>
              <th>Salary</th>
              <th>Advance</th>
              <th>Status</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-msg">No staff records found for {activeTab}.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="prod-main-info">
                      <span className="name">{r.employee_name}</span>
                      <span className="v-num"><Calendar size={12}/> Joined: {r.joining_date ? new Date(r.joining_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td><div className="type-tag office" style={{fontSize:'0.75rem', width:'fit-content'}}>{r.designation}</div></td>
                  <td>{r.cnic}</td>
                  <td className="bold">Rs. {parseFloat(r.amount).toLocaleString()}</td>
                  <td className="text-red">Rs. {parseFloat(r.advance_salary || 0).toLocaleString()}</td>
                  <td><span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td>
                    <div className="adjust-btns">
                      <button className="btn-adjust plus" onClick={() => openEdit(r)}><Pencil size={14}/></button>
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
              <h3>{editId ? "Edit Staff Details" : "Register New Staff"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Identity & Role</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee Name *</label>
                  <div className="input-wrapper">
                    <UserCheck size={18} />
                    <input type="text" required value={form.employee_name} placeholder="Full Name"
                      onChange={(e) => setForm({...form, employee_name: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <div className="input-wrapper">
                    <Briefcase size={18} />
                    <input type="text" value={form.designation} placeholder="e.g. Manager, Driver"
                      onChange={(e) => setForm({...form, designation: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>CNIC Number</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <input type="text" placeholder="35201-XXXXXXX-X" value={form.cnic}
                      onChange={(e) => setForm({...form, cnic: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Joining Date</label>
                  <div className="input-wrapper">
                    <Calendar size={18} />
                    <input type="date" value={form.joining_date}
                      onChange={(e) => setForm({...form, joining_date: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="section-label">Payroll Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Monthly Salary *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" required value={form.salary_amount} placeholder="0.00"
                      onChange={(e) => setForm({...form, salary_amount: e.target.value, amount: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Advance Payment</label>
                  <div className="input-wrapper">
                    <Banknote size={18} />
                    <input type="number" value={form.advance_salary} placeholder="0.00"
                      onChange={(e) => setForm({...form, advance_salary: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <div className="input-wrapper">
                    <Info size={18} />
                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="section-label">Additional Notes</div>
              <div className="form-group full-width">
                <textarea rows="2" placeholder="Staff specific notes or emergency contact..." value={form.notes}
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

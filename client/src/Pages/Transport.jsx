import React, { useState, useEffect, useContext } from "react";
import { 
  Truck, Plus, Pencil, Trash2, X, Search, 
  User, Hash, MapPin, BadgeDollarSign, Navigation, CalendarDays,
  Tag, Info, CircleDollarSign, CheckCircle, ChevronLeft
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/transport";

const VEHICLE_TYPES = ["Truck", "Rickshaw", "Loader", "Pickup", "Other"];

const emptyForm = {
  vehicle_type: "Truck",
  vehicle_number: "",
  driver_name: "",
  customer_name: "",
  destination: "",
  fare_amount: "",
  expense_amount: "",
  pending_payment: "",
  trips: 1,
  transport_date: new Date().toISOString().split('T')[0],
  status: "Pending"
};

export default function Transport({ type }) {
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
  const [filterType, setFilterType] = useState("All");
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
    setForm(rec);
    setEditId(rec.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trip record?")) return;
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter(r => {
    const matchType = filterType === "All" || r.vehicle_type === filterType;
    const matchSearch = (r.driver_name || "").toLowerCase().includes(search.toLowerCase()) || 
                        (r.vehicle_number || "").toLowerCase().includes(search.toLowerCase()) ||
                        (r.customer_name || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's transport logistics you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">🚛</div>
            <h3>Wholesale</h3>
            <span>Heavy Transport</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">🚚</div>
            <h3>Retail 1</h3>
            <span>Local Delivery</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">🛵</div>
            <h3>Retail 2</h3>
            <span>Small Loader</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon transport-icon" style={{background: '#f0f9ff', color: '#0369a1'}}><Truck size={28} /></div>
          <div>
            <h1>{activeTab} Logistics</h1>
            <p>Managing fleet, trips and delivery settlements</p>
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
          <Plus size={18} /> Record New Trip
        </button>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><Navigation size={24} /></div>
          <div className="info">
            <span className="label">Total Trips</span>
            <span className="value">{records.reduce((sum, r) => sum + (parseInt(r.trips) || 0), 0)} Trips</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><BadgeDollarSign size={24} /></div>
          <div className="info">
            <span className="label">Total Revenue</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.fare_amount || 0), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><CalendarDays size={24} /></div>
          <div className="info">
            <span className="label">Receivables</span>
            <span className="value">Rs. {records.reduce((sum, r) => sum + parseFloat(r.pending_payment || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search driver, vehicle or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
           <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="tab-select">
             <option value="All">All Vehicles</option>
             {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Trip Date</th>
              <th>Vehicle / Driver</th>
              <th>Customer & Route</th>
              <th>Trips</th>
              <th>Fare / Pending</th>
              <th>Status</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-msg">No trip records found in {activeTab}.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td><div className="bold">{new Date(r.transport_date).toLocaleDateString()}</div></td>
                  <td>
                    <div className="prod-main-info">
                      <span className="name">{r.vehicle_number}</span>
                      <span className="v-num"><User size={12}/> {r.driver_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="prod-main-info">
                      <span className="name" style={{fontSize:'0.85rem'}}>{r.customer_name || 'Walk-in'}</span>
                      <span className="v-num"><MapPin size={12}/> {r.destination}</span>
                    </div>
                  </td>
                  <td className="bold">{r.trips}</td>
                  <td>
                    <div className="prod-main-info">
                      <span className="name">Rs. {parseFloat(r.fare_amount).toLocaleString()}</span>
                      {parseFloat(r.pending_payment) > 0 && <span className="text-red" style={{fontSize:'0.75rem'}}>P: Rs. {parseFloat(r.pending_payment).toLocaleString()}</span>}
                    </div>
                  </td>
                  <td><span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td>
                    <div className="adjust-btns">
                      <button className="btn-adjust plus" onClick={() => openEdit(r)} title="Edit"><Pencil size={14}/></button>
                      <button className="btn-adjust minus" onClick={() => handleDelete(r.id)} title="Delete"><Trash2 size={14}/></button>
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
              <h3>{editId ? "Edit Logistics Entry" : "Record New Trip"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Vehicle & Driver</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <div className="input-wrapper">
                    <Truck size={18} />
                    <select value={form.vehicle_type} onChange={(e) => setForm({...form, vehicle_type: e.target.value})}>
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <div className="input-wrapper">
                    <Hash size={18} />
                    <input type="text" required value={form.vehicle_number} placeholder="e.g. LET-123"
                      onChange={(e) => setForm({...form, vehicle_number: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Driver Name</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input type="text" required value={form.driver_name} placeholder="Name of driver"
                      onChange={(e) => setForm({...form, driver_name: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ownership</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <select value={form.ownership_type || 'Personal'} onChange={(e) => setForm({...form, ownership_type: e.target.value})}>
                      <option value="Personal">Personal (Apni)</option>
                      <option value="Rent">Rent (Kiraye Wali)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="section-label">Customer & Route</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name</label>
                  <div className="input-wrapper">
                    <Info size={18} />
                    <input type="text" value={form.customer_name} placeholder="Who is receiving?"
                      onChange={(e) => setForm({...form, customer_name: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <div className="input-wrapper">
                    <MapPin size={18} />
                    <input type="text" value={form.destination} placeholder="Delivery address"
                      onChange={(e) => setForm({...form, destination: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Transport Date</label>
                  <div className="input-wrapper">
                    <CalendarDays size={18} />
                    <input type="date" value={form.transport_date}
                      onChange={(e) => setForm({...form, transport_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Number of Trips</label>
                  <div className="input-wrapper">
                    <Navigation size={18} />
                    <input type="number" value={form.trips}
                      onChange={(e) => setForm({...form, trips: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="section-label">Financial Settlement</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Fare Amount (Rs.) *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" required value={form.fare_amount} placeholder="0.00"
                      onChange={(e) => setForm({...form, fare_amount: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Pending Payment</label>
                  <div className="input-wrapper">
                    <BadgeDollarSign size={18} />
                    <input type="number" value={form.pending_payment} placeholder="0.00"
                      onChange={(e) => setForm({...form, pending_payment: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Trip Status</label>
                  <div className="input-wrapper">
                    <CheckCircle size={18} />
                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
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

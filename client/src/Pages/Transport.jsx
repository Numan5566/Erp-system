import React, { useState, useEffect, useContext } from "react";
import { 
  Truck, Plus, Pencil, Trash2, X, Search, 
  User, Hash, Phone, CreditCard, Tag
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ActionMenu from '../components/ActionMenu';
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/transport";

const emptyForm = {
  ownership_type: "Personal",
  vehicle_number: "",
  driver_name: "",
  driver_cnic: "",
  driver_phone: ""
};

export default function Transport({ type }) {
  const { user } = useContext(AuthContext);
  const [activeCounter, setActiveCounter] = useState(type || (user?.role === 'admin' ? "" : user?.module_type || "Wholesale"));
  const [activeTab, setActiveTab] = useState("Personal"); // Personal or Rent

  useEffect(() => {
    if (type) {
      setActiveCounter(type);
    } else if (user?.module_type && user.role !== 'admin') {
      setActiveCounter(user.module_type);
    }
  }, [type, user?.module_type, user?.role]);

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    if (!activeCounter) return;
    try {
      const res = await fetch(`${API}?type=${activeCounter}&ownership_type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRecords(); }, [activeCounter, activeTab]);

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
        body: JSON.stringify({ ...form, module_type: activeCounter }),
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
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter(r => {
    return (r.driver_name || "").toLowerCase().includes(search.toLowerCase()) || 
           (r.vehicle_number || "").toLowerCase().includes(search.toLowerCase());
  });

  if (user?.role === 'admin' && !activeCounter && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's transport logistics you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveCounter('Wholesale')}>
            <div className="icon-box">🚛</div>
            <h3>Wholesale</h3>
            <span>Heavy Transport</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveCounter('Retail 1')}>
            <div className="icon-box">🚚</div>
            <h3>Retail 1</h3>
            <span>Local Delivery</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveCounter('Retail 2')}>
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
            <h1>{activeCounter} Transport</h1>
            <p>Manage fleet and auto-generated trip revenue</p>
          </div>
        </div>

        {user?.role === 'admin' && !type && (
          <div className="counter-switcher">
            <button className={activeCounter === 'Wholesale' ? 'active' : ''} onClick={() => setActiveCounter('Wholesale')}>Wholesale</button>
            <button className={activeCounter === 'Retail 1' ? 'active' : ''} onClick={() => setActiveCounter('Retail 1')}>Retail 1</button>
            <button className={activeCounter === 'Retail 2' ? 'active' : ''} onClick={() => setActiveCounter('Retail 2')}>Retail 2</button>
          </div>
        )}

        <button className="btn-primary" onClick={() => { setForm({...emptyForm, ownership_type: activeTab}); setEditId(null); setShowModal(true); }}>
          <Plus size={18} /> Add New Vehicle
        </button>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search driver or vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
           <button className={`tab-btn ${activeTab === 'Personal' ? 'active' : ''}`} onClick={() => setActiveTab('Personal')}>
             Personal Vehicles
           </button>
           <button className={`tab-btn ${activeTab === 'Rent' ? 'active' : ''}`} onClick={() => setActiveTab('Rent')}>
             Rent Vehicles
           </button>
        </div>
      </div>

      <div className="module-table-container">
        <table className="module-table">
          <thead>
            <tr>
              <th>Vehicle Number</th>
              <th>Driver Name</th>
              <th>Driver CNIC</th>
              <th>Driver Phone</th>
              <th>Total Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(rec => (
              <tr key={rec.id}>
                <td className="bold">{rec.vehicle_number}</td>
                <td>{rec.driver_name}</td>
                <td>{rec.driver_cnic || 'N/A'}</td>
                <td>{rec.driver_phone || 'N/A'}</td>
                <td className="bold text-green">Rs. {parseFloat(rec.total_earnings || 0).toLocaleString()}</td>
                <td>
                    <ActionMenu 
                      onEdit={() => openEdit(rec)} 
                      onDelete={() => handleDelete(rec.id)} 
                    />
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" className="empty-state">No vehicles found in {activeTab}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? "Edit Vehicle" : "Add New Vehicle"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="custom-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Ownership Type</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <select value={form.ownership_type} onChange={(e) => setForm({...form, ownership_type: e.target.value})}>
                      <option value="Personal">Personal</option>
                      <option value="Rent">Rent</option>
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
                  <label>Driver CNIC</label>
                  <div className="input-wrapper">
                    <CreditCard size={18} />
                    <input type="text" value={form.driver_cnic} placeholder="XXXXX-XXXXXXX-X"
                      onChange={(e) => setForm({...form, driver_cnic: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Driver Phone</label>
                  <div className="input-wrapper">
                    <Phone size={18} />
                    <input type="text" value={form.driver_phone} placeholder="03XXXXXXXXX"
                      onChange={(e) => setForm({...form, driver_phone: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{marginTop: '20px'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Processing..." : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

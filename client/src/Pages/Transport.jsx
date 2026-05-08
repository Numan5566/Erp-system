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
  const [activeCounter, setActiveCounter] = useState(type || (user?.email === 'admin@erp.com' ? "" : user?.module_type || "Wholesale"));
  const [activeTab, setActiveTab] = useState("Personal"); // Personal or Rent

  useEffect(() => {
    if (type) {
      setActiveCounter(type);
    } else if (user?.module_type && user?.email !== 'admin@erp.com') {
      setActiveCounter(user.module_type);
    }
  }, [type, user?.module_type, user?.email]);

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", notes: "Payment Sent" });
  const [paymentSource, setPaymentSource] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [liveBalances, setLiveBalances] = useState({});

  useEffect(() => {
    if (showPaymentModal) {
      const fetchLiveBalances = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/banks/balances?type=${activeCounter}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setLiveBalances(data);
          }
        } catch (e) { console.error(e); }
      };
      fetchLiveBalances();
    }
  }, [showPaymentModal]);

  const fetchBanks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBankAccounts(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const openPayment = (vehicle) => {
    setSelectedVehicle(vehicle);
    setPaymentForm({ amount: "", notes: "Payment Sent" });
    setSelectedBank("");
    setPaymentSource("Cash");
    fetchBanks();
    setShowPaymentModal(true);
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    const currentEarnings = parseFloat(selectedVehicle.total_earnings || 0);
    const amt = parseFloat(paymentForm.amount || 0);

    if (currentEarnings > 0 && amt > currentEarnings) {
      alert(`Invalid Payment: You cannot pay more than the outstanding fare earnings (Rs. ${currentEarnings})!`);
      return;
    }
    setLoading(true);

    let finalPaymentType = selectedBank ? `Bank - ${selectedBank}` : 'Cash';
    const targetAccountName = selectedBank || 'Cash';
    const currentAvailable = liveBalances[targetAccountName] || 0;

    if (amt > currentAvailable) {
      alert(`Insufficient balance in ${targetAccountName}! Available: Rs. ${currentAvailable.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/transport/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle.id,
          paid_amount: paymentForm.amount,
          notes: paymentForm.notes,
          payment_type: finalPaymentType,
          module_type: activeCounter
        })
      });
      if (res.ok) {
        setShowPaymentModal(false);
        fetchRecords();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchRecords = async () => {
    if (!activeCounter) return;
    try {
      const res = await fetch(`${API}?type=${activeCounter}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRecords(); }, [activeCounter]);

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

  const openLedger = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowLedgerModal(true);
    setLoading(true);
    try {
      const res = await fetch(`${API}/ledger/${vehicle.id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLedgerData(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    fetchRecords();
  };

  const filtered = records.filter(r => {
    const matchesTab = (r.ownership_type || "Personal").toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = (r.driver_name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (r.vehicle_number || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (user?.email === 'admin@erp.com' && !activeCounter && !type) {
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

        {user?.role === 'admin' && !user?.module_type && !type && (
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
                      extraItems={[
                        { label: 'View Ledger', icon: 'pi pi-book', command: () => openLedger(rec) },
                        ...(activeTab === 'Rent' ? [{ label: 'Make Payment', icon: 'pi pi-money-bill', command: () => openPayment(rec) }] : [])
                      ]}
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
      {/* Vehicle Ledger Modal */}
      {showLedgerModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowLedgerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header no-print">
              <div className="header-info" style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <Truck size={24} color="#0369a1" />
                <h3>Vehicle Ledger: {selectedVehicle.vehicle_number}</h3>
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="btn-secondary" onClick={() => window.print()} style={{padding: '6px 12px', display:'flex', alignItems:'center', gap:'6px'}}>
                  <Plus size={16} /> Print Report
                </button>
                <button className="modal-close" onClick={() => setShowLedgerModal(false)}><X size={20} /></button>
              </div>
            </div>

            <div className="ledger-report print-only" style={{padding: '20px', color: 'black'}}>
              <div style={{textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px'}}>
                <h2 style={{margin: 0}}>DATA WALEY CEMENT DEALER</h2>
                <p style={{margin: '5px 0'}}>Vehicle Earnings Ledger Report</p>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px'}}>
                  <span><strong>Vehicle:</strong> {selectedVehicle.vehicle_number}</span>
                  <span><strong>Driver:</strong> {selectedVehicle.driver_name}</span>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                <thead>
                  <tr style={{background: '#f1f5f9'}}>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left'}}>Date</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left'}}>Customer / Bill</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Fare (Earnings)</th>
                    <th style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map(row => (
                    <tr key={row.id}>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{new Date(row.created_at).toLocaleDateString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{row.customer_name} (Invoice #{row.id})</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>{parseFloat(row.delivery_charges).toLocaleString()}</td>
                      <td style={{border: '1px solid #cbd5e1', padding: '8px'}}>{row.payment_type}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                   <tr style={{fontWeight: 700}}>
                     <td colSpan="2" style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Total Earnings:</td>
                     <td style={{border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right'}}>Rs. {parseFloat(selectedVehicle.total_earnings || 0).toLocaleString()}</td>
                     <td style={{border: '1px solid #cbd5e1', padding: '8px'}}></td>
                   </tr>
                </tfoot>
              </table>
            </div>

            <div className="detail-body no-print" style={{padding: '24px'}}>
              <div className="stats-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Trips</div>
                  <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>{ledgerData.length} Trips</div>
                </div>
                <div className="stat-item" style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</div>
                  <div style={{ fontSize: '1.25rem', color: '#0369a1', fontWeight: 700 }}>Rs. {parseFloat(selectedVehicle.total_earnings || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="module-table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="module-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Trip Type</th>
                      <th>Party / Details</th>
                      <th>Earnings (Fare)</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.length === 0 ? (
                      <tr><td colSpan="5" className="empty-msg">No trip history found for this vehicle.</td></tr>
                    ) : (
                      ledgerData.map((row, idx) => (
                        <tr key={idx}>
                          <td>{new Date(row.date).toLocaleDateString()}</td>
                          <td>
                             <span className={`status-badge ${row.trip_type.includes('Inward') ? 'pending' : 'paid'}`} style={{fontSize: '0.7rem'}}>
                               {row.trip_type}
                             </span>
                          </td>
                          <td>
                            <strong>{row.party_name}</strong>
                            <br/><small style={{color:'#64748b'}}>ID: #{row.id}</small>
                          </td>
                          <td className="bold text-green">Rs. {parseFloat(row.amount).toLocaleString()}</td>
                          <td><span className="status-badge paid">{row.payment_type || 'Cash'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer no-print" style={{padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end'}}>
              <button className="btn-secondary" onClick={() => setShowLedgerModal(false)}>Close Ledger</button>
            </div>
          </div>
        </div>
      )}
      {showPaymentModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Make Payment to {selectedVehicle.vehicle_number}</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleMakePayment} className="custom-form">
              <div style={{background: '#fff1f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontWeight: 600, color: '#e11d48'}}>Fare Accrued (Owed):</span>
                <span style={{fontWeight: 700, color: '#e11d48'}}>Rs. {parseFloat(selectedVehicle.total_earnings || 0).toLocaleString()}</span>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Amount Paid (Rs.) *</label>
                <div className="input-wrapper">
                  <Hash size={18} />
                  <input type="number" step="0.01" required value={paymentForm.amount} placeholder="e.g. 50000"
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Payment Source *</label>
                <select 
                  value={paymentSource}
                  style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}}
                  onChange={(e) => {
                    setPaymentSource(e.target.value);
                    if (e.target.value === "Cash") setSelectedBank("");
                  }}
                >
                  <option value="Cash">Main Cash (Counter)</option>
                  <option value="Bank">Bank / Online Account</option>
                </select>
              </div>

              {paymentSource === "Bank" && (
                <div className="form-group" style={{marginBottom: '15px'}}>
                  <label>Select Sending Bank *</label>
                  <select 
                    value={selectedBank} 
                    onChange={(e) => setSelectedBank(e.target.value)} 
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f0f9ff', borderColor: '#3b82f6'}}
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {bankAccounts.filter(b => !b.bank_name.toLowerCase().includes('cash')).map(b => (
                      <option key={b.id} value={b.bank_name}>{b.bank_name} - {b.account_number}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {parseFloat(paymentForm.amount || 0) > (liveBalances[paymentSource === "Bank" ? selectedBank : "Cash"] || 0) && (
                <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  ⚠️ Insufficient Balance! Available: Rs. {(liveBalances[paymentSource === "Bank" ? selectedBank : "Cash"] || 0).toLocaleString()}
                </div>
              )}
              
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Payment Notes / Reference</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input type="text" value={paymentForm.notes} placeholder="e.g. Paid via Cash" required
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#10b981', borderColor: '#10b981'}} disabled={loading || (parseFloat(paymentForm.amount || 0) > (liveBalances[paymentSource === "Bank" ? selectedBank : "Cash"] || 0))}>
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

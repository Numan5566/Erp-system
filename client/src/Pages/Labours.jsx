import React, { useState, useEffect, useContext } from "react";
import { Users, FolderGit2, Contact, Coins, Plus, Search, Edit, Trash2, X, Phone, Hash, CreditCard, ChevronLeft, ArrowUpCircle, ArrowDownCircle, ClipboardList } from "lucide-react";
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/labours";

const emptyForm = { name: "", group_name: "", contact: "", rate_per_day: "", cnic: "" };

export default function Labours() {
  const { user } = useContext(AuthContext);
  const [labours, setLabours] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null); // Which group card is clicked
  const [loading, setLoading] = useState(false);
  const [liveBalances, setLiveBalances] = useState({});
  const [banks, setBanks] = useState([]);

  // Payment disburse modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", notes: "", payment_type: "Cash" });

  // Log manual work modal
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workForm, setWorkForm] = useState({ description: "", amount: "" });

  // Custom group input state
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [customGroup, setCustomGroup] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
      const [labRes, workRes, balRes, banksRes] = await Promise.all([
        fetch(API, { headers }),
        fetch(`${API}/work-history`, { headers }),
        fetch("http://localhost:5000/api/banks/balances", { headers }),
        fetch("http://localhost:5000/api/banks", { headers })
      ]);
      const labData = await labRes.json();
      const workData = await workRes.json();
      const balData = await balRes.json();
      const banksData = await banksRes.json();

      setLabours(Array.isArray(labData) ? labData : []);
      setWorkHistory(Array.isArray(workData) ? workData : []);
      setLiveBalances(balData || {});
      setBanks(Array.isArray(banksData) ? banksData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API}/${editId}` : API;
      
      const finalGroup = isNewGroup ? customGroup : form.group_name;
      if (!finalGroup) {
        alert("Please enter or select a group name!");
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, group_name: finalGroup })
      });

      if (res.ok) {
        setShowModal(false);
        setForm(emptyForm);
        setCustomGroup("");
        setIsNewGroup(false);
        setEditId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this labour?")) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (labour) => {
    setForm(labour);
    setEditId(labour.id);
    setIsNewGroup(false);
    setShowModal(true);
  };

  const handlePayWages = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payForm.amount || 0);
    const getSelectedPaymentBalance = () => {
      if (payForm.payment_type === 'Cash') return liveBalances['Cash'] || 0;
      const cleanBank = payForm.payment_type.replace('Bank - ', '');
      return liveBalances[cleanBank] || 0;
    };
    const availableBalance = getSelectedPaymentBalance();

    if (amt > availableBalance) {
      return; // Blocked dynamically by UI inline warning
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          group_name: selectedGroup,
          amount: amt,
          notes: payForm.notes,
          payment_type: payForm.payment_type
        })
      });

      if (res.ok) {
        setShowPayModal(false);
        setPayForm({ amount: "", notes: "", payment_type: "Cash" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogWork = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/work-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          group_name: selectedGroup,
          description: workForm.description,
          amount: workForm.amount
        })
      });

      if (res.ok) {
        setShowWorkModal(false);
        setWorkForm({ description: "", amount: "" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique groups list
  const existingGroups = [...new Set(labours.map(l => l.group_name))];

  // Group Calculations
  const groupsStats = existingGroups.map(group => {
    const workers = labours.filter(l => l.group_name === group);
    const history = workHistory.filter(h => h.group_name === group);
    
    // Unpaid wages total (earned through loading/unloading work minus paid amount)
    const earned = history.filter(h => h.status === 'Unpaid').reduce((sum, h) => sum + parseFloat(h.amount || 0), 0);
    const paid = history.filter(h => h.status === 'Paid').reduce((sum, h) => sum + parseFloat(h.amount || 0), 0);
    const balance = earned - paid;

    return {
      name: group,
      workersCount: workers.length,
      balance,
      history
    };
  });

  const selectedGroupDetails = groupsStats.find(g => g.name === selectedGroup);
  const selectedGroupLabours = labours.filter(l => l.group_name === selectedGroup);

  // Stats Calculations
  const totalLabours = labours.length;
  const totalOutstandingWages = groupsStats.reduce((sum, g) => sum + (g.balance > 0 ? g.balance : 0), 0);
  const getSelectedPaymentBalance = () => {
    if (payForm.payment_type === 'Cash') return liveBalances['Cash'] || 0;
    const cleanBank = payForm.payment_type.replace('Bank - ', '');
    return liveBalances[cleanBank] || 0;
  };
  const cashAvailable = getSelectedPaymentBalance();
  const isWagePayInsufficient = parseFloat(payForm.amount || 0) > cashAvailable;

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          {selectedGroup && (
            <button className="btn-icon back-btn" onClick={() => setSelectedGroup(null)} style={{marginRight: '15px', background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="module-icon expense-icon" style={{background: '#e0f2fe', color: '#0284c7'}}><Users size={28} /></div>
          <div>
            <h1>{selectedGroup ? `Group: ${selectedGroup}` : 'Labour Tracking & Groups'}</h1>
            <p>{selectedGroup ? `Managing operations and wage ledger for ${selectedGroup}` : 'Organize labor, record group loading/unloading work, and pay wages'}</p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setIsNewGroup(false); setShowModal(true); }}>
          <Plus size={18} /> Add New Labour
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon blue"><Users size={24} /></div>
          <div className="info">
            <span className="label">Total Labours</span>
            <span className="value">{totalLabours} Workers</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon orange"><FolderGit2 size={24} /></div>
          <div className="info">
            <span className="label">Active Groups</span>
            <span className="value">{groupsStats.length} Teams</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><Coins size={24} /></div>
          <div className="info">
            <span className="label">Outstanding Payable</span>
            <span className="value">Rs. {totalOutstandingWages.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {!selectedGroup ? (
        // 1. Group Cards Grid View
        <div>
          <h2 style={{fontSize: '1.4rem', color: '#1e293b', marginBottom: '15px', fontWeight: 700}}>Labour Groups & Teams</h2>
          <div className="selection-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', display: 'grid'}}>
            {groupsStats.length === 0 ? (
              <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#64748b'}}>
                No labor groups found. Click "Add New Labour" and create a group to start!
              </div>
            ) : (
              groupsStats.map(g => (
                <div key={g.name} className="selection-card" onClick={() => setSelectedGroup(g.name)} style={{padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s ease'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{background: '#f0f9ff', padding: '10px', borderRadius: '8px', color: '#0369a1', display: 'flex', alignItems: 'center'}}><Users size={24} /></div>
                    <span style={{background: g.balance > 0 ? '#fef2f2' : '#f0fdf4', color: g.balance > 0 ? '#ef4444' : '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600}}>
                      {g.balance > 0 ? `Payable: Rs. ${g.balance.toLocaleString()}` : 'Cleared'}
                    </span>
                  </div>
                  <div>
                    <h3 style={{fontSize: '1.25rem', color: '#1e293b', fontWeight: 700, margin: 0}}>{g.name}</h3>
                    <p style={{color: '#64748b', fontSize: '0.9rem', margin: '5px 0 0 0'}}>{g.workersCount} Workers registered</p>
                  </div>
                  <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b'}}>
                    <span>Outstanding Wages:</span>
                    <strong style={{color: g.balance > 0 ? '#ef4444' : '#10b981'}}>Rs. {g.balance.toLocaleString()}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // 2. Group Detail Screen
        <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
          {/* Action buttons inside detail */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', gap: '15px'}}>
            <div>
              <h2 style={{margin: 0, fontSize: '1.35rem', color: '#1e293b', fontWeight: 700}}>{selectedGroup} Overview</h2>
              <p style={{margin: '5px 0 0 0', color: '#ef4444', fontWeight: 600}}>Outstanding Payable: Rs. {(selectedGroupDetails?.balance || 0).toLocaleString()}</p>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="btn-primary" onClick={() => setShowWorkModal(true)} style={{background: '#0f766e', borderColor: '#0f766e', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <ClipboardList size={18} /> Record Work Entry
              </button>
              {(selectedGroupDetails?.balance || 0) > 0 && (
                <button className="btn-primary" onClick={() => setShowPayModal(true)} style={{background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Coins size={18} /> Pay Wages
                </button>
              )}
            </div>
          </div>

          {/* Group Labours List */}
          <div style={{background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1'}}>
            <h3 style={{fontSize: '1.15rem', color: '#1e293b', fontWeight: 700, marginBottom: '15px'}}>Registered Labours in {selectedGroup}</h3>
            <table className="module-table">
              <thead>
                <tr>
                  <th>Labour Name</th>
                  <th>CNIC Number</th>
                  <th>Contact Number</th>
                  <th>Daily Wage Rate</th>
                  <th style={{textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroupLabours.length === 0 ? (
                  <tr><td colSpan="5" className="empty-msg">No labors found inside this group.</td></tr>
                ) : (
                  selectedGroupLabours.map(l => (
                    <tr key={l.id}>
                      <td style={{fontWeight: 600, color: '#1e293b'}}>{l.name}</td>
                      <td>{l.cnic || "N/A"}</td>
                      <td>{l.contact || "N/A"}</td>
                      <td style={{fontWeight: 700, color: '#0f766e'}}>Rs. {parseFloat(l.rate_per_day || 0).toLocaleString()}</td>
                      <td style={{textAlign: 'center'}}>
                        <ActionMenu 
                          onEdit={() => handleEdit(l)} 
                          onDelete={() => handleDelete(l.id)} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Group Wage & Work History Ledger */}
          <div style={{background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1'}}>
            <h3 style={{fontSize: '1.15rem', color: '#1e293b', fontWeight: 700, marginBottom: '15px'}}>{selectedGroup} Activity Ledger</h3>
            <table className="module-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Work Status</th>
                  <th>Amount Earned (+)</th>
                  <th>Amount Paid (-)</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroupDetails?.history.length === 0 ? (
                  <tr><td colSpan="5" className="empty-msg">No work entries or wage dispatches logged for this group.</td></tr>
                ) : (
                  selectedGroupDetails?.history.map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleDateString()}</td>
                      <td style={{fontWeight: 600}}>{h.description}</td>
                      <td>
                        <span style={{background: h.status === 'Paid' ? '#e6f4ea' : '#fce8e6', color: h.status === 'Paid' ? '#137333' : '#c5221f', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600}}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{color: '#c5221f', fontWeight: 700}}>{h.status === 'Unpaid' ? `Rs. ${parseFloat(h.amount).toLocaleString()}` : '—'}</td>
                      <td style={{color: '#137333', fontWeight: 700}}>{h.status === 'Paid' ? `Rs. ${parseFloat(h.amount).toLocaleString()}` : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Labour */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>{editId ? "Edit Labour Info" : "Register New Labour"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="custom-form">
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Labour Full Name *</label>
                <div className="input-wrapper">
                  <Contact size={18} />
                  <input type="text" required placeholder="e.g. Muhammad Ali" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Labour CNIC Number *</label>
                <div className="input-wrapper">
                  <CreditCard size={18} />
                  <input type="text" required placeholder="e.g. 35202-1234567-1" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Contact Number (Optional)</label>
                <div className="input-wrapper">
                  <Phone size={18} />
                  <input type="text" placeholder="e.g. 03001234567" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Daily Wage Rate (Rs. / Day) *</label>
                <div className="input-wrapper">
                  <Hash size={18} />
                  <input type="number" required placeholder="e.g. 1500" value={form.rate_per_day} onChange={(e) => setForm({ ...form, rate_per_day: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Labour Group / Team *</label>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  {!isNewGroup ? (
                    <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                      <select 
                        value={form.group_name} 
                        onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}}
                        required={!isNewGroup}
                      >
                        <option value="">-- Select Existing Group --</option>
                        {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsNewGroup(true)} style={{background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontWeight: 600, color: '#0284c7'}}>New</button>
                    </div>
                  ) : (
                    <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                      <input 
                        type="text" 
                        placeholder="Type New Group Name..." 
                        value={customGroup} 
                        onChange={(e) => setCustomGroup(e.target.value)} 
                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}}
                        required={isNewGroup}
                      />
                      <button type="button" onClick={() => setIsNewGroup(false)} style={{background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontWeight: 600, color: '#ef4444'}}>List</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#0284c7', borderColor: '#0284c7'}} disabled={loading}>
                  {loading ? "Processing..." : "Save Labour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Wages */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Pay Wages to {selectedGroup}</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handlePayWages} className="custom-form">
               <div className="form-group" style={{marginBottom: '15px'}}>
                 <label>Payment Method / Account *</label>
                 <div className="input-wrapper">
                   <CreditCard size={18} />
                   <select 
                     value={payForm.payment_type} 
                     onChange={(e) => setPayForm({ ...payForm, payment_type: e.target.value })}
                     style={{width: '100%', padding: '12px 10px', borderRadius: '8px', border: 'none', outline: 'none', background: 'transparent'}}
                     required
                   >
                     <option value="Cash">Cash Account (Main Counter)</option>
                     {banks.filter(b => !b.bank_name.toLowerCase().includes('cash')).map(b => (
                       <option key={b.id} value={`Bank - ${b.bank_name}`}>{b.bank_name} - {b.account_title}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div style={{background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
                 <span style={{fontWeight: 600, color: '#15803d'}}>Available Balance:</span>
                 <span style={{fontWeight: 700, color: '#15803d'}}>Rs. {cashAvailable.toLocaleString()}</span>
               </div>

               <div className="form-group" style={{marginBottom: '15px'}}>
                 <label>Amount Disbursed (Rs.) *</label>
                 <div className="input-wrapper">
                   <Coins size={18} />
                   <input type="number" required placeholder="0.00" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                 </div>
               </div>

               {isWagePayInsufficient && (
                 <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                   ⚠️ Insufficient Balance! Available: Rs. {cashAvailable.toLocaleString()}
                 </div>
               )}

               <div className="form-group" style={{marginBottom: '20px'}}>
                 <label>Notes / References *</label>
                 <div className="input-wrapper">
                   <ArrowUpCircle size={18} />
                   <input type="text" required placeholder="e.g. Wages Paid" value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
                 </div>
               </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#10b981', borderColor: '#10b981'}} disabled={loading || isWagePayInsufficient}>
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Work Entry */}
      {showWorkModal && (
        <div className="modal-overlay" onClick={() => setShowWorkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Log Work Entry for {selectedGroup}</h3>
              <button className="modal-close" onClick={() => setShowWorkModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleLogWork} className="custom-form">
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Work Description *</label>
                <div className="input-wrapper">
                  <ClipboardList size={18} />
                  <input type="text" required placeholder="e.g. Loaded 200 bags of cement for Block A" value={workForm.description} onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Wages Earned for this Work (Rs.) *</label>
                <div className="input-wrapper">
                  <Hash size={18} />
                  <input type="number" required placeholder="e.g. 3500" value={workForm.amount} onChange={(e) => setWorkForm({ ...workForm, amount: e.target.value })} />
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowWorkModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#0f766e', borderColor: '#0f766e'}} disabled={loading}>
                  {loading ? "Processing..." : "Save Work Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

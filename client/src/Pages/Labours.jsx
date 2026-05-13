// DYNAMIC API PATCH
const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'https://erp-backend-3rf8.onrender.com/api';

import React, { useState, useEffect, useContext, useMemo } from "react";
import { Users, FolderGit2, Contact, Coins, Plus, Search, Edit, Trash2, X, Phone, Hash, CreditCard, ChevronLeft, ArrowUpCircle, ArrowDownCircle, ClipboardList } from "lucide-react";
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = (API_BASE_URL + "/labours");

const emptyForm = { name: "", group_name: "", contact: "", rate_per_day: "", cnic: "" };

export default function Labours({ type }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(type || (user?.role === 'admin' ? "" : user?.module_type || "Wholesale"));
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

  // Global payment modal states
  const [showGlobalPayModal, setShowGlobalPayModal] = useState(false);
  const [globalPayForm, setGlobalPayForm] = useState({ group_name: "", bill_id: "", amount: "", notes: "", payment_type: "Cash" });

  const [ledgerFilter, setLedgerFilter] = useState("all");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user?.role !== 'admin') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.email]);

  const handleGlobalPayWages = async (e) => {
    e.preventDefault();
    const amt = parseFloat(globalPayForm.amount || 0);
    const getSelectedGlobalPaymentBalance = () => {
      if (globalPayForm.payment_type === 'Cash') return liveBalances['Cash'] || 0;
      const cleanBank = globalPayForm.payment_type.replace('Bank - ', '');
      return liveBalances[cleanBank] || 0;
    };
    const availableBalance = getSelectedGlobalPaymentBalance();

    if (amt > availableBalance) {
      alert("Insufficient Balance in selected account!");
      return;
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
          group_name: globalPayForm.group_name,
          bill_id: globalPayForm.bill_id,
          amount: amt,
          notes: globalPayForm.notes || `Paid wages to ${globalPayForm.group_name} (Bill #${globalPayForm.bill_id || 'N/A'})`,
          payment_type: globalPayForm.payment_type,
          module_type: type || activeTab
        })
      });

      if (res.ok) {
        setShowGlobalPayModal(false);
        setGlobalPayForm({ group_name: "", bill_id: "", amount: "", notes: "", payment_type: "Cash" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBillIdChange = (val) => {
    const foundEntry = workHistory.find(h => h.bill_id && String(h.bill_id) === String(val));
    setGlobalPayForm(prev => ({
      ...prev,
      bill_id: val,
      group_name: foundEntry ? foundEntry.group_name : ""
    }));
  };

  const fetchData = async () => {
    if (!activeTab) return;
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
      const [labRes, workRes, balRes, banksRes] = await Promise.all([
        fetch(`${API}?type=${activeTab}`, { headers }),
        fetch(`${API}/work-history?type=${activeTab}`, { headers }),
        fetch((API_BASE_URL + "/banks/balances"), { headers }),
        fetch((API_BASE_URL + "/banks"), { headers })
      ]);
      const labData = await labRes.json();
      const workData = await workRes.json();
      const balData = await balRes.json();
      const banksData = await banksRes.json();

      const finalLabours = Array.isArray(labData) ? labData : [];
      const finalWork = Array.isArray(workData) ? workData : [];

      setLabours(finalLabours);
      setWorkHistory(finalWork);
      setLiveBalances(balData || {});
      setBanks(Array.isArray(banksData) ? banksData : []);

      localStorage.setItem(`cache_labours_${activeTab}`, JSON.stringify(finalLabours));
      localStorage.setItem(`cache_workhistory_${activeTab}`, JSON.stringify(finalWork));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeTab) return;
    try {
      const cachedLabours = localStorage.getItem(`cache_labours_${activeTab}`);
      const cachedWork = localStorage.getItem(`cache_workhistory_${activeTab}`);
      if (cachedLabours) setLabours(JSON.parse(cachedLabours));
      if (cachedWork) setWorkHistory(JSON.parse(cachedWork));
    } catch (e) { console.error(e); }
    fetchData();
  }, [activeTab]);

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
        body: JSON.stringify({ ...form, group_name: finalGroup, module_type: type || activeTab })
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
          payment_type: payForm.payment_type,
          module_type: type || activeTab
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
          amount: workForm.amount,
          module_type: type || activeTab
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

  const applyLedgerFilter = (filterKey) => {
    setLedgerFilter(filterKey);
    const today = new Date();
    if (filterKey === 'all') {
      setLedgerFrom(""); setLedgerTo("");
    } else if (filterKey === 'today') {
      const t = today.toLocaleDateString('en-CA');
      setLedgerFrom(t); setLedgerTo(t);
    } else if (filterKey === 'yesterday') {
      const y = new Date(); y.setDate(today.getDate() - 1);
      const yt = y.toLocaleDateString('en-CA');
      setLedgerFrom(yt); setLedgerTo(yt);
    } else if (filterKey === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(today.getDate() - 7);
      setLedgerFrom(weekAgo.toLocaleDateString('en-CA'));
      setLedgerTo(today.toLocaleDateString('en-CA'));
    } else if (filterKey === 'month') {
      setLedgerFrom(new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA'));
      setLedgerTo(today.toLocaleDateString('en-CA'));
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
                     {banks.filter(b => !b.bank_name.toLowerCase().includes('cash')).map(b => {
                       const digits = b.account_number ? b.account_number.slice(-4) : '';
                       return <option key={b.id} value={`Bank - ${b.bank_name} ${digits ? `(****${digits})` : ''}`}>{b.bank_name} - {b.account_title}</option>;
                     })}
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
      {/* Modal: Send Labour Payment (Global) */}
      {showGlobalPayModal && (
        <div className="modal-overlay" onClick={() => setShowGlobalPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Send Labour Payment</h3>
              <button className="modal-close" onClick={() => setShowGlobalPayModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleGlobalPayWages} className="custom-form">
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Bill / Invoice Number *</label>
                <div className="input-wrapper">
                  <Hash size={18} />
                  <input type="text" required placeholder="e.g. 10452" value={globalPayForm.bill_id} onChange={(e) => handleBillIdChange(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Select Labour Group *</label>
                <div className="input-wrapper">
                  <Users size={18} />
                  <select 
                    value={globalPayForm.group_name} 
                    onChange={(e) => setGlobalPayForm({ ...globalPayForm, group_name: e.target.value })}
                    style={{width: '100%', padding: '12px 10px', borderRadius: '8px', border: 'none', outline: 'none', background: 'transparent'}}
                    required
                  >
                    <option value="">{globalPayForm.group_name ? `Auto-selected: ${globalPayForm.group_name}` : "-- Choose Team / Group --"}</option>
                    {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Payment Method / Account *</label>
                <div className="input-wrapper">
                  <CreditCard size={18} />
                  <select 
                    value={globalPayForm.payment_type} 
                    onChange={(e) => setGlobalPayForm({ ...globalPayForm, payment_type: e.target.value })}
                    style={{width: '100%', padding: '12px 10px', borderRadius: '8px', border: 'none', outline: 'none', background: 'transparent'}}
                    required
                  >
                    <option value="Cash">Cash Account (Main Counter)</option>
                    {banks.filter(b => !b.bank_name.toLowerCase().includes('cash')).map(b => {
                      const digits = b.account_number ? b.account_number.slice(-4) : '';
                      return <option key={b.id} value={`Bank - ${b.bank_name} ${digits ? `(****${digits})` : ''}`}>{b.bank_name} - {b.account_title}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div style={{background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontWeight: 600, color: '#15803d'}}>Available Balance:</span>
                <span style={{fontWeight: 700, color: '#15803d'}}>Rs. {globalCashAvailable.toLocaleString()}</span>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Amount Paid (Rs.) *</label>
                <div className="input-wrapper">
                  <Coins size={18} />
                  <input type="number" required placeholder="0.00" value={globalPayForm.amount} onChange={(e) => setGlobalPayForm({ ...globalPayForm, amount: e.target.value })} />
                </div>
              </div>

              {isGlobalWagePayInsufficient && (
                <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  ⚠️ Insufficient Balance! Available: Rs. {globalCashAvailable.toLocaleString()}
                </div>
              )}

              <div className="form-group" style={{marginBottom: '20px'}}>
                <label>Notes / References *</label>
                <div className="input-wrapper">
                  <ArrowUpCircle size={18} />
                  <input type="text" required placeholder="e.g. Paid Loading Charges" value={globalPayForm.notes} onChange={(e) => setGlobalPayForm({ ...globalPayForm, notes: e.target.value })} />
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowGlobalPayModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#10b981', borderColor: '#10b981'}} disabled={loading || isGlobalWagePayInsufficient}>
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

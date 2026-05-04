import React, { useState, useEffect, useContext } from "react";
import { Landmark, Plus, Trash2, Search, X, Hash, CreditCard } from "lucide-react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

export default function Accounts() {
  const { user } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ bank_name: "", account_title: "", account_number: "" });
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/banks', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch bank accounts", err);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  if (user?.role !== 'admin') {
    return <div style={{padding: '40px', textAlign: 'center'}}><h2>Access Denied</h2><p>Only Administrators can manage Bank Accounts.</p></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('http://localhost:5000/api/banks', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      setShowModal(false);
      setForm({ bank_name: "", account_title: "", account_number: "" });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to add bank account", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) return;
    try {
      await fetch(`http://localhost:5000/api/banks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to delete account", err);
    }
  };

  const filtered = accounts.filter(acc => acc.bank_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon" style={{background: '#e0f2fe', color: '#0ea5e9'}}><Landmark size={28} /></div>
          <div>
            <h1>Bank Accounts</h1>
            <p>Manage supported payment methods and bank accounts</p>
          </div>
        </div>
        <div className="module-actions">
          <Button label="Add Bank Account" icon="pi pi-plus" onClick={() => setShowModal(true)} className="p-button-primary" />
        </div>
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="module-table-container" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
        <DataTable value={filtered} emptyMessage="No bank accounts added yet." className="p-datatable-sm" stripedRows>
          <Column field="bank_name" header="Bank Name" body={(acc) => (
            <div style={{fontWeight: 700, color: '#1e293b'}}>{acc.bank_name}</div>
          )} sortable />
          <Column field="account_title" header="Account Title" body={(acc) => acc.account_title || "—"} sortable />
          <Column field="account_number" header="Account Number" body={(acc) => (
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Hash size={14} color="#64748b"/> {acc.account_number || "—"}</div>
          )} sortable />
          <Column header="" body={(acc) => (
            <ActionMenu 
              onDelete={() => handleDelete(acc.id)} 
            />
          )} style={{ textAlign: 'center', width: '60px' }} />
        </DataTable>
      </div>

      <Dialog header="Add New Bank Account" visible={showModal} style={{ width: '400px' }} onHide={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="custom-form p-fluid">
          <div className="field mb-3">
            <label className="block mb-2 font-bold">Bank Name *</label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon"><Landmark size={18} /></span>
              <input type="text" required value={form.bank_name} placeholder="e.g. Meezan Bank"
                className="p-inputtext p-component"
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </div>
          </div>

          <div className="field mb-3">
            <label className="block mb-2 font-bold">Account Title</label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon"><CreditCard size={18} /></span>
              <input type="text" value={form.account_title} placeholder="e.g. Ali Traders"
                className="p-inputtext p-component"
                onChange={(e) => setForm({ ...form, account_title: e.target.value })} />
            </div>
          </div>

          <div className="field mb-4">
            <label className="block mb-2 font-bold">Account Number (IBAN/Phone)</label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon"><Hash size={18} /></span>
              <input type="text" value={form.account_number} placeholder="e.g. PK00MEZN..."
                className="p-inputtext p-component"
                onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-content-end gap-2">
            <Button type="button" label="Cancel" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text" />
            <Button type="submit" label={loading ? "Saving..." : "Add Bank"} icon="pi pi-check" loading={loading} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}

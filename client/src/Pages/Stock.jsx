import React, { useState, useEffect, useContext } from "react";
import { 
  Boxes, Plus, Minus, Search, AlertTriangle, TrendingUp, 
  Database, Info, X, ChevronRight, ChevronLeft, Hash, Truck, User, 
  CircleDollarSign, ArrowUpCircle, ArrowDownCircle, Tag
} from "lucide-react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ActionMenu from '../components/ActionMenu';
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/products";

export default function Stock({ type }) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ 
    supplier_id: "", quantity: "", vehicle_number: "", vehicle_id: "", 
    rate: "", paid_amount: "0", delivery_charges: "0", fare_status: "Pending" 
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState(type || (user?.email === 'admin@erp.com' ? "" : user?.module_type || "Wholesale"));
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnBillNo, setReturnBillNo] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user?.email !== 'admin@erp.com') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.email]);

  const CATEGORIES = [
    { name: "Cement", icon: "🧱" },
    { name: "Steel", icon: "🏗️" },
    { name: "Crush", icon: "🪨" },
    { name: "Bricks", icon: "🧱" },
    { name: "Sand", icon: "🏖️" },
    { name: "Tiles Bond", icon: "🔗" },
    { name: "Chips", icon: "⚪" },
    { name: "Other", icon: "📦" }
  ];

  const fetchData = async () => {
    if (!activeTab) return;
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
      const [prodRes, supRes, vehRes] = await Promise.all([
        fetch(`${API}?type=${activeTab}`, { headers }),
        fetch(`http://localhost:5000/api/suppliers?type=${activeTab}`, { headers }),
        fetch(`http://localhost:5000/api/transport?type=${activeTab}`, { headers })
      ]);
      const prodData = await prodRes.json();
      const supData = await supRes.json();
      const vehData = await vehRes.json();
      
      setProducts(Array.isArray(prodData) ? prodData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
      setVehicles(Array.isArray(vehData) ? vehData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // If Admin and no counter selected, show selection screen
  if (user?.email === 'admin@erp.com' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's stock inventory you want to view</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">📦</div>
            <h3>Wholesale</h3>
            <span>Main Warehouse</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">🗳️</div>
            <h3>Retail 1</h3>
            <span>Counter A</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">🗃️</div>
            <h3>Retail 2</h3>
            <span>Counter B</span>
          </div>
        </div>
      </div>
    );
  }

  const updateStock = async (e, prod, adjustment) => {
    e.stopPropagation();
    const newQty = parseFloat(prod.stock_quantity || 0) + adjustment;
    if (newQty < 0) return;

    try {
      await fetch(`${API}/${prod.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...prod, stock_quantity: newQty })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    const totalCost = parseFloat(receiveForm.quantity || 0) * parseFloat(receiveForm.rate || 0);
    if (parseFloat(receiveForm.paid_amount || 0) > totalCost) {
      alert("Invalid Payment: Paid amount cannot exceed total purchase cost!");
      return;
    }
    
    const amt = parseFloat(receiveForm.paid_amount || 0);
    setLoading(true);
    if (amt > 0) {
      try {
        // Fetch live balances
        const balRes = await fetch('http://localhost:5000/api/banks/balances', {
          headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        if (balRes.ok) {
          const balances = await balRes.json();
          const currentAvailable = balances['Cash'] || 0;
          
          if (amt > currentAvailable) {
            alert(`Insufficient Balance! You only have Rs. ${currentAvailable.toLocaleString()} in your Cash account. You cannot make a payment of Rs. ${amt.toLocaleString()} for this stock!`);
            setLoading(false);
            return;
          }
        }
      } catch (err) { console.error("Balance fetch failed:", err); }
    }
    try {
      const res = await fetch(`http://localhost:5000/api/purchases`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          supplier_id: receiveForm.supplier_id,
          product_id: selectedProduct.id,
          vehicle_number: receiveForm.vehicle_number,
          quantity: receiveForm.quantity,
          rate: receiveForm.rate,
          paid_amount: receiveForm.paid_amount,
          delivery_charges: receiveForm.delivery_charges,
          fare_status: receiveForm.fare_status,
          module_type: activeTab
        })
      });
      if (res.ok) {
        setShowReceiveModal(false);
        setReceiveForm({ 
          supplier_id: "", quantity: "", vehicle_number: "", vehicle_id: "", 
          rate: "", paid_amount: "0", delivery_charges: "0", fare_status: "Pending" 
        });
        fetchData();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSaleReturn = async (e) => {
    e.preventDefault();
    if (!returnBillNo) return;
    setReturnLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/sales/return", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sale_id: returnBillNo })
      });
      const data = await res.json();
      if (res.ok) {
        setShowReturnModal(false);
        setReturnBillNo("");
        fetchData();
        alert("Stock successfully returned to inventory!");
      } else {
        alert(data.error || "Failed to process return");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing return");
    } finally {
      setReturnLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    let matchCat = false;
    const catLower = (p.category || "").toLowerCase();
    const selCatLower = selectedCategory ? selectedCategory.toLowerCase() : "";

    if (!selectedCategory) {
      matchCat = true;
    } else if (selCatLower === "steel" && (catLower === "iron/steel" || catLower === "steel")) {
      matchCat = true;
    } else if (selCatLower === "crush" && (catLower === "crush/bajri" || catLower === "crush")) {
      matchCat = true;
    } else {
      matchCat = catLower === selCatLower;
    }

    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.brand || "").toLowerCase().includes(search.toLowerCase());
    const matchStock = filterStock === "All" || 
                       (filterStock === "Low" && parseFloat(p.stock_quantity || 0) <= parseFloat(p.minimum_stock || 0)) ||
                       (filterStock === "Out" && parseFloat(p.stock_quantity || 0) <= 0);
    return matchCat && matchSearch && matchStock;
  });

  const lowStockCount = products.filter(p => parseFloat(p.stock_quantity || 0) <= parseFloat(p.minimum_stock || 0)).length;
  const outOfStockCount = products.filter(p => parseFloat(p.stock_quantity || 0) <= 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * parseFloat(p.stock_quantity || 0)), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <button className="btn-icon back-btn" onClick={() => selectedCategory ? setSelectedCategory(null) : window.history.back()} style={{marginRight: '15px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.2s'}}>
            <ChevronLeft size={20} />
          </button>
          <div className="module-icon stock-icon"><Database size={28} /></div>
          <div>
            <h1>{selectedCategory ? `${selectedCategory} Stock` : 'Stock Management'}</h1>
            <p>{selectedCategory ? `Managing ${activeTab} inventory for ${selectedCategory}` : `Monitor and manage ${activeTab} inventory levels`}</p>
          </div>
        </div>

        {/* Counter Switcher for Admin */}
        {user?.role === 'admin' && !user?.module_type && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        <div className="module-actions" style={{display: 'flex', gap: '10px'}}>
          <button className="btn-primary" 
            onClick={() => setShowReturnModal(true)}
            style={{background: '#f43f5e', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
            <ArrowDownCircle size={20} />
            Sale Return (Bill)
          </button>
        </div>
      </div>

      <div className="stats-grid-pos">
        <div className="pos-stat-card">
          <div className="icon orange"><AlertTriangle size={24} /></div>
          <div className="info">
            <span className="label">Low Stock</span>
            <span className="value">{lowStockCount} Items</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red"><X size={24} /></div>
          <div className="info">
            <span className="label">Out of Stock</span>
            <span className="value">{outOfStockCount} Items</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon blue"><Database size={24} /></div>
          <div className="info">
            <span className="label">Total Products</span>
            <span className="value">{products.length} Items</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><TrendingUp size={24} /></div>
          <div className="info">
            <span className="label">Inventory Value</span>
            <span className="value">Rs. {totalStockValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {!selectedCategory ? (
        <div className="category-grid" style={{marginTop: '20px'}}>
          {CATEGORIES.map((cat) => {
            const isSteel = cat.name.toLowerCase() === "steel";
            const isCrush = cat.name.toLowerCase() === "crush";
            const count = products.filter(p => {
              const catLower = (p.category || "").toLowerCase();
              return isSteel ? (catLower === "iron/steel" || catLower === "steel") : isCrush ? (catLower === "crush/bajri" || catLower === "crush") : catLower === cat.name.toLowerCase();
            }).length;
            const catStock = products.filter(p => {
              const catLower = (p.category || "").toLowerCase();
              return isSteel ? (catLower === "iron/steel" || catLower === "steel") : isCrush ? (catLower === "crush/bajri" || catLower === "crush") : catLower === cat.name.toLowerCase();
            }).reduce((sum, p) => sum + parseFloat(p.stock_quantity || 0), 0);
            return (
              <div key={cat.name} className="category-card" onClick={() => setSelectedCategory(cat.name)}>
                <div className="category-emoji">{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{count} Brands | {catStock} Total Units</p>
                <div className="category-footer">
                  <span>View Stock Details</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="pos-table-actions">
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                placeholder={`Search in ${selectedCategory}...`} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div className="filter-group">
              <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                <option value="All">All Stock Levels</option>
                <option value="Low">Low Stock Only</option>
                <option value="Out">Out of Stock Only</option>
              </select>
            </div>
          </div>

          <div className="module-table-container" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
            <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} 
                       emptyMessage="No stock items found." className="p-datatable-sm" stripedRows responsiveLayout="scroll"
                       onRowClick={(e) => { setSelectedProduct(e.data); setShowDetailModal(true); }} rowHover style={{cursor: 'pointer'}}>
              <Column field="id" header="ID" body={(prod) => <span style={{fontWeight: 600, color: '#64748b'}}>#{prod.id}</span>} sortable style={{ width: '80px' }} />
              
              <Column field="brand" header="Brand" body={(prod) => (
                <span style={{fontWeight: 600, color: '#475569'}}>{prod.brand || 'N/A'}</span>
              )} sortable />

              <Column field="name" header="Product Name" body={(prod) => (
                <span style={{fontWeight: 700, fontSize: '1rem', color: '#1e293b'}}>{prod.name}</span>
              )} sortable />
              
              <Column header="Min Level" body={(prod) => (
                <span className="min-tag" style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600}}>
                  {parseFloat(prod.minimum_stock || 0).toLocaleString()} {prod.unit}
                </span>
              )} field="minimum_stock" sortable />
              
              <Column header="Current Stock" body={(prod) => {
                const qty = parseFloat(prod.stock_quantity || 0);
                const min = parseFloat(prod.minimum_stock || 0);
                const isOut = qty <= 0;
                const isLow = qty <= min;
                return (
                  <span style={{fontWeight: 800, fontSize: '1rem', color: isOut ? '#e11d48' : isLow ? '#f59e0b' : '#16a34a'}}>
                    {qty.toLocaleString()} {prod.unit}
                  </span>
                );
              }} sortable field="stock_quantity" />
              
              <Column header="Status" body={(prod) => {
                const qty = parseFloat(prod.stock_quantity || 0);
                const min = parseFloat(prod.minimum_stock || 0);
                const isOut = qty <= 0;
                const isLow = qty <= min;
                return (
                  <span className={`status-badge ${isOut ? 'cancelled' : isLow ? 'pending' : 'paid'}`} style={{padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700}}>
                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                  </span>
                );
              }} />
              
              <Column header="" body={(prod) => (
                <ActionMenu 
                  extraItems={[
                    { 
                      label: 'Receive Stock', 
                      icon: 'pi pi-truck', 
                      command: () => { 
                        setSelectedProduct(prod); 
                        setReceiveForm({...receiveForm, rate: prod.cost_price || ""});
                        setShowReceiveModal(true); 
                      } 
                    }
                  ]}
                />
              )} style={{ textAlign: 'center', width: '60px' }} />
            </DataTable>
          </div>
        </>
      )}

      {/* Stock Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal stock-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-info">
                <Database size={24} color="#3b82f6" />
                <h3>Stock Information</h3>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            
            <div className="detail-body">
              <div className="detail-main-header">
                <h2>{selectedProduct.name}</h2>
                <span className="category-tag">{selectedProduct.category}</span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <Tag size={18} />
                  <div>
                    <span className="label">Brand / Company</span>
                    <span className="value">{selectedProduct.brand || 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Hash size={18} />
                  <div>
                    <span className="label">Stock Level</span>
                    <span className={`value bold ${parseFloat(selectedProduct.stock_quantity) <= parseFloat(selectedProduct.minimum_stock) ? 'text-orange' : 'text-green'}`}>
                      {selectedProduct.stock_quantity} {selectedProduct.unit}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <CircleDollarSign size={18} />
                  <div>
                    <span className="label">Retail Price</span>
                    <span className="value">Rs. {parseFloat(selectedProduct.price).toLocaleString()}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Info size={18} />
                  <div>
                    <span className="label">Min. Alert Level</span>
                    <span className="value">{selectedProduct.minimum_stock} {selectedProduct.unit}</span>
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="detail-section">
                  <h4>Product Notes</h4>
                  <p>{selectedProduct.description}</p>
                </div>
              )}

              <div className="detail-actions">
                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                <div className="quick-add">
                   <span>Adjust Stock:</span>
                   <button onClick={(e) => updateStock(e, selectedProduct, -5)} className="btn-quick-adjust red">-5</button>
                   <button onClick={(e) => updateStock(e, selectedProduct, 5)} className="btn-quick-adjust green">+5</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal (Purchase Entry) */}
      {showReceiveModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Receive Stock / Purchase Entry</h3>
              <button className="modal-close" onClick={() => setShowReceiveModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleReceiveStock} className="custom-form">
              <div className="form-grid">
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label>Supplier / Vendor *</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <select required value={receiveForm.supplier_id} onChange={(e) => setReceiveForm({ ...receiveForm, supplier_id: e.target.value })}>
                      <option value="">Select a Supplier</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name} {sup.company ? `(${sup.company})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Quantity Received *</label>
                  <div className="input-wrapper">
                    <Database size={18} />
                    <input type="number" required value={receiveForm.quantity} placeholder={`e.g. 100 ${selectedProduct.unit}`}
                      onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Vehicle Number *</label>
                  <div className="input-wrapper">
                    <Truck size={18} />
                    <input type="text" required value={receiveForm.vehicle_number} placeholder="e.g. LET-123"
                      onChange={(e) => setReceiveForm({ ...receiveForm, vehicle_number: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Fare (Delivery Charges) *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" required value={receiveForm.delivery_charges} placeholder="0.00"
                      onChange={(e) => setReceiveForm({ ...receiveForm, delivery_charges: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Fare Status</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <select value={receiveForm.fare_status} onChange={(e) => setReceiveForm({ ...receiveForm, fare_status: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid (Cash)</option>
                      <option value="Free">Free</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Cost Rate (per unit) *</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" step="0.01" required value={receiveForm.rate} placeholder="0.00"
                      onChange={(e) => setReceiveForm({ ...receiveForm, rate: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Bill Amount</label>
                  <div className="input-wrapper" style={{background: '#f8fafc'}}>
                    <CircleDollarSign size={18} color="#64748b" />
                    <input type="text" disabled value={`Rs. ${((parseFloat(receiveForm.quantity) || 0) * (parseFloat(receiveForm.rate) || 0)).toLocaleString()}`} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount Paid Now</label>
                  <div className="input-wrapper">
                    <TrendingUp size={18} />
                    <input type="number" step="0.01" required value={receiveForm.paid_amount} placeholder="0.00"
                      onChange={(e) => setReceiveForm({ ...receiveForm, paid_amount: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Balance to Pay</label>
                  <div className="input-wrapper" style={{background: '#fff1f2'}}>
                    <AlertTriangle size={18} color="#e11d48" />
                    <input type="text" disabled value={`Rs. ${(((parseFloat(receiveForm.quantity) || 0) * (parseFloat(receiveForm.rate) || 0)) - (parseFloat(receiveForm.paid_amount) || 0)).toLocaleString()}`} style={{color: '#e11d48', fontWeight: 'bold'}} />
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowReceiveModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Processing..." : "Complete Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Sale Return Modal */}
      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <div className="header-info">
                <ArrowDownCircle size={24} color="#f43f5e" />
                <h3>Process Sale Return</h3>
              </div>
              <button className="modal-close" onClick={() => setShowReturnModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaleReturn} className="custom-form p-fluid" style={{padding: '20px'}}>
              <div className="field mb-4">
                <label className="block mb-2 font-bold" style={{color: '#475569'}}>Bill Number (Sale ID) *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon"><Hash size={18} /></span>
                  <input 
                    type="number" 
                    required 
                    value={returnBillNo} 
                    placeholder="Enter Bill Number e.g. 101"
                    className="p-inputtext p-component"
                    onChange={e => setReturnBillNo(e.target.value)} 
                  />
                </div>
                <p style={{fontSize: '0.75rem', color: '#64748b', marginTop: '8px'}}>
                  Note: This will return ALL items from this bill back to stock and adjust the customer balance.
                </p>
              </div>

              <div className="flex justify-content-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background: '#f43f5e'}} disabled={returnLoading}>
                  {returnLoading ? "Processing..." : "Return to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

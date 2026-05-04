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
    supplier_id: "", quantity: "", vehicle_number: "", rate: "", paid_amount: "0" 
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState(type || (user?.role === 'admin' ? "" : user?.module_type || "Wholesale"));

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user.role !== 'admin') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.role]);

  const CATEGORIES = [
    { name: "Cement", icon: "🧱" },
    { name: "Iron/Steel", icon: "🏗️" },
    { name: "Bricks", icon: "🧱" },
    { name: "Sand", icon: "🏖️" },
    { name: "Crush/Bajri", icon: "🪨" },
    { name: "Tiles", icon: "🔲" },
    { name: "Paint", icon: "🎨" },
    { name: "Sanitary", icon: "🚿" },
    { name: "Hardware", icon: "🔧" },
    { name: "Other", icon: "📦" }
  ];

  const fetchData = async () => {
    if (!activeTab) return;
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
      const [prodRes, supRes] = await Promise.all([
        fetch(`${API}?type=${activeTab}`, { headers }),
        fetch(`http://localhost:5000/api/suppliers?type=${activeTab}`, { headers })
      ]);
      const prodData = await prodRes.json();
      const supData = await supRes.json();
      
      setProducts(Array.isArray(prodData) ? prodData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
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
    setLoading(true);
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
          module_type: activeTab
        })
      });
      if (res.ok) {
        setShowReceiveModal(false);
        setReceiveForm({ supplier_id: "", quantity: "", vehicle_number: "", rate: "", paid_amount: "0" });
        fetchData();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = products.filter((p) => {
    const matchCat = !selectedCategory || p.category === selectedCategory;
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
          {selectedCategory && (
            <button className="btn-icon back-btn" onClick={() => setSelectedCategory(null)} style={{marginRight: '15px'}}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="module-icon stock-icon"><Database size={28} /></div>
          <div>
            <h1>{selectedCategory ? `${selectedCategory} Stock` : 'Stock Management'}</h1>
            <p>{selectedCategory ? `Managing ${activeTab} inventory for ${selectedCategory}` : `Monitor and manage ${activeTab} inventory levels`}</p>
          </div>
        </div>

        {/* Counter Switcher for Admin */}
        {user?.role === 'admin' && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}
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
            const count = products.filter(p => p.category === cat.name).length;
            const catStock = products.filter(p => p.category === cat.name).reduce((sum, p) => sum + parseFloat(p.stock_quantity || 0), 0);
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
              <Column header="Product Details" body={(prod) => (
                <div className="prod-main-info">
                  <span className="name" style={{fontWeight: 700, fontSize: '1rem', color: '#1e293b'}}>{prod.name}</span>
                  <span className="v-num" style={{color: '#64748b', fontSize: '0.8rem'}}><Tag size={12}/> {prod.brand || 'N/A'}</span>
                </div>
              )} sortable field="name" />
              
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
                    <input type="text" value={receiveForm.vehicle_number} placeholder="e.g. LET-123" required
                      onChange={(e) => setReceiveForm({ ...receiveForm, vehicle_number: e.target.value })} />
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
    </div>
  );
}

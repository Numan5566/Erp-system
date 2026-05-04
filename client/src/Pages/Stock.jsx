import React, { useState, useEffect, useContext } from "react";
import { 
  Boxes, Plus, Minus, Search, AlertTriangle, TrendingUp, 
  Database, Info, X, ChevronRight, ChevronLeft, Hash, Truck, User, 
  CircleDollarSign, ArrowUpCircle, ArrowDownCircle
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/products";

export default function Stock({ type }) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
      const res = await fetch(`${API}?type=${activeTab}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
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
        body: JSON.stringify({ ...prod, stock_quantity: newQty }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update stock", err);
    }
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

          <div className="module-table-container">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Min. Level</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th style={{textAlign: 'center'}}>Quick Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="5" className="empty-msg">No stock records found in {selectedCategory}.</td></tr>
                ) : (
                  filtered.map((prod) => {
                    const qty = parseFloat(prod.stock_quantity || 0);
                    const min = parseFloat(prod.minimum_stock || 0);
                    const isLow = qty <= min && qty > 0;
                    const isOut = qty <= 0;

                    return (
                      <tr key={prod.id} onClick={() => { setSelectedProduct(prod); setShowDetailModal(true); }}>
                        <td>
                          <div className="prod-main-info">
                            <span className="name">{prod.name}</span>
                            <span className="v-num"><Truck size={12}/> {prod.brand || 'N/A'}</span>
                          </div>
                        </td>
                        <td><span className="min-tag">{min} {prod.unit}</span></td>
                        <td className="bold">
                          <span className={isOut ? 'text-red' : isLow ? 'text-orange' : 'text-green'}>
                            {qty} {prod.unit}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${isOut ? 'cancelled' : isLow ? 'pending' : 'paid'}`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td>
                          <div className="adjust-btns" onClick={(e) => e.stopPropagation()}>
                            <button className="btn-adjust minus" onClick={(e) => updateStock(e, prod, -1)}><Minus size={14}/></button>
                            <button className="btn-adjust plus" onClick={(e) => updateStock(e, prod, 1)}><Plus size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
                  <Truck size={18} />
                  <div>
                    <span className="label">Vehicle Number</span>
                    <span className="value">{selectedProduct.brand || 'No Vehicle Tracked'}</span>
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
    </div>
  );
}

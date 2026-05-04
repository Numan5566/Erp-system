import React, { useState, useEffect, useContext } from "react";
import { 
  Package, Plus, Pencil, Trash2, X, Search, ChevronLeft, 
  Layers, Database, Hash, BarChart3, Info, CircleDollarSign, Truck, Tag, Weight,
  ShoppingCart, ShieldCheck, ClipboardList, Eye, ChevronRight
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/products";

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

const emptyForm = {
  name: "",
  brand: "",
  category: "Cement",
  unit: "Bag",
  price: "",
  cost_price: "",
  stock_quantity: "",
  minimum_stock: "",
  description: "",
};

export default function Products({ type }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(type || (user?.role === 'admin' ? "" : user?.module_type));
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user.role !== 'admin') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.role]);

  const fetchProducts = async () => {
    if (!activeTab) return;
    try {
      const url = `${API}?type=${activeTab}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  useEffect(() => { fetchProducts(); }, [activeTab]);

  // If Admin and no counter selected, show selection screen
  if (user?.role === 'admin' && !activeTab && !type) {
    return (
      <div className="admin-selection-container">
        <h2>Select Counter</h2>
        <p>Choose which counter's product catalog you want to manage</p>
        <div className="selection-grid">
          <div className="selection-card wholesale" onClick={() => setActiveTab('Wholesale')}>
            <div className="icon-box">🧱</div>
            <h3>Wholesale</h3>
            <span>Main Warehouse</span>
          </div>
          <div className="selection-card retail1" onClick={() => setActiveTab('Retail 1')}>
            <div className="icon-box">🏗️</div>
            <h3>Retail 1</h3>
            <span>Counter A</span>
          </div>
          <div className="selection-card retail2" onClick={() => setActiveTab('Retail 2')}>
            <div className="icon-box">🔲</div>
            <h3>Retail 2</h3>
            <span>Counter B</span>
          </div>
        </div>
      </div>
    );
  }

  const openAdd = (cat) => {
    setForm({ ...emptyForm, category: cat || selectedCategory || "Cement" });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (e, prod) => {
    e.stopPropagation();
    setForm({
      name: prod.name,
      brand: prod.brand || "",
      category: prod.category,
      unit: prod.unit || "Bag",
      price: prod.price,
      cost_price: prod.cost_price || "",
      stock_quantity: prod.stock_quantity,
      minimum_stock: prod.minimum_stock || "",
      description: prod.description || "",
    });
    setEditId(prod.id);
    setShowModal(true);
  };

  const openDetail = (prod) => {
    setSelectedProduct(prod);
    setShowDetailModal(true);
  };

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
        body: JSON.stringify({ ...form, module_type: type || activeTab }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchProducts();
      }
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure?")) return;
    try {
      await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProducts();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const filteredProducts = products.filter(p => 
    (!selectedCategory || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          {selectedCategory && (
            <button className="btn-icon back-btn" onClick={() => setSelectedCategory(null)} style={{marginRight:'15px'}}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="module-icon investment-icon"><Package size={28} /></div>
          <div>
            <h1>{selectedCategory ? `${selectedCategory} Inventory` : "Product Management"}</h1>
            <p>Managing {activeTab} product catalog and pricing</p>
          </div>
        </div>

        {user?.role === 'admin' && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => openAdd()}><Plus size={18} /> Add New Product</button>
        )}
      </div>

      <div className="pos-table-actions">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search products by name or vehicle number..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
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
                  <span>View Details</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="module-table-container">
          <table className="module-table">
            <thead>
              <tr>
                <th>Brand / Product</th>
                <th>Retail Price</th>
                <th>Cost Price</th>
                <th>Current Stock</th>
                <th>Status</th>
                {user?.role === 'admin' && <th style={{textAlign: 'center'}}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="empty-msg">No products found in {selectedCategory}.</td></tr>
              ) : (
                filteredProducts.map((prod) => {
                  const qty = parseFloat(prod.stock_quantity || 0);
                  const min = parseFloat(prod.minimum_stock || 0);
                  const isLow = qty <= min && qty > 0;
                  const isOut = qty <= 0;

                  return (
                    <tr key={prod.id} onClick={() => openDetail(prod)}>
                      <td>
                        <div className="prod-main-info">
                          <span className="name">{prod.name}</span>
                          <span className="v-num"><Truck size={12}/> {prod.brand || 'N/A'}</span>
                        </div>
                      </td>
                      <td><span className="bold">Rs. {parseFloat(prod.price).toLocaleString()}</span></td>
                      <td><span className="text-muted">Rs. {parseFloat(prod.cost_price || 0).toLocaleString()}</span></td>
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
                      {user?.role === 'admin' && (
                        <td>
                          <div className="adjust-btns" onClick={(e) => e.stopPropagation()}>
                            <button className="btn-adjust plus" onClick={(e) => openEdit(e, prod)} title="Edit"><Pencil size={14}/></button>
                            <button className="btn-adjust minus" onClick={(e) => handleDelete(e, prod.id)} title="Delete"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-info">
                <Package size={24} color="#3b82f6" />
                <h3>Product Details</h3>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div className="detail-body">
              <div className="detail-title-row">
                <h2>{selectedProduct.name}</h2>
                <span className="cat-badge">{selectedProduct.category}</span>
              </div>

              <div className="stats-mini-grid">
                <div className="stat-item">
                   <Truck size={18}/>
                   <div>
                     <span className="lab">Vehicle No</span>
                     <span className="val">{selectedProduct.brand || 'N/A'}</span>
                   </div>
                </div>
                <div className="stat-item">
                   <CircleDollarSign size={18}/>
                   <div>
                     <span className="lab">Retail Price</span>
                     <span className="val">Rs. {parseFloat(selectedProduct.price).toLocaleString()}</span>
                   </div>
                </div>
                <div className="stat-item">
                   <Database size={18}/>
                   <div>
                     <span className="lab">Current Stock</span>
                     <span className="val">{selectedProduct.stock_quantity} {selectedProduct.unit}</span>
                   </div>
                </div>
                <div className="stat-item">
                   <Hash size={18}/>
                   <div>
                     <span className="lab">Min Stock</span>
                     <span className="val">{selectedProduct.minimum_stock} {selectedProduct.unit}</span>
                   </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="detail-desc">
                  <h4>Description / Notes</h4>
                  <p>{selectedProduct.description}</p>
                </div>
              )}

              <div className="detail-footer">
                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                {user?.role === 'admin' && (
                  <button className="btn-primary" onClick={(e) => { setShowDetailModal(false); openEdit(e, selectedProduct); }}>Edit Product</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Product" : "Add New Product"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="section-label">Basic Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <div className="input-wrapper">
                    <Package size={18} />
                    <input type="text" value={form.name} required placeholder="e.g. DJ Cement"
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <div className="input-wrapper">
                    <Truck size={18} />
                    <input type="text" value={form.brand} placeholder="e.g. ABC-123"
                      onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <div className="input-wrapper">
                    <Tag size={18} />
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <div className="input-wrapper">
                    <Weight size={18} />
                    <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                      <option value="Bag">Bag</option>
                      <option value="Kg">Kg</option>
                      <option value="Ton">Ton</option>
                      <option value="Liter">Liter</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Feet">Feet</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="section-label">Pricing & Inventory</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Retail Price (Selling)</label>
                  <div className="input-wrapper">
                    <ShoppingCart size={18} />
                    <input type="number" step="0.01" value={form.price} required placeholder="0.00"
                      onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Cost Price (Purchase)</label>
                  <div className="input-wrapper">
                    <CircleDollarSign size={18} />
                    <input type="number" step="0.01" value={form.cost_price} placeholder="0.00"
                      onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Initial Stock Qty</label>
                  <div className="input-wrapper">
                    <Database size={18} />
                    <input type="number" step="0.01" value={form.stock_quantity} required placeholder="0.00"
                      onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Minimum Stock Alert</label>
                  <div className="input-wrapper">
                    <ShieldCheck size={18} />
                    <input type="number" step="0.01" value={form.minimum_stock} placeholder="0"
                      onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="section-label">Additional Notes</div>
              <div className="form-group full-width">
                <div className="input-wrapper" style={{display:'block'}}>
                  <textarea value={form.description} placeholder="Add any specific notes about this product..."
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

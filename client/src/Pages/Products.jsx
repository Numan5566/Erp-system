import React, { useState, useEffect } from "react";
import { 
  Package, Plus, Pencil, Trash2, X, Search, Filter, 
  Info, AlertTriangle, CheckCircle2, ChevronRight,
  TrendingDown, TrendingUp, Boxes, LayoutGrid, List as ListIcon
} from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/products";

const CATEGORIES = ["Cement", "Steel", "Bricks", "Paints", "Electrical", "Plumbing", "Sanitary", "Tools", "Other"];
const UNITS = ["kg", "Bag", "Piece", "Foot", "Square Foot", "Meter", "Litre", "Dozen", "Bundle"];

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
  image_url: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => { 
    setForm(emptyForm); 
    setEditId(null); 
    setShowModal(true); 
  };

  const openEdit = (e, prod) => {
    e.stopPropagation();
    setForm({
      name: prod.name,
      brand: prod.brand || "",
      category: prod.category || "Cement",
      unit: prod.unit || "Bag",
      price: prod.price,
      cost_price: prod.cost_price || "",
      stock_quantity: prod.stock_quantity,
      minimum_stock: prod.minimum_stock || "",
      description: prod.description || "",
      image_url: prod.image_url || "",
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
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchProducts();
      } else {
        const errorData = await res.json();
        alert("Error saving product: " + errorData.error);
      }
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Network error: Failed to save product");
    }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`${API}/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.brand || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalStockValue = filtered.reduce((sum, p) => sum + (parseFloat(p.price) * parseFloat(p.stock_quantity || 0)), 0);
  const lowStockCount = filtered.filter(p => parseFloat(p.stock_quantity || 0) <= parseFloat(p.minimum_stock || 0)).length;

  const getStockStatus = (prod) => {
    const qty = parseFloat(prod.stock_quantity || 0);
    const min = parseFloat(prod.minimum_stock || 0);
    if (qty <= 0) return { label: "Out of Stock", class: "out-of-stock" };
    if (qty <= min) return { label: "Low Stock", class: "low-stock" };
    return { label: "In Stock", class: "in-stock" };
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon"><Package size={28} /></div>
          <div>
            <h1>Product Inventory</h1>
            <p>Manage your items, brands, and stock levels</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
            <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}><ListIcon size={18} /></button>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Total Products</span>
          <span className="summary-value">{filtered.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Stock Value</span>
          <span className="summary-value accent">Rs. {totalStockValue.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Low Stock Items</span>
          <span className="summary-value orange">{lowStockCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Inventory Items</span>
          <span className="summary-value green">{filtered.reduce((sum, p) => sum + parseFloat(p.stock_quantity || 0), 0)}</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by name or brand..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Main Content: Grid or Table */}
      {viewMode === "grid" ? (
        <div className="product-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">No products found. Add some to get started!</div>
          ) : (
            filtered.map((prod) => {
              const status = getStockStatus(prod);
              return (
                <div key={prod.id} className="product-card" onClick={() => openDetail(prod)}>
                  <div className="product-image">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} />
                    ) : (
                      <div className="placeholder-img"><Package size={48} /></div>
                    )}
                    <span className="category-badge">{prod.category}</span>
                    <div className="product-actions">
                      <button className="btn-icon edit" onClick={(e) => openEdit(e, prod)}><Pencil size={14} /></button>
                      <button className="btn-icon delete" onClick={(e) => handleDelete(e, prod.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="product-info">
                    <span className="brand-name">{prod.brand || "Generic"}</span>
                    <h3>{prod.name}</h3>
                    <div className="price-row">
                      <span className="price">Rs. {parseFloat(prod.price).toLocaleString()}</span>
                      <span className="unit">per {prod.unit}</span>
                    </div>
                    <div className={`stock-status ${status.class}`}>
                      <div className="indicator"></div>
                      {status.label}: {prod.stock_quantity} {prod.unit}s
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod) => {
                const status = getStockStatus(prod);
                return (
                  <tr key={prod.id} onClick={() => openDetail(prod)} style={{cursor: 'pointer'}}>
                    <td><strong>{prod.name}</strong></td>
                    <td>{prod.brand || "—"}</td>
                    <td><span className="tag">{prod.category}</span></td>
                    <td className="amount">Rs. {parseFloat(prod.price).toLocaleString()}</td>
                    <td>{prod.stock_quantity} {prod.unit}</td>
                    <td>
                      <span className={`badge badge-${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="btn-icon edit" onClick={(e) => openEdit(e, prod)}><Pencil size={15} /></button>
                      <button className="btn-icon delete" onClick={(e) => handleDelete(e, prod.id)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h3>{editId ? "Edit Product" : "Add New Product"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Lucky Cement" />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input type="text" value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Lucky, Maple Leaf" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Selling Price (Rs.) *</label>
                  <input type="number" required min="0" step="0.01" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 1250" />
                </div>
                <div className="form-group">
                  <label>Cost Price (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    placeholder="e.g. 1100" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" min="0" value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    placeholder="e.g. 100" />
                </div>
                <div className="form-group">
                  <label>Min. Stock Level (Alert)</label>
                  <input type="number" min="0" value={form.minimum_stock}
                    onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                    placeholder="e.g. 10" />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional product details..."
                  rows="3"
                  className="custom-textarea"
                />
              </div>
              <div className="form-group full-width">
                <label>Image URL (Optional)</label>
                <input type="text" value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {showDetailModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-img">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} />
                  ) : (
                    <Package size={80} color="#cbd5e1" />
                  )}
                </div>
                <div className="detail-title">
                  <span className="detail-brand">{selectedProduct.brand || "Generic"}</span>
                  <h2>{selectedProduct.name}</h2>
                  <span className="tag">{selectedProduct.category}</span>
                </div>
              </div>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Selling Price</span>
                  <span className="value highlight">Rs. {parseFloat(selectedProduct.price).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Cost Price</span>
                  <span className="value">Rs. {parseFloat(selectedProduct.cost_price || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Current Stock</span>
                  <span className={`value ${getStockStatus(selectedProduct).class}`}>
                    {selectedProduct.stock_quantity} {selectedProduct.unit}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Min. Stock Level</span>
                  <span className="value">{selectedProduct.minimum_stock || 0} {selectedProduct.unit}</span>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="detail-description">
                  <span className="label">Description</span>
                  <p>{selectedProduct.description}</p>
                </div>
              )}

              <div className="detail-footer">
                <div className="profit-badge">
                  <TrendingUp size={16} />
                  Margin: Rs. {(parseFloat(selectedProduct.price) - parseFloat(selectedProduct.cost_price || 0)).toLocaleString()}
                </div>
                <button className="btn-primary" onClick={(e) => { setShowDetailModal(false); openEdit(e, selectedProduct); }}>
                  <Pencil size={16} /> Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

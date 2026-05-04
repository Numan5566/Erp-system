import React, { useState, useEffect } from "react";
import { Boxes, Plus, Minus, Pencil, Trash2, X, Search, AlertCircle, TrendingUp } from "lucide-react";
import "../Styles/ModulePages.scss";

const API = "http://localhost:5000/api/products";

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("All");
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

  const updateStock = async (prod, adjustment) => {
    const newQty = parseFloat(prod.stock_quantity || 0) + adjustment;
    if (newQty < 0) return alert("Stock cannot be negative!");

    try {
      await fetch(`${API}/${prod.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...prod, stock_quantity: newQty }),
      });
      fetchProducts();
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.brand || "").toLowerCase().includes(search.toLowerCase());
    const matchStock = filterStock === "All" || 
                       (filterStock === "Low" && parseFloat(p.stock_quantity || 0) <= parseFloat(p.minimum_stock || 0)) ||
                       (filterStock === "Out" && parseFloat(p.stock_quantity || 0) <= 0);
    return matchSearch && matchStock;
  });

  return (
    <div className="module-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon investment-icon"><Boxes size={28} /></div>
          <div>
            <h1>Stock Management</h1>
            <p>Monitor inventory levels and adjust stock quantities</p>
          </div>
        </div>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Low Stock Items</span>
          <span className="summary-value orange">{products.filter(p => parseFloat(p.stock_quantity || 0) <= parseFloat(p.minimum_stock || 0)).length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Out of Stock</span>
          <span className="summary-value red">{products.filter(p => parseFloat(p.stock_quantity || 0) <= 0).length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Inventory</span>
          <span className="summary-value accent">{products.reduce((sum, p) => sum + parseFloat(p.stock_quantity || 0), 0)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Stock Value</span>
          <span className="summary-value green">Rs. {products.reduce((sum, p) => sum + (parseFloat(p.price) * parseFloat(p.stock_quantity || 0)), 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name or brand..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
          <option value="All">All Stock Levels</option>
          <option value="Low">Low Stock</option>
          <option value="Out">Out of Stock</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Min. Stock</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">No stock records found.</td></tr>
            ) : (
              filtered.map((prod) => {
                const qty = parseFloat(prod.stock_quantity || 0);
                const min = parseFloat(prod.minimum_stock || 0);
                const isLow = qty <= min;
                const isOut = qty <= 0;

                return (
                  <tr key={prod.id}>
                    <td>
                      <strong>{prod.name}</strong>
                      <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>{prod.brand}</div>
                    </td>
                    <td><span className="tag">{prod.category}</span></td>
                    <td>{min} {prod.unit}</td>
                    <td className={`amount ${isOut ? 'red' : isLow ? 'orange' : 'green'}`}>
                      {qty} {prod.unit}
                    </td>
                    <td>
                      <span className={`badge badge-${isOut ? 'overdue' : isLow ? 'pending' : 'paid'}`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="btn-icon edit" onClick={() => updateStock(prod, 1)} title="Add 1"><Plus size={14} /></button>
                      <button className="btn-icon delete" onClick={() => updateStock(prod, -1)} title="Subtract 1"><Minus size={14} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

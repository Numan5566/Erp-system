import React, { useState, useEffect, useContext } from "react";
import { 
  ShoppingCart, Search, Trash2, User, Plus, Minus, 
  Printer, CreditCard, Banknote, Truck, Tag, X, CheckCircle,
  History, ArrowLeft, FileText, Download, Filter, Package
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../Styles/ModulePages.scss";

const PRODUCTS_API = "http://localhost:5000/api/products";
const CUSTOMERS_API = "http://localhost:5000/api/customers";
const SALES_API = "http://localhost:5000/api/sales";
const TRANSPORT_API = "http://localhost:5000/api/transport";

const CATEGORIES = ["All", "Cement", "Steel", "Bricks", "Sand", "Crush", "Tiles", "Chips", "Other"];

export default function Billing({ type }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(type || (user?.role === 'admin' ? "" : user?.module_type || "Wholesale"));

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (user?.module_type && user.role !== 'admin') {
      setActiveTab(user.module_type);
    }
  }, [type, user?.module_type, user?.role]);
  const [view, setView] = useState("POS");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentType, setPaymentType] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [viewSale, setViewSale] = useState(null);

  const fetchData = async () => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
    const [prodRes, custRes, transRes, salesRes] = await Promise.all([
      fetch(`${PRODUCTS_API}?type=${activeTab}`, { headers }),
      fetch(`${CUSTOMERS_API}?type=${activeTab}`, { headers }),
      fetch(TRANSPORT_API, { headers }),
      fetch(`${SALES_API}?type=${activeTab}`, { headers })
    ]);
    const prods = await prodRes.json();
    const custs = await custRes.json();
    const trans = await transRes.json();
    const sls = await salesRes.json();
    setProducts(Array.isArray(prods) ? prods : []);
    setCustomers(Array.isArray(custs) ? custs : []);
    setVehicles(Array.isArray(trans) ? trans : []);
    setSales(Array.isArray(sls) ? sls : []);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: parseFloat(product.price), 
        qty: 1, 
        subtotal: parseFloat(product.price) 
      }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const netTotal = subtotal - parseFloat(discount || 0) + parseFloat(delivery || 0);
  const balance = netTotal - parseFloat(paidAmount || 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setLoading(true);
    try {
      const saleData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Walk-in Customer",
        vehicle_id: selectedVehicle?.id || null,
        vehicle_number: selectedVehicle?.vehicle_number || "",
        total_amount: subtotal,
        discount: parseFloat(discount || 0),
        delivery_charges: parseFloat(delivery || 0),
        net_amount: netTotal,
        paid_amount: parseFloat(paidAmount || 0),
        balance_amount: balance,
        payment_type: paymentType,
        sale_type: activeTab,
        items: cart
      };

      const res = await fetch(SALES_API, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(saleData),
      });

      if (res.ok) {
        const result = await res.json();
        setLastSaleId(result.saleId);
        setShowSuccess(true);
        setCart([]);
        setDiscount(0);
        setDelivery(0);
        setPaidAmount(0);
        setSelectedCustomer(null);
        setSelectedVehicle(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === "All" || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="module-page billing-page">
      <div className="module-header no-print">
        <div className="module-title">
          <div className="module-icon billing-icon"><ShoppingCart size={28} /></div>
          <div>
            <h1>{activeTab} POS System</h1>
            <p>Generate invoices and manage counter sales</p>
          </div>
        </div>

        {user?.role === 'admin' && !type && (
          <div className="counter-switcher">
            <button className={activeTab === 'Wholesale' ? 'active' : ''} onClick={() => setActiveTab('Wholesale')}>Wholesale</button>
            <button className={activeTab === 'Retail 1' ? 'active' : ''} onClick={() => setActiveTab('Retail 1')}>Retail 1</button>
            <button className={activeTab === 'Retail 2' ? 'active' : ''} onClick={() => setActiveTab('Retail 2')}>Retail 2</button>
          </div>
        )}

        <div className="module-nav">
          <button className={view === 'POS' ? 'active' : ''} onClick={() => setView('POS')}><Plus size={18}/> New Sale</button>
          <button className={view === 'History' ? 'active' : ''} onClick={() => setView('History')}><History size={18}/> Sales History</button>
        </div>
      </div>

      {view === 'POS' ? (
        <div className="pos-container no-print">
          <div className="pos-main">
            <div className="category-tabs">
              {CATEGORIES.map(cat => (
                <button key={cat} className={selectedCategory === cat ? 'active' : ''} onClick={() => setSelectedCategory(cat)}>{cat}</button>
              ))}
            </div>

            <div className="pos-search">
              <Search size={20} />
              <input type="text" placeholder="Search by name or vehicle number..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="pos-grid">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="pos-card" onClick={() => addToCart(prod)}>
                  <div className="card-top">
                    <span className="brand">{prod.brand || 'N/A'}</span>
                    <span className="stock">{prod.stock_quantity} {prod.unit}</span>
                  </div>
                  <h4>{prod.name}</h4>
                  <div className="card-bottom">
                    <span className="price">Rs.{prod.price}</span>
                    <div className="add-btn"><Plus size={18}/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pos-sidebar">
            <div className="sidebar-header">
              <div className="title"><ShoppingCart size={20}/> <h3>Cart Items</h3></div>
              <span className="badge">{cart.length}</span>
            </div>

            <div className="sidebar-content">
              <div className="input-box">
                <label><User size={14}/> Select Customer</label>
                <select value={selectedCustomer?.id || ""} onChange={(e) => setSelectedCustomer(customers.find(c => c.id == e.target.value))}>
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              <div className="input-box">
                <label><Truck size={14}/> Transport Vehicle</label>
                <select value={selectedVehicle?.id || ""} onChange={(e) => setSelectedVehicle(vehicles.find(v => v.id == e.target.value))}>
                  <option value="">No Transport</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.owner_name})</option>)}
                </select>
              </div>

              <div className="cart-list">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <span className="name">{item.name}</span>
                      <span className="price">Rs.{item.price}</span>
                    </div>
                    <div className="item-controls">
                      <div className="qty-ctrl">
                        <button onClick={() => updateQty(item.id, -1)}><Minus size={14}/></button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}><Plus size={14}/></button>
                      </div>
                      <button className="del-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-footer">
              <div className="summary">
                <div className="row"><span>Subtotal</span> <span>Rs. {subtotal.toLocaleString()}</span></div>
                <div className="row"><span>Discount</span> <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
                <div className="row"><span>Delivery</span> <input type="number" value={delivery} onChange={(e) => setDelivery(e.target.value)} /></div>
                <div className="grand-total"><span>Total</span> <span>Rs. {netTotal.toLocaleString()}</span></div>
                
                <div className="payment-ctrl">
                  <input type="number" placeholder="Paid Amount" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>
              <button className="checkout-btn" onClick={handleCheckout} disabled={loading || cart.length === 0}>
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="history-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill No</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>#SAL-{s.id}</td>
                  <td>{s.customer_name}</td>
                  <td className="bold">Rs.{s.net_amount}</td>
                  <td className="text-green">Rs.{s.paid_amount}</td>
                  <td className="text-red">Rs.{s.balance_amount}</td>
                  <td><span className={`status-badge ${s.payment_type.toLowerCase()}`}>{s.payment_type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSuccess && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <CheckCircle size={60} color="#10b981" />
            <h2>Sale Completed!</h2>
            <p>Invoice #SAL-{lastSaleId} has been generated.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSuccess(false)}>Close</button>
              <button className="btn-primary" onClick={() => { window.print(); setShowSuccess(false); }}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

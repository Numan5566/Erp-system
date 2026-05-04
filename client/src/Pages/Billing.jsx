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
  const [vehicles, setVehicles] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentType, setPaymentType] = useState("Cash");
  const [selectedBank, setSelectedBank] = useState("");
  const [bankDigits, setBankDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [transportType, setTransportType] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const fetchData = async () => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
    const [prodRes, salesRes, vehiclesRes, banksRes] = await Promise.all([
      fetch(`${PRODUCTS_API}?type=${activeTab}`, { headers }),
      fetch(`${SALES_API}?type=${activeTab}`, { headers }),
      fetch(`${TRANSPORT_API}?type=${activeTab}`, { headers }),
      fetch(`http://localhost:5000/api/banks`, { headers })
    ]);
    const prods = await prodRes.json();
    const sls = await salesRes.json();
    const vehs = await vehiclesRes.json();
    const banks = await banksRes.json();
    setProducts(Array.isArray(prods) ? prods : []);
    setSales(Array.isArray(sls) ? sls : []);
    setVehicles(Array.isArray(vehs) ? vehs : []);
    setBankAccounts(Array.isArray(banks) ? banks : []);
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

  const updatePrice = (id, newPrice) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const p = parseFloat(newPrice) || 0;
        return { ...item, price: p, subtotal: item.qty * p };
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
    
    let finalPaymentType = paymentType;
    if (paymentType === 'Bank') {
      if (!selectedBank) return alert('Please select a Bank');
      if (bankDigits.length !== 4) return alert('Please enter last 4 digits of account');
      finalPaymentType = `Bank - ${selectedBank} (****${bankDigits})`;
    }

    setLoading(true);
    try {
      const saleData = {
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone,
        vehicle_type: transportType,
        vehicle_id: selectedVehicleId,
        total_amount: subtotal,
        discount: parseFloat(discount || 0),
        delivery_charges: parseFloat(delivery || 0),
        net_amount: netTotal,
        paid_amount: parseFloat(paidAmount || 0),
        balance_amount: balance,
        payment_type: finalPaymentType,
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
        setReceiptData({
          saleId: result.saleId,
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          customerName: saleData.customer_name,
          items: [...cart],
          totalAmount: netTotal
        });
        setShowSuccess(true);
        setCart([]);
        setDiscount(0);
        setDelivery(0);
        setPaidAmount(0);
        setCustomerName('');
        setCustomerPhone('');
        setTransportType('');
        setSelectedVehicleId('');
        setSelectedBank('');
        setBankDigits('');
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
                <label><User size={14}/> Customer Details</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Name (e.g. Walk-in)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <input type="text" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </div>

              <div className="input-box">
                <label><Truck size={14}/> Transport Vehicle</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={transportType} onChange={(e) => { setTransportType(e.target.value); setSelectedVehicleId(''); }} style={{ flex: 1 }}>
                    <option value="">No Transport</option>
                    <option value="Personal">Personal</option>
                    <option value="Rent">Rent</option>
                  </select>
                  {transportType && (
                    <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} style={{ flex: 1 }}>
                      <option value="">Select Vehicle</option>
                      {vehicles.filter(v => v.ownership_type === transportType).map(v => (
                        <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="cart-list">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-top">
                      <span className="name">{item.name}</span>
                      <button className="del-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={16}/></button>
                    </div>
                    <div className="item-bottom">
                      <div className="price-input-group">
                        <span>Rs.</span>
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => updatePrice(item.id, e.target.value)}
                        />
                      </div>
                      <div className="qty-ctrl">
                        <button onClick={() => updateQty(item.id, -1)}><Minus size={14}/></button>
                        <span className="qty-val">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}><Plus size={14}/></button>
                      </div>
                      <div className="item-subtotal">Rs. {(item.price * item.qty).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-footer">
            <div className="calc-grid">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="calc-row">
                <span>Discount</span>
                <div className="calc-input-wrapper">
                  <span>Rs.</span>
                  <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
              </div>
              <div className="calc-row">
                <span>Delivery</span>
                <div className="calc-input-wrapper">
                  <span>Rs.</span>
                  <input type="number" min="0" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
                </div>
              </div>
              <div className="grand-total">
                <span>Total</span>
                <span>Rs. {netTotal.toLocaleString()}</span>
              </div>
              <div className="payment-ctrl" style={{flexDirection: 'column', gap: '8px', alignItems: 'stretch'}}>
                <div style={{display: 'flex', gap: '8px'}}>
                  <input type="number" min="0" placeholder="Paid Amount" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} style={{flex: 1}} />
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{flex: 1}}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
                {paymentType === 'Bank' && (
                  <div style={{display: 'flex', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                    <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} style={{flex: 2, padding: '6px'}}>
                      <option value="">Select Bank</option>
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.bank_name}>{b.bank_name}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Last 4 Digits" 
                      maxLength="4" 
                      value={bankDigits} 
                      onChange={(e) => setBankDigits(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                      style={{flex: 1, padding: '6px'}}
                    />
                  </div>
                )}
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
        <div className="modal-overlay no-print">
          <div className="modal success-modal">
            <CheckCircle size={60} color="#10b981" />
            <h2>Sale Completed!</h2>
            <p>Invoice #SAL-{lastSaleId} has been generated.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSuccess(false)}>Close</button>
              <button className="btn-primary" onClick={() => { window.print(); }}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Section */}
      {receiptData && (
        <div className="thermal-receipt print-only">
          <div className="receipt-header">
            <h2>DATA WALEY</h2>
            <h2 style={{ fontSize: '15px', fontWeight: 'normal', margin: '2px 0 8px 0' }}>CEMENT DEALER</h2>
            <div className="contact-info">
              <p>Name 1: 0300-0000000</p>
              <p>Name 2: 0300-0000000</p>
            </div>
            <p className="address">
              12- Kachehri Main Larhoor Jathuwad Road,<br/>
              Daska - Tehsil & District Sialkot.
            </p>
          </div>
          
          <div className="dashed-line"></div>
          <h3 className="bill-title">BILL</h3>
          
          <div className="bill-info">
            <div className="info-row"><span>Bill No</span> <span>: {receiptData.saleId}</span></div>
            <div className="info-row"><span>Date</span> <span>: {receiptData.date}</span></div>
            <div className="info-row"><span>Name</span> <span>: {receiptData.customerName}</span></div>
          </div>
          
          <div className="dashed-line"></div>
          
          <table className="items-table">
            <thead>
              <tr>
                <th className="qty">QTY</th>
                <th className="rate">RATE</th>
                <th className="desc">DESCRIPTION</th>
                <th className="amt">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan="4" className="dashed-cell"></td></tr>
              {receiptData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="qty">{item.qty}</td>
                  <td className="rate">{item.price}</td>
                  <td className="desc">{item.name}</td>
                  <td className="amt">{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="dashed-line mt-10"></div>
          <div className="total-row">
            <span>TOTAL AMOUNT</span>
            <span>{receiptData.totalAmount}/-</span>
          </div>
          <div className="dashed-line"></div>
          
          <h3 className="paid-status">PAID</h3>
          <div className="dashed-line"></div>
          
          <div className="receipt-footer">
            <p>For Any Query:</p>
            <p>0327-4938957</p>
            <div className="dashed-line mt-10"></div>
            <p className="terms">Check the goods before payment.</p>
            <p className="terms">No claim will be accepted after payment.</p>
            <div className="dashed-line"></div>
          </div>
        </div>
      )}
    </div>
  );
}

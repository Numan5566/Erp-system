import React, { useState, useEffect, useContext } from "react";
import { 
  ShoppingCart, Search, Trash2, User, Plus, Minus, 
  Printer, CreditCard, Banknote, Truck, Tag, X, CheckCircle,
  History, ArrowLeft, FileText, Download, Filter, Package, Phone, MapPin
} from "lucide-react";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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
  const [customerAddress, setCustomerAddress] = useState('');
  const [transportType, setTransportType] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const fetchData = async () => {
    const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
    const [prodRes, salesRes, vehiclesRes, banksRes, custsRes] = await Promise.all([
      fetch(`${PRODUCTS_API}?type=${activeTab}`, { headers }),
      fetch(`${SALES_API}?type=${activeTab}`, { headers }),
      fetch(`${TRANSPORT_API}?type=${activeTab}`, { headers }),
      fetch(`http://localhost:5000/api/banks`, { headers }),
      fetch(`http://localhost:5000/api/customers?type=${activeTab}`, { headers })
    ]);
    const prods = await prodRes.json();
    const sls = await salesRes.json();
    const vehs = await vehiclesRes.json();
    const banks = await banksRes.json();
    const custs = await custsRes.json();
    setProducts(Array.isArray(prods) ? prods : []);
    setSales(Array.isArray(sls) ? sls : []);
    setVehicles(Array.isArray(vehs) ? vehs : []);
    setBankAccounts(Array.isArray(banks) ? banks : []);
    setCustomers(Array.isArray(custs) ? custs : []);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleCustomerChange = (val) => {
    setCustomerName(val);
    const existing = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (existing) {
      setCustomerPhone(existing.phone || '');
      setCustomerAddress(existing.address || '');
      setSelectedCustomer(existing);
    } else {
      setSelectedCustomer(null);
    }
  };

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
        const currentQty = parseFloat(item.qty) || 0;
        const newQty = Math.max(1, currentQty + delta);
        return { ...item, qty: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const setQtyDirect = (id, value) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const parsed = parseFloat(value);
        const newQty = isNaN(parsed) ? '' : Math.max(0, parsed);
        const subtotalQty = newQty === '' ? 0 : newQty;
        return { ...item, qty: value, subtotal: subtotalQty * item.price };
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
      finalPaymentType = `Bank - ${selectedBank}`;
    }

    setLoading(true);
    try {
      const saleData = {
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone,
        customer_address: customerAddress,
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
        
        const prevBal = selectedCustomer ? parseFloat(selectedCustomer.balance) : 0;
        const finalBal = prevBal + balance;
        
        setReceiptData({
          saleId: result.saleId,
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          customerName: saleData.customer_name,
          items: [...cart],
          totalAmount: netTotal,
          paidAmount: saleData.paid_amount,
          previousBalance: prevBal,
          newBalance: finalBal
        });
        setShowSuccess(true);
        setCart([]);
        setDiscount(0);
        setDelivery(0);
        setPaidAmount(0);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
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
              <InputText placeholder="Search by name or vehicle number..." value={search} onChange={(e) => setSearch(e.target.value)} className="p-inputtext-sm w-full" />
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
              <span className="badge p-badge p-badge-info">{cart.length}</span>
            </div>

            <div className="sidebar-content p-fluid">
              <div className="input-box">
                <label><User size={14}/> Customer Details</label>
                <div className="flex flex-column gap-2 mb-3">
                  <div className="p-inputgroup">
                    <span className="p-inputgroup-addon"><User size={16} /></span>
                    <InputText placeholder="Customer Name" value={customerName} onChange={(e) => handleCustomerChange(e.target.value)} list="customers-list" />
                    <datalist id="customers-list">
                      {customers.map(c => <option key={c.id} value={c.name}>{c.phone}</option>)}
                    </datalist>
                  </div>
                  <div className="p-inputgroup">
                    <span className="p-inputgroup-addon"><Phone size={16} /></span>
                    <InputText placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                  <div className="p-inputgroup">
                    <span className="p-inputgroup-addon"><MapPin size={16} /></span>
                    <InputText placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                  </div>
                </div>
                {selectedCustomer && (
                  <div className="p-message p-message-info p-2 mt-1" style={{fontSize: '0.75rem'}}>
                    Previous Balance: Rs. {parseFloat(selectedCustomer.balance).toLocaleString()} {parseFloat(selectedCustomer.balance) > 0 ? '(Pending)' : '(Clear)'}
                  </div>
                )}
              </div>

              <div className="input-box mt-3">
                <label><Truck size={14}/> Transport Vehicle</label>
                <div className="flex gap-2">
                  <Dropdown value={transportType} options={[
                    {label: 'No Transport', value: ''},
                    {label: 'Personal', value: 'Personal'},
                    {label: 'Rent', value: 'Rent'}
                  ]} onChange={(e) => { setTransportType(e.value); setSelectedVehicleId(''); }} placeholder="Transport Type" className="flex-1" />
                  
                  {transportType && (
                    <Dropdown value={selectedVehicleId} options={vehicles.filter(v => v.ownership_type === transportType).map(v => ({
                      label: `${v.vehicle_number} (${v.driver_name})`,
                      value: v.id
                    }))} onChange={(e) => setSelectedVehicleId(e.value)} placeholder="Select Vehicle" className="flex-1" />
                  )}
                </div>
              </div>

              <div className="cart-list mt-4">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-top">
                      <span className="name">{item.name}</span>
                      <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-text p-button-sm" onClick={() => removeFromCart(item.id)} />
                    </div>
                    <div className="item-bottom">
                      <div className="p-inputgroup" style={{width: '100px'}}>
                        <span className="p-inputgroup-addon" style={{fontSize: '0.7rem'}}>Rs.</span>
                        <InputText type="number" value={item.price} onChange={(e) => updatePrice(item.id, e.target.value)} className="p-inputtext-sm" />
                      </div>
                      <div className="qty-ctrl">
                        <Button icon="pi pi-minus" className="p-button-rounded p-button-secondary p-button-text p-button-sm" onClick={() => updateQty(item.id, -1)} />
                        <InputText type="number" value={item.qty} onChange={(e) => setQtyDirect(item.id, e.target.value)} 
                                  className="p-inputtext-sm text-center font-bold" style={{width: '50px', border: 'none', background: 'transparent'}} />
                        <Button icon="pi pi-plus" className="p-button-rounded p-button-secondary p-button-text p-button-sm" onClick={() => updateQty(item.id, 1)} />
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
                  <div className="p-inputgroup p-inputgroup-sm" style={{width: '100px'}}>
                    <span className="p-inputgroup-addon">Rs.</span>
                    <InputText type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                  </div>
                </div>
                <div className="calc-row">
                  <span>Delivery</span>
                  <div className="p-inputgroup p-inputgroup-sm" style={{width: '100px'}}>
                    <span className="p-inputgroup-addon">Rs.</span>
                    <InputText type="number" min="0" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
                  </div>
                </div>
                <div className="grand-total">
                  <span>Total</span>
                  <span>Rs. {netTotal.toLocaleString()}</span>
                </div>
                <div className="flex flex-column gap-2 mt-2">
                  <div className="flex gap-2">
                    <InputText type="number" min="0" placeholder="Paid Amount" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="flex-1" />
                    <Dropdown value={paymentType} options={[
                      {label: 'Cash', value: 'Cash'},
                      {label: 'Bank', value: 'Bank'},
                      {label: 'Credit', value: 'Credit'}
                    ]} onChange={(e) => setPaymentType(e.value)} className="flex-1" />
                  </div>
                  {paymentType === 'Bank' && (
                    <Dropdown value={selectedBank} options={bankAccounts.map(b => {
                      const digits = b.account_number ? b.account_number.slice(-4) : '';
                      return {
                        label: `${b.bank_name} ${b.account_title ? `- ${b.account_title}` : ''} ${digits ? `(****${digits})` : ''}`,
                        value: `${b.bank_name} ${digits ? `(****${digits})` : ''}`
                      };
                    })} onChange={(e) => setSelectedBank(e.value)} placeholder="Select Receiving Bank" />
                  )}
                </div>
              </div>
              <Button label={loading ? "Processing..." : "Complete Sale"} icon="pi pi-check" onClick={handleCheckout} 
                      disabled={loading || cart.length === 0} className="w-full mt-3 p-button-lg shadow-2" />
            </div>
          </div>
        </div>
      ) : (
        <div className="history-container" style={{padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
          <DataTable value={sales} paginator rows={10} rowsPerPageOptions={[10, 25, 50]} className="p-datatable-sm" stripedRows responsiveLayout="scroll">
            <Column header="Date" body={(s) => new Date(s.created_at).toLocaleDateString()} sortable field="created_at" />
            <Column header="Bill No" body={(s) => `#SAL-${s.id}`} sortable field="id" />
            <Column header="Customer" field="customer_name" sortable />
            <Column header="Total" body={(s) => <span className="font-bold">Rs.{s.net_amount.toLocaleString()}</span>} sortable field="net_amount" />
            <Column header="Paid" body={(s) => <span className="text-green-600 font-bold">Rs.{s.paid_amount.toLocaleString()}</span>} sortable field="paid_amount" />
            <Column header="Balance" body={(s) => <span className="text-red-600 font-bold">Rs.{s.balance_amount.toLocaleString()}</span>} sortable field="balance_amount" />
            <Column header="Type" body={(s) => <span className={`status-badge ${s.payment_type.toLowerCase()}`} style={{padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700}}>{s.payment_type}</span>} sortable field="payment_type" />
          </DataTable>
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
            <span>BILL AMOUNT</span>
            <span>{receiptData.totalAmount}/-</span>
          </div>
          <div className="total-row" style={{fontSize: '12px'}}>
            <span>PAID NOW</span>
            <span>{receiptData.paidAmount}/-</span>
          </div>
          <div className="dashed-line"></div>
          
          <div className="total-row" style={{fontSize: '12px'}}>
            <span>PREVIOUS BAL</span>
            <span>{receiptData.previousBalance}/-</span>
          </div>
          <div className="total-row" style={{fontSize: '14px', fontWeight: 'bold'}}>
            <span>TOTAL BALANCE</span>
            <span>{receiptData.newBalance}/-</span>
          </div>
          <div className="dashed-line"></div>
          
          <h3 className="paid-status" style={{fontSize: '16px'}}>
            {receiptData.newBalance > 0 ? 'PENDING' : 'CLEAR'}
          </h3>
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

import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, Store, Package, Boxes, Receipt, Users as UsersIcon, 
  Truck, Wallet, Banknote, LineChart, UserSquare2, Home,
  TrendingUp, MoreHorizontal, ArrowRight, AlertTriangle
} from "lucide-react";
import { AuthContext } from '../context/AuthContext';
import "../Styles/Dashboard.scss";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    customers: 0,
    monthlyExpenses: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { "Authorization": `Bearer ${localStorage.getItem('token')}` };
        
        // Fetch products for stock stats
        const prodRes = await fetch("http://localhost:5000/api/products", { headers });
        const products = await prodRes.json();
        
        // Fetch expenses
        const expRes = await fetch("http://localhost:5000/api/expenses", { headers });
        const expenses = await expRes.json();
        
        // Fetch customers
        const custRes = await fetch("http://localhost:5000/api/customers", { headers });
        const customers = await custRes.json();

        if (Array.isArray(products) && Array.isArray(expenses) && Array.isArray(customers)) {
          setStats({
            products: products.length,
            lowStock: products.filter(p => parseFloat(p.stock_quantity || 0) <= parseFloat(p.minimum_stock || 0)).length,
            customers: customers.length,
            monthlyExpenses: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
          });
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed", err);
      }
    };
    fetchStats();
  }, []);

  const modules = [
    { id: "products", name: "Products", path: "/products", icon: <Package size={28} />, desc: "Manage Items", color: "#3b82f6" },
    { id: "stock", name: "Stock", path: "/stock", icon: <Boxes size={28} />, desc: "Inventory", color: "#10b981" },
    { id: "billing", name: "Billing", path: "/billing", icon: <Receipt size={28} />, desc: "Invoices", color: "#8b5cf6" },
    { id: "customers", name: "Customers", path: "/customers", icon: <UsersIcon size={28} />, desc: "CRM", color: "#f59e0b" },
    { id: "suppliers", name: "Suppliers", path: "/suppliers", icon: <UserSquare2 size={28} />, desc: "Vendors", color: "#ec4899" },
    { id: "transport", name: "Transport", path: "/transport", icon: <Truck size={28} />, desc: "Fleet", color: "#06b6d4" },
    { id: "expenses", name: "Expenses", path: "/expenses", icon: <Wallet size={28} />, desc: "Daily Costs", color: "#ef4444" },
    { id: "salary", name: "Salary", path: "/salary", icon: <Banknote size={28} />, desc: "Payroll", color: "#6366f1" },
    { id: "profit", name: "Profit", path: "/profit", icon: <LineChart size={28} />, desc: "Analytics", color: "#f97316" },
    { id: "rent", name: "Rent", path: "/rent", icon: <Home size={28} />, desc: "Property", color: "#7c3aed" },
    { id: "investment", name: "Investment", path: "/investment", icon: <TrendingUp size={28} />, desc: "Track ROI", color: "#0891b2" },
    { id: "other-expenses", name: "Other Expenses", path: "/other-expenses", icon: <MoreHorizontal size={28} />, desc: "Misc.", color: "#475569" }
  ];

  const hasPermission = (moduleId) => {
    if (user?.role === 'admin') return true;
    return user?.permissions?.includes(moduleId);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, <span className="user-name">{user?.username || 'User'}</span></h1>
          <p className="subtitle">Here's what's happening with your business today.</p>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.products}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Low Stock Alerts</span>
            <span className="stat-value">{stats.lowStock}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><UsersIcon size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Customers</span>
            <span className="stat-value">{stats.customers}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Wallet size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">Rs. {stats.monthlyExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="primary-modules">
        {hasPermission('wholesale') && (
          <Link to="/wholesale" className="primary-card wholesale-card">
            <div className="card-content">
              <Building2 size={40} className="card-icon" />
              <div className="text-content">
                <h3>Wholesale Business</h3>
                <p>Bulk orders, stock management & vendor relations</p>
              </div>
              <ArrowRight className="arrow" />
            </div>
          </Link>
        )}

        {hasPermission('retail') && (
          <Link to="/retail" className="primary-card retail-card">
            <div className="card-content">
              <Store size={40} className="card-icon" />
              <div className="text-content">
                <h3>Retail Sales</h3>
                <p>Quick POS billing & walk-in customer management</p>
              </div>
              <ArrowRight className="arrow" />
            </div>
          </Link>
        )}
      </div>

      {/* Module Navigation Grid */}
      <div className="module-navigation">
        <h3 className="section-title">Business Modules</h3>
        <div className="secondary-modules">
          {modules.filter(mod => hasPermission(mod.id)).map((mod, idx) => (
            <Link to={mod.path} key={idx} className="secondary-card">
              <div className="icon-wrapper" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                {mod.icon}
              </div>
              <div className="mod-info">
                <h4>{mod.name}</h4>
                <p>{mod.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
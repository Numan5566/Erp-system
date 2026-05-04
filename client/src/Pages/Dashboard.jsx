import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Store, 
  Package, 
  Boxes, 
  Receipt, 
  Users as UsersIcon, 
  Truck, 
  Wallet, 
  Banknote, 
  LineChart, 
  UserSquare2,
  Home,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";
import { AuthContext } from '../context/AuthContext';
import "../Styles/Dashboard.scss";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const modules = [
    { id: "products", name: "Products", path: "/products", icon: <Package size={32} />, desc: "Manage Inventory" },
    { id: "stock", name: "Stock", path: "/stock", icon: <Boxes size={32} />, desc: "Stock Control" },
    { id: "billing", name: "Billing", path: "/billing", icon: <Receipt size={32} />, desc: "POS & Invoices" },
    { id: "customers", name: "Customers", path: "/customers", icon: <UsersIcon size={32} />, desc: "Customer CRM" },
    { id: "suppliers", name: "Suppliers", path: "/suppliers", icon: <UserSquare2 size={32} />, desc: "Vendor Details" },
    { id: "transport", name: "Transport", path: "/transport", icon: <Truck size={32} />, desc: "Fleet & Routes" },
    { id: "expenses", name: "Expenses", path: "/expenses", icon: <Wallet size={32} />, desc: "Daily Costs" },
    { id: "salary", name: "Salary", path: "/salary", icon: <Banknote size={32} />, desc: "Payroll" },
    { id: "profit", name: "Profit", path: "/profit", icon: <LineChart size={32} />, desc: "Analytics" },
    { id: "rent", name: "Rent", path: "/rent", icon: <Home size={32} />, desc: "Property Rent" },
    { id: "investment", name: "Investment", path: "/investment", icon: <TrendingUp size={32} />, desc: "Track Returns" },
    { id: "other-expenses", name: "Other Expenses", path: "/other-expenses", icon: <MoreHorizontal size={32} />, desc: "Misc. Expenses" }
  ];

  const hasPermission = (moduleId) => {
    if (user?.role === 'admin') return true;
    return user?.permissions?.includes(moduleId);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>ERP Dashboard</h2>
        <p className="subtitle">Select a module to manage your operations</p>
      </header>

      {/* Primary Modules (Top) */}
      <div className="primary-modules">
        {hasPermission('wholesale') && (
          <Link to="/wholesale" className="primary-card wholesale-card">
            <div className="card-content">
              <Building2 size={48} className="card-icon" />
              <div className="text-content">
                <h3>Wholesale</h3>
                <p>Manage bulk stock, suppliers, and B2B orders</p>
              </div>
            </div>
          </Link>
        )}

        {hasPermission('retail') && (
          <Link to="/retail" className="primary-card retail-card">
            <div className="card-content">
              <Store size={48} className="card-icon" />
              <div className="text-content">
                <h3>Retail Sale</h3>
                <p>Manage daily billing, POS, and walk-in customers</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Secondary Modules (Bottom Grid) */}
      <div className="secondary-modules">
        {modules.filter(mod => hasPermission(mod.id)).map((mod, idx) => (
          <Link to={mod.path} key={idx} className="secondary-card">
            <div className="icon-wrapper">
              {mod.icon}
            </div>
            <h4>{mod.name}</h4>
            <p>{mod.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
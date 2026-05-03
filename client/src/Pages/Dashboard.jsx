import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Store,
  Package,
  Boxes,
  Receipt,
  Users,
  Truck,
  Wallet,
  Banknote,
  LineChart,
  UserSquare2
} from "lucide-react";
import "../Styles/Dashboard.scss";

export default function Dashboard() {
  const modules = [
    { name: "Products", path: "/products", icon: <Package size={32} />, desc: "Manage Inventory" },
    { name: "Stock", path: "/stock", icon: <Boxes size={32} />, desc: "Stock Control" },
    { name: "Billing", path: "/billing", icon: <Receipt size={32} />, desc: "POS & Invoices" },
    { name: "Customers", path: "/customers", icon: <Users size={32} />, desc: "Customer CRM" },
    { name: "Suppliers", path: "/suppliers", icon: <UserSquare2 size={32} />, desc: "Vendor Details" },
    { name: "Transport", path: "/transport", icon: <Truck size={32} />, desc: "Fleet & Routes" },
    { name: "Expenses", path: "/expenses", icon: <Wallet size={32} />, desc: "Daily Costs" },
    { name: "Salary", path: "/salary", icon: <Banknote size={32} />, desc: "Payroll" },
    { name: "Profit", path: "/profit", icon: <LineChart size={32} />, desc: "Analytics" }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>ERP Dashboard</h2>
        <p className="subtitle">Select a module to manage your operations</p>
      </header>

      {/* Primary Modules (Top) */}
      <div className="primary-modules">
        <Link to="/wholesale" className="primary-card wholesale-card">
          <div className="card-content">
            <Building2 size={48} className="card-icon" />
            <div className="text-content">
              <h3>Wholesale</h3>
              <p>Manage bulk stock, suppliers, and B2B orders</p>
            </div>
          </div>
        </Link>

        <Link to="/retail" className="primary-card retail-card">
          <div className="card-content">
            <Store size={48} className="card-icon" />
            <div className="text-content">
              <h3>Retail Sale</h3>
              <p>Manage daily billing, POS, and walk-in customers</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Modules (Bottom Grid) */}
      <div className="secondary-modules">
        {modules.map((mod, idx) => (
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
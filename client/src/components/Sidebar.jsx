import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Receipt,
  Users,
  UserSquare2,
  Truck,
  Wallet,
  Banknote,
  LineChart,
  LogOut
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import "../Styles/Sidebar.scss";

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Stock', path: '/stock', icon: <Boxes size={20} /> },
    { name: 'Billing', path: '/billing', icon: <Receipt size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Suppliers', path: '/suppliers', icon: <UserSquare2 size={20} /> },
    { name: 'Transport', path: '/transport', icon: <Truck size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <Wallet size={20} /> },
    { name: 'Salary', path: '/salary', icon: <Banknote size={20} /> },
    { name: 'Profit', path: '/profit', icon: <LineChart size={20} /> }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ERP System</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

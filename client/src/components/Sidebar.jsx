import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2,
  Store,
  Package, 
  Boxes, 
  Receipt, 
  Users as UsersIcon, 
  UserSquare2, 
  Truck, 
  Wallet, 
  Banknote, 
  LineChart,
  ShieldAlert,
  LogOut,
  Home,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../Styles/Sidebar.scss';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'wholesale', name: 'Wholesale', path: '/wholesale', icon: <Building2 size={20} /> },
    { id: 'retail', name: 'Retail Sale', path: '/retail', icon: <Store size={20} /> },
    { id: 'products', name: 'Products', path: '/products', icon: <Package size={20} /> },
    { id: 'stock', name: 'Stock', path: '/stock', icon: <Boxes size={20} /> },
    { id: 'billing', name: 'Billing', path: '/billing', icon: <Receipt size={20} /> },
    { id: 'customers', name: 'Customers', path: '/customers', icon: <UsersIcon size={20} /> },
    { id: 'suppliers', name: 'Suppliers', path: '/suppliers', icon: <UserSquare2 size={20} /> },
    { id: 'transport', name: 'Transport', path: '/transport', icon: <Truck size={20} /> },
    { id: 'expenses', name: 'Expenses', path: '/expenses', icon: <Wallet size={20} /> },
    { id: 'salary', name: 'Salary', path: '/salary', icon: <Banknote size={20} /> },
    { id: 'profit', name: 'Profit', path: '/profit', icon: <LineChart size={20} /> },
    { id: 'rent', name: 'Rent', path: '/rent', icon: <Home size={20} /> },
    { id: 'investment', name: 'Investment', path: '/investment', icon: <TrendingUp size={20} /> },
    { id: 'other-expenses', name: 'Other Expenses', path: '/other-expenses', icon: <MoreHorizontal size={20} /> },
    { id: 'users', name: 'Users & Permissions', path: '/users', icon: <ShieldAlert size={20} /> }
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    // Dashboard is always visible
    if (item.id === 'dashboard') return true;
    
    // Users module is ONLY for admin, even if permissions list has it, we strictly enforce it
    if (item.id === 'users' && user?.role !== 'admin') return false;

    // Admin sees everything
    if (user?.role === 'admin') return true;

    // Normal users see what is in their permissions array
    return user?.permissions?.includes(item.id);
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ERP System</h2>
        {user && <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '5px' }}>Logged in as: {user.name}</p>}
      </div>
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item, idx) => (
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

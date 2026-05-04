import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../Styles/UsersManager.scss';
import { UserPlus, Save, Trash2, Edit } from 'lucide-react';
import ActionMenu from '../components/ActionMenu';

const availableModules = [
  { id: 'wholesale', label: 'Wholesale' },
  { id: 'retail', label: 'Retail Sale' },
  { id: 'users', label: 'Users & Permissions' },
  { id: 'products', label: 'Products' },
  { id: 'stock', label: 'Stock' },
  { id: 'billing', label: 'Billing' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'transport', label: 'Transport' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'salary', label: 'Salary' },
  { id: 'profit', label: 'Profit' }
];

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', module_type: '', permissions: [] });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handlePermissionToggle = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleId)
        ? prev.permissions.filter(p => p !== moduleId)
        : [...prev.permissions, moduleId]
    }));
  };

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '', // Populate plain text password
      role: user.role,
      module_type: user.module_type || '',
      permissions: user.permissions || []
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', role: 'user', module_type: '', permissions: [] });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="users-manager">
      <div className="header">
        <h2>Users & Permissions</h2>
        <button className="btn-primary" onClick={() => {
          setShowForm(!showForm);
          if (editingId) {
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: 'user', module_type: '', permissions: [] });
          }
        }}>
          <UserPlus size={20} /> {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit User' : 'Create New User'}</h3>
          <div className="form-row">
            <input type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <input type="text" placeholder={editingId ? "Edit Password" : "Password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>
          
          <div className="form-row">
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            
            <select value={formData.module_type} onChange={e => setFormData({...formData, module_type: e.target.value})} disabled={formData.role === 'admin'}>
              <option value="">Select Counter (for Users)</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Retail 1">Retail 1</option>
              <option value="Retail 2">Retail 2</option>
            </select>
          </div>

          <h4>Assign Module Permissions</h4>
          <div className="permissions-grid">
            {availableModules.map(mod => (
              <label key={mod.id} className="permission-item">
                <input 
                  type="checkbox" 
                  checked={formData.permissions.includes(mod.id)}
                  onChange={() => handlePermissionToggle(mod.id)}
                />
                {mod.label}
              </label>
            ))}
          </div>

          <button type="submit" className="btn-success">
            <Save size={18} /> {editingId ? 'Update User' : 'Save User'}
          </button>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Counter</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td><span className="badge" style={{background: '#e0e7ff', color: '#3730a3'}}>{u.module_type || 'N/A'}</span></td>
                <td className="perms-cell">
                  {u.permissions?.length ? u.permissions.join(', ') : 'None'}
                </td>
                <td>
                  {u.role !== 'admin' && (
                    <ActionMenu 
                      onEdit={() => handleEditClick(u)} 
                      onDelete={() => handleDelete(u.id)} 
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

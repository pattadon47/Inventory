import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Plus, X, Trash2, Pencil, Users, Search } from 'lucide-react';

const mockUsers = [
  { _id: '1', username: 'admin', fullName: 'System Administrator', email: 'admin@itopplus.com', role: 'admin', createdAt: '2024-01-15' },
  { _id: '2', username: 'john.doe', fullName: 'John Doe', email: 'john@itopplus.com', role: 'user', createdAt: '2024-03-20' },
  { _id: '3', username: 'jane.smith', fullName: 'Jane Smith', email: 'jane@itopplus.com', role: 'user', createdAt: '2024-05-10' },
  { _id: '4', username: 'mike.wilson', fullName: 'Mike Wilson', email: 'mike@itopplus.com', role: 'admin', createdAt: '2024-06-01' },
  { _id: '5', username: 'sarah.connor', fullName: 'Sarah Connor', email: 'sarah@itopplus.com', role: 'user', createdAt: '2024-07-22' },
];

const emptyUser = {
  username: '', fullName: '', email: '', password: '', role: 'user',
};

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...emptyUser });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      if (res.data && Array.isArray(res.data)) setUsers(res.data);
      else if (res.data?.users) setUsers(res.data.users);
    } catch {
      // Use mock data
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ ...emptyUser });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ ...user, password: '' });
    setShowModal(true);
  };

  const handleOpenDelete = (user) => {
    setEditingUser(user);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        const res = await usersAPI.update(editingUser._id, updateData);
        const updatedUser = res.data?.data || res.data;
        setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, ...updatedUser } : u));
        showToast('User updated successfully');
      } else {
        const res = await usersAPI.create(formData);
        const newUser = res.data?.data || res.data;
        setUsers(prev => [...prev, newUser]);
        showToast('User created successfully');
      }
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(editingUser._id);
      setUsers(prev => prev.filter(u => u._id !== editingUser._id));
      showToast('User deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>User Management</h1>
            <p>Manage system users and roles</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <div className="search-box-icon"><Search size={18} /></div>
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={36} /></div>
          <h3>No users found</h3>
          <p>Adjust your search or add a new user.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => (
                <tr key={user._id}>
                  <td style={{ color: 'var(--gray-400)' }}>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-green' : 'badge-blue'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.createdAt}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-icon-sm btn-outline" onClick={() => handleOpenEdit(user)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-icon-sm btn-danger" onClick={() => handleOpenDelete(user)} title="Delete" style={{ width: 32, height: 32, padding: 0, borderRadius: 6 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              overflow: 'hidden',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '100%',
              maxWidth: '520px',
              margin: '20px',
              animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid var(--gray-200)',
                background: '#ffffff',
                flexShrink: 0
              }}
            >
              <h3 
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', width: 32, height: 32, borderRadius: '6px' }}><X size={18} /></button>
            </div>
            <div 
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Username</label>
                <input className="form-input" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Username" disabled={!!editingUser} style={editingUser ? { background: 'var(--gray-50)' } : {}} />
              </div>
              {!editingUser && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <input className="form-input" type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Password" />
                </div>
              )}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Full Name</label>
                <input className="form-input" value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Email</label>
                <input className="form-input" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Role</label>
                <select className="form-select" value={formData.role || 'user'} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editingUser && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>New Password (leave blank to keep current)</label>
                  <input className="form-input" type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="New password" />
                </div>
              )}
            </div>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid var(--gray-200)',
                background: '#f8fafc',
                flexShrink: 0,
                borderRadius: '0 0 16px 16px'
              }}
            >
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #0d9488 0%, #1e3a8a 100%)', border: 'none', color: '#ffffff', fontWeight: 700 }}>
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="confirm-modal">
              <div className="confirm-icon danger"><Trash2 size={28} /></div>
              <h3 className="confirm-title">Delete User</h3>
              <p className="confirm-text">Are you sure you want to delete <strong>{editingUser?.username}</strong>?</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast toast-success">✓ {toast}</div>}
    </div>
  );
}

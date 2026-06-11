import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { inventoryAPI } from '../services/api';
import {
  Plus, Search, Pencil, Trash2, X, RefreshCw, Package, ChevronLeft, ChevronRight,
} from 'lucide-react';

const ITEM_TYPES = ['Hardware', 'Software', 'Accessory', 'Network', 'Cable', 'Other'];
const ITEM_CATEGORIES = [
  'Monitor', 'Mouse', 'Keyboard', 'Phone Headset', 'Computer Headset',
  'Computer', 'CPU Components', 'LAN Cable', 'Phone Cable', 'HDMI Cable',
  'LG Cable', 'AOC Cable', 'VGA Cable', 'Power AC Cable', 'ATA Cable',
  'Phone Box', 'Type-C to LAN Adapter',
];
const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];
const CONDITION_OPTIONS = ['Normal', 'In Use', 'Under Repair', 'Broken'];

const emptyItem = {
  itemId: '', name: '', type: '', category: '', brand: '', model: '',
  quantity: '', unitPrice: '', supplier: '', location: '',
  purchaseDate: '', warrantyExpiry: '', status: 'In Stock', condition: 'Normal', notes: '',
};

// Mock data
const mockProducts = [
  { _id: '1', itemId: 'IT-2024-0001', name: 'Dell UltraSharp 27" Monitor', type: 'Hardware', category: 'Monitor', brand: 'Dell', model: 'U2723QE', quantity: 15, unitPrice: 619.99, status: 'In Stock', condition: 'In Use', supplier: 'Dell Direct', location: 'Warehouse A' },
  { _id: '2', itemId: 'IT-2024-0002', name: 'Logitech MX Master 3S', type: 'Accessory', category: 'Mouse', brand: 'Logitech', model: 'MX Master 3S', quantity: 30, unitPrice: 99.99, status: 'In Stock', condition: 'Normal', supplier: 'Amazon', location: 'Office Supply Room' },
  { _id: '3', itemId: 'IT-2024-0003', name: 'Mechanical Keyboard', type: 'Accessory', category: 'Keyboard', brand: 'Keychron', model: 'K8 Pro', quantity: 3, unitPrice: 109.99, status: 'Low Stock', condition: 'Normal', supplier: 'Keychron Store', location: 'Warehouse A' },
  { _id: '4', itemId: 'IT-2024-0004', name: 'Cat6 LAN Cable 3m', type: 'Cable', category: 'LAN Cable', brand: 'Ugreen', model: 'NW102', quantity: 0, unitPrice: 8.99, status: 'Out of Stock', condition: 'Broken', supplier: 'Ugreen', location: 'Cable Storage' },
  { _id: '5', itemId: 'IT-2024-0005', name: 'HP EliteDesk 800 G6', type: 'Hardware', category: 'Computer', brand: 'HP', model: '800 G6 SFF', quantity: 8, unitPrice: 1249.99, status: 'In Stock', condition: 'In Use', supplier: 'HP Direct', location: 'IT Room' },
  { _id: '6', itemId: 'IT-2024-0006', name: 'Jabra Evolve2 75', type: 'Accessory', category: 'Computer Headset', brand: 'Jabra', model: 'Evolve2 75', quantity: 5, unitPrice: 299.99, status: 'Low Stock', condition: 'Under Repair', supplier: 'Jabra', location: 'Office Supply Room' },
  { _id: '7', itemId: 'IT-2024-0007', name: 'HDMI Cable 2m Premium', type: 'Cable', category: 'HDMI Cable', brand: 'Belkin', model: 'AV10175bt2M', quantity: 45, unitPrice: 14.99, status: 'In Stock', condition: 'Normal', supplier: 'Amazon', location: 'Cable Storage' },
  { _id: '8', itemId: 'IT-2024-0008', name: 'Windows 11 Pro License', type: 'Software', category: 'Computer', brand: 'Microsoft', model: 'Win 11 Pro', quantity: 50, unitPrice: 199.99, status: 'In Stock', condition: 'Normal', supplier: 'Microsoft', location: 'Digital' },
];

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState(mockProducts);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ ...emptyItem });
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  
  // Dynamic Items per page from Settings
  const itemsPerPage = parseInt(localStorage.getItem('itemsPerPage') || '10');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await inventoryAPI.getAll();
      if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (res.data?.products) {
        setProducts(res.data.products);
      }
    } catch {
      // Use mock data
    }
  };

  const generateItemId = () => {
    const year = new Date().getFullYear();
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `IT-${year}-${rand}`;
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ ...emptyItem, itemId: generateItemId() });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const handleOpenDelete = (product) => {
    setEditingProduct(product);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await inventoryAPI.update(editingProduct._id || editingProduct.id, formData);
        setProducts(prev => prev.map(p => (p._id === editingProduct._id || p.id === editingProduct.id) ? { ...p, ...formData } : p));
        showToast('Product updated successfully');
      } else {
        const res = await inventoryAPI.create(formData);
        const savedProduct = res.data || res;
        setProducts(prev => [...prev, { ...formData, ...savedProduct }]);
        showToast('Product added successfully');
      }
    } catch {
      // Local update for demo
      if (editingProduct) {
        setProducts(prev => prev.map(p => (p._id === editingProduct._id || p.id === editingProduct.id) ? { ...p, ...formData } : p));
        showToast('Product updated successfully');
      } else {
        setProducts(prev => [...prev, { _id: Date.now().toString(), ...formData }]);
        showToast('Product added successfully');
      }
    }
    setShowModal(false);
  };

  const handleDelete = async () => {
    try {
      await inventoryAPI.delete(editingProduct._id || editingProduct.id);
    } catch {
      // Local delete for demo
    }
    setProducts(prev => prev.filter(p => (p._id !== editingProduct._id && p.id !== editingProduct.id)));
    setShowDeleteModal(false);
    showToast('Product deleted successfully');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status) => {
    const map = {
      'In Stock': 'badge-green',
      'Low Stock': 'badge-orange',
      'Out of Stock': 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  const getConditionBadge = (cond) => {
    const map = {
      'Normal': 'badge-green',
      'In Use': 'badge-blue',
      'Under Repair': 'badge-orange',
      'Broken': 'badge-red',
    };
    return map[cond] || 'badge-gray';
  };

  const getConditionLabel = (cond) => {
    const map = {
      'Normal': t('condNormal'),
      'In Use': t('condInUse'),
      'Under Repair': t('condRepair'),
      'Broken': t('condBroken'),
    };
    return map[cond] || cond;
  };

  // Filter products
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.itemId?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type === filterType;
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchType && matchCategory && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>{t('inventory')}</h1>
            <p>Manage your IT inventory and conditions</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={18} />
              {t('addItem')}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <div className="search-box-icon"><Search size={18} /></div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select className="filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
          <option value="">{t('allTypes')}</option>
          {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
          <option value="">{t('allCategories')}</option>
          {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
          <option value="">{t('allStatus')}</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={36} /></div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria, or add a new inventory item.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('itemId')}</th>
                <th>{t('itemName')}</th>
                <th>{t('itemType')}</th>
                <th>{t('itemCategory')}</th>
                <th>{t('brand')}</th>
                <th>{t('quantity')}</th>
                <th>{t('unitPrice')}</th>
                <th>{t('status')}</th>
                <th>{t('condition')}</th>
                {isAdmin && <th>{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p._id || p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{p.itemId}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.type}</td>
                  <td>{p.category}</td>
                  <td>{p.brand}</td>
                  <td style={{ fontWeight: 600 }}>{p.quantity}</td>
                  <td>${Number(p.unitPrice || 0).toFixed(2)}</td>
                  <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                  <td><span className={`badge ${getConditionBadge(p.condition)}`}>{getConditionLabel(p.condition)}</span></td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-8" style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-icon-sm btn-outline" onClick={() => handleOpenEdit(p)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-icon-sm btn-danger" onClick={() => handleOpenDelete(p)} title="Delete" style={{ width: 32, height: 32, padding: 0, borderRadius: 6 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                <ChevronRight size={16} />
              </button>
              <span className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? t('editItem') : t('addItem')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('itemId')}</label>
                  <div className="form-inline">
                    <input className="form-input" value={formData.itemId} onChange={(e) => handleChange('itemId', e.target.value)} placeholder="IT-2024-XXXX" />
                    <button className="btn btn-outline btn-sm" onClick={() => handleChange('itemId', generateItemId())} type="button">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('itemName')}</label>
                  <input className="form-input" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Product name" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('itemType')}</label>
                  <select className="form-select" value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
                    <option value="">Select type...</option>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('itemCategory')}</label>
                  <select className="form-select" value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                    <option value="">Select category...</option>
                    {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('brand')}</label>
                  <input className="form-input" value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Brand name" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('model')}</label>
                  <input className="form-input" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="Model number" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('quantity')}</label>
                  <input className="form-input" type="number" min="0" value={formData.quantity} onChange={(e) => handleChange('quantity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('unitPrice')}</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={formData.unitPrice} onChange={(e) => handleChange('unitPrice', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('supplier')}</label>
                  <input className="form-input" value={formData.supplier} onChange={(e) => handleChange('supplier', e.target.value)} placeholder="Supplier name" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('location')}</label>
                  <input className="form-input" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Storage location" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('purchaseDate')}</label>
                  <input className="form-input" type="date" value={formData.purchaseDate} onChange={(e) => handleChange('purchaseDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('warrantyExpiry')}</label>
                  <input className="form-input" type="date" value={formData.warrantyExpiry} onChange={(e) => handleChange('warrantyExpiry', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('status')}</label>
                  <select className="form-select" value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('condition')}</label>
                  <select className="form-select" value={formData.condition || 'Normal'} onChange={(e) => handleChange('condition', e.target.value)}>
                    {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{getConditionLabel(c)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('notes')}</label>
                <textarea className="form-textarea" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Additional notes..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingProduct ? t('save') : t('addItem')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="confirm-modal">
              <div className="confirm-icon danger">
                <Trash2 size={28} />
              </div>
              <h3 className="confirm-title">{t('deleteItem')}</h3>
              <p className="confirm-text">
                {t('deleteConfirm')} <strong>{editingProduct?.name}</strong>
              </p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</button>
                <button className="btn btn-danger" onClick={handleDelete}>{t('deleteItem')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast toast-success" style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: 'var(--primary-600)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        fontWeight: '600'
      }}>✓ {toast}</div>}
    </div>
  );
}

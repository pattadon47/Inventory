import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { purchaseAPI, inventoryAPI } from '../services/api';
import {
  Plus, X, Trash2, ShoppingCart, ChevronLeft, ChevronRight,
} from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'Approved', 'Received', 'Cancelled'];

const mockOrders = [
  { _id: '1', orderId: 'PO-2024-0001', supplier: 'Dell Direct', totalAmount: 9299.85, orderDate: '2024-12-01', status: 'Received', notes: 'Bulk monitor order', items: [{ product: 'Dell Monitor 27"', quantity: 15, price: 619.99 }] },
  { _id: '2', orderId: 'PO-2024-0002', supplier: 'Amazon Business', totalAmount: 2999.70, orderDate: '2024-12-05', status: 'Approved', notes: 'Peripherals restock', items: [{ product: 'Logitech MX Master 3S', quantity: 30, price: 99.99 }] },
  { _id: '3', orderId: 'PO-2024-0003', supplier: 'HP Direct', totalAmount: 12499.90, orderDate: '2024-12-10', status: 'Pending', notes: 'Desktop computers', items: [{ product: 'HP EliteDesk 800 G6', quantity: 10, price: 1249.99 }] },
  { _id: '4', orderId: 'PO-2024-0004', supplier: 'Jabra Store', totalAmount: 1499.95, orderDate: '2024-12-12', status: 'Approved', notes: 'Headsets for new team', items: [{ product: 'Jabra Evolve2 75', quantity: 5, price: 299.99 }] },
  { _id: '5', orderId: 'PO-2024-0005', supplier: 'Cable Wholesale', totalAmount: 674.55, orderDate: '2024-11-28', status: 'Cancelled', notes: 'Cancelled - wrong specs', items: [{ product: 'HDMI Cable 2m', quantity: 45, price: 14.99 }] },
  { _id: '6', orderId: 'PO-2024-0006', supplier: 'Microsoft Store', totalAmount: 9999.50, orderDate: '2024-12-15', status: 'Pending', notes: 'Software licenses', items: [{ product: 'Windows 11 Pro License', quantity: 50, price: 199.99 }] },
];

const emptyOrder = {
  orderId: '',
  supplier: '',
  orderDate: new Date().toISOString().split('T')[0],
  status: 'Pending',
  notes: '',
  items: [{ productId: '', product: '', quantity: 1, price: 0 }],
};

export default function PurchasesPage() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState(mockOrders);
  const [productList, setProductList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({ ...emptyOrder });
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchOrders();
    fetchProductList();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await purchaseAPI.getAll();
      if (res.data && Array.isArray(res.data)) setOrders(res.data);
      else if (res.data?.orders) setOrders(res.data.orders);
    } catch {
      // Use mock data
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await inventoryAPI.getAll({ limit: 1000 });
      const data = res.data?.products || res.data || [];
      setProductList(data);
    } catch (err) {
      console.error('Error fetching product list:', err);
    }
  };

  const generateOrderId = () => {
    const year = new Date().getFullYear();
    const rand = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');
    return `PO-${year}-${rand}`;
  };

  const handleOpenCreate = () => {
    setEditingOrder(null);
    setFormData({ ...emptyOrder, orderId: generateOrderId() });
    setShowModal(true);
  };

  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      ...order,
      items: order.items?.length ? order.items : [{ productId: '', product: '', quantity: 1, price: 0 }],
    });
    setShowModal(true);
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleOpenDelete = (order) => {
    setEditingOrder(order);
    setShowDeleteModal(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', product: '', quantity: 1, price: 0 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calcTotal = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  };

  const handleSave = async () => {
    const total = calcTotal(formData.items);
    const orderData = { ...formData, totalAmount: total };

    try {
      if (editingOrder) {
        const res = await purchaseAPI.update(editingOrder._id, orderData);
        if (res.data) {
          setOrders(prev => prev.map(o => o._id === editingOrder._id ? res.data : o));
        } else {
          setOrders(prev => prev.map(o => o._id === editingOrder._id ? { ...o, ...orderData } : o));
        }
        showToast('Order updated successfully');
      } else {
        const res = await purchaseAPI.create(orderData);
        if (res.data) {
          setOrders(prev => [...prev, res.data]);
        } else {
          setOrders(prev => [...prev, { _id: Date.now().toString(), ...orderData }]);
        }
        showToast('Order created successfully');
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      // Fallback
      if (editingOrder) {
        setOrders(prev => prev.map(o => o._id === editingOrder._id ? { ...o, ...orderData } : o));
        showToast('Order updated (local)');
      } else {
        setOrders(prev => [...prev, { _id: Date.now().toString(), ...orderData }]);
        showToast('Order created (local)');
      }
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    try {
      await purchaseAPI.delete(editingOrder._id);
    } catch {
      // Local
    }
    setOrders(prev => prev.filter(o => o._id !== editingOrder._id));
    setShowDeleteModal(false);
    showToast('Order deleted successfully');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusBadge = (status) => {
    const map = {
      'Pending': 'badge-blue',
      'Approved': 'badge-green',
      'Received': 'badge-teal',
      'Cancelled': 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginated = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Purchase Orders</h1>
            <p>Manage purchase orders and suppliers</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              Create Order
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart size={36} /></div>
          <h3>No purchase orders yet</h3>
          <p>Create your first purchase order to get started.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Supplier</th>
                <th>Total Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(order => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-600)', cursor: 'pointer' }} onClick={() => handleViewDetail(order)}>
                    {order.orderId}
                  </td>
                  <td style={{ fontWeight: 500 }}>{order.supplier}</td>
                  <td style={{ fontWeight: 700 }}>${Number(order.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{order.orderDate}</td>
                  <td><span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-sm btn-outline" onClick={() => handleViewDetail(order)}>View</button>
                      {isAdmin && (
                        <>
                          <button className="btn btn-sm btn-outline" onClick={() => handleOpenEdit(order)}>Edit</button>
                          <button className="btn btn-icon-sm btn-danger" onClick={() => handleOpenDelete(order)} style={{ width: 32, height: 32, padding: 0, borderRadius: 6 }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Order Details — {selectedOrder.orderId}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row mb-16">
                <div>
                  <div className="text-sm text-gray">Supplier</div>
                  <div className="fw-600">{selectedOrder.supplier}</div>
                </div>
                <div>
                  <div className="text-sm text-gray">Date</div>
                  <div className="fw-600">{selectedOrder.orderDate}</div>
                </div>
              </div>
              <div className="form-row mb-16">
                <div>
                  <div className="text-sm text-gray">Status</div>
                  <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{selectedOrder.status}</span>
                </div>
                <div>
                  <div className="text-sm text-gray">Total</div>
                  <div className="fw-700 text-green" style={{ fontSize: 20 }}>
                    ${Number(selectedOrder.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="mb-16">
                  <div className="text-sm text-gray">Notes</div>
                  <div>{selectedOrder.notes}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray mb-8">Items</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td>{item.product}</td>
                        <td>{item.quantity}</td>
                        <td>${Number(item.price || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Order Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingOrder ? 'Edit Order' : 'Create Purchase Order'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Order ID</label>
                  <input className="form-input" value={formData.orderId} readOnly style={{ background: 'var(--gray-50)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input className="form-input" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="Supplier name" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input className="form-input" type="date" value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Order Items</label>
                <div className="order-items-list">
                  {formData.items.map((item, index) => (
                    <div className="order-item-row" key={index}>
                      <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                        {productList.length > 0 ? (
                          <select
                            className="form-select"
                            value={item.productId || ''}
                            onChange={(e) => {
                              const pId = e.target.value;
                              const prod = productList.find(p => String(p._id || p.id) === String(pId));
                              handleItemChange(index, 'productId', pId);
                              handleItemChange(index, 'product', prod ? prod.name || prod.item_name : '');
                              handleItemChange(index, 'price', prod ? prod.unitPrice || prod.unit_price : 0);
                            }}
                          >
                            <option value="">Select Product...</option>
                            {productList.map(p => (
                              <option key={p._id || p.id} value={p._id || p.id}>
                                {p.name || p.item_name} ({p.itemId || p.item_id})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="form-input"
                            placeholder="Product name"
                            value={item.product}
                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          />
                        )}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <input className="form-input" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <input className="form-input" type="number" min="0" step="0.01" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                      </div>
                      <button className="btn btn-icon-sm btn-danger" onClick={() => handleRemoveItem(index)} disabled={formData.items.length === 1} style={{ width: 32, height: 32, padding: 0, borderRadius: 6, alignSelf: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-sm btn-outline" onClick={handleAddItem} type="button">
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="order-total-row">
                <span className="order-total-label">Total Amount</span>
                <span className="order-total-value">${calcTotal(formData.items).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="form-group mt-16">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingOrder ? 'Update Order' : 'Create Order'}
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
              <h3 className="confirm-title">Delete Order</h3>
              <p className="confirm-text">Are you sure you want to delete order <strong>{editingOrder?.orderId}</strong>?</p>
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

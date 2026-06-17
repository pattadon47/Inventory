import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { inventoryAPI, loansAPI } from '../services/api';
import {
  Search, Package, Calendar, Clock, Check, X, 
  RotateCcw, ShieldAlert, Monitor, ArrowLeftRight, HelpCircle
} from 'lucide-react';

export default function LoansPage() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const currentLang = localStorage.getItem('language') || 'en';

  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin-portal' : 'borrow'); // 'borrow', 'my-loans', 'admin-portal'

  useEffect(() => {
    setActiveTab(isAdmin ? 'admin-portal' : 'borrow');
  }, [isAdmin]);
  const [products, setProducts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // mapping of ID to loading boolean
  const [selectedQuantities, setSelectedQuantities] = useState({}); // { [productId]: quantity }
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch available products
      const prodRes = await inventoryAPI.getAll({ limit: 100 });
      // Only include items that are hardware/accessories
      const borrowable = (prodRes.data?.products || []).filter(p => 
        p.type === 'Hardware'
      );
      setProducts(borrowable);

      // Fetch loan records
      const loanRes = await loansAPI.getAll();
      setLoans(loanRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestLoan = async (productId, quantity, name) => {
    setActionLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const res = await loansAPI.request(productId, quantity);
      showToast(
        currentLang === 'th'
          ? `ส่งคำขอยืม ${name} จำนวน ${quantity} ชิ้น สำเร็จ! กรุณารอไอทีอนุมัติ`
          : `Requested ${quantity} unit(s) of ${name} successfully! Pending IT approval.`
      );
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit loan request');
    } finally {
      setActionLoading(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  };

  const handleReturnLoan = async (loanId, name) => {
    setActionLoading(prev => ({ ...prev, [loanId]: true }));
    try {
      await loansAPI.return(loanId);
      showToast(
        currentLang === 'th'
          ? `ส่งคำขอคืน ${name} สำเร็จ! กรุณารอไอทีตรวจสอบ`
          : `Submitted return request for ${name}. Pending IT check.`
      );
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setActionLoading(prev => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
    }
  };

  const handleApproveLoan = async (loanId, name) => {
    setActionLoading(prev => ({ ...prev, [loanId]: true }));
    try {
      await loansAPI.approve(loanId);
      showToast(
        currentLang === 'th'
          ? `อนุมัติรายการของ ${name} เรียบร้อยแล้ว`
          : `Approved request for ${name} successfully.`
      );
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(prev => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
    }
  };

  const handleRejectLoan = async (loanId, name) => {
    setActionLoading(prev => ({ ...prev, [loanId]: true }));
    try {
      await loansAPI.reject(loanId);
      showToast(
        currentLang === 'th'
          ? `ปฏิเสธรายการของ ${name} เรียบร้อยแล้ว`
          : `Rejected request for ${name} successfully.`
      );
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(prev => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
    }
  };

  // Filter products based on search & category
  const filteredProducts = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.model?.toLowerCase().includes(search.toLowerCase()) ||
      p.itemId?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const getUniqueCategories = () => {
    const cats = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(cats));
  };

  // Formatter for statuses
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_borrow':
        return <span className="badge badge-orange">{currentLang === 'th' ? 'รออนุมัติการยืม' : 'Pending Borrow'}</span>;
      case 'borrowed':
        return <span className="badge badge-green">{currentLang === 'th' ? 'กำลังยืมใช้งาน' : 'Borrowed'}</span>;
      case 'pending_return':
        return <span className="badge badge-blue">{currentLang === 'th' ? 'รออนุมัติการคืน' : 'Pending Return'}</span>;
      case 'returned':
        return <span className="badge badge-gray">{currentLang === 'th' ? 'คืนเรียบร้อยแล้ว' : 'Returned'}</span>;
      case 'rejected':
        return <span className="badge badge-red">{currentLang === 'th' ? 'ปฏิเสธคำขอ' : 'Rejected'}</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="kb-container" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification animate-slideInDown">
          <div className="toast-notification-content">
            <Check size={18} />
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="kb-banner" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)', boxShadow: '0 10px 30px -5px rgba(13, 148, 136, 0.2)' }}>
        <h1 style={{ background: 'linear-gradient(120deg, #ffffff 0%, #ccfbf1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {currentLang === 'th' ? 'ระบบยืม-คืนอุปกรณ์ไอที' : 'IT Equipment Loans'}
        </h1>
        <p>
          {currentLang === 'th'
            ? 'ตรวจสอบรายการครุภัณฑ์คอมพิวเตอร์และอุปกรณ์เสริมที่ว่างพร้อมยืม กดขอส่งยืมหรือคืนเครื่อง และติดตามสถานะอนุมัติของไอทีอย่างง่ายดายในที่เดียว'
            : 'Check available computers and accessories, submit borrow or return requests, and track IT approval statuses in real-time.'}
        </p>

        {/* Tab Switcher */}
        {!isAdmin && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
            <button
              className={`btn ${activeTab === 'borrow' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                background: activeTab === 'borrow' ? 'white' : 'transparent',
                color: activeTab === 'borrow' ? '#1e3a8a' : 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onClick={() => setActiveTab('borrow')}
            >
              <Package size={16} />
              {currentLang === 'th' ? 'อุปกรณ์ที่สามารถยืมได้' : 'Borrow Equipment'}
            </button>

            <button
              className={`btn ${activeTab === 'my-loans' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                background: activeTab === 'my-loans' ? 'white' : 'transparent',
                color: activeTab === 'my-loans' ? '#1e3a8a' : 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onClick={() => setActiveTab('my-loans')}
            >
              <Clock size={16} />
              {currentLang === 'th' ? 'รายการยืมของฉัน' : 'My Loans'}
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--gray-400)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
          {currentLang === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading loan information...'}
        </div>
      )}

      {!loading && (
        <>
          {/* TAB 1: Available Equipment for Borrow */}
          {activeTab === 'borrow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Search & Category Filter Toolbar */}
              <div className="toolbar" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: 'white', padding: 16, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
                <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
                  <div className="search-box-icon"><Search size={18} /></div>
                  <input
                    type="text"
                    placeholder={currentLang === 'th' ? 'ค้นหาด้วยชื่ออุปกรณ์, แบรนด์, หรือรุ่น...' : 'Search by name, brand, or model...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="filter-select" 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ minWidth: 180, height: 42 }}
                >
                  <option value="">{currentLang === 'th' ? 'ทุกหมวดหมู่' : 'All Categories'}</option>
                  {getUniqueCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Grid of Borrowable cards */}
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', background: 'white', borderRadius: 16, border: '1px solid var(--gray-200)', color: 'var(--gray-400)' }}>
                  <Package size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <h3>{currentLang === 'th' ? 'ไม่มีอุปกรณ์ว่างในขณะนี้' : 'No available equipment'}</h3>
                  <p>{currentLang === 'th' ? 'ครุภัณฑ์ทั้งหมดกำลังถูกใช้งาน หรือไม่มีสินทรัพย์ตามเงื่อนไขค้นหา' : 'All equipment is currently checked out, or matches no filters.'}</p>
                </div>
              ) : (
                <div className="kb-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                  {filteredProducts.map(p => {
                    const pendingBorrowQty = loans
                      .filter(l => l.product_id === p.id && l.status === 'pending_borrow')
                      .reduce((sum, l) => sum + (parseInt(l.quantity) || 1), 0);
                    const availableToBorrow = Math.max(0, (parseInt(p.quantity) || 0) - pendingBorrowQty);
                    
                    const activeLoansCount = loans.filter(l => 
                      l.product_id === p.id && 
                      (l.status === 'pending_borrow' || l.status === 'borrowed' || l.status === 'pending_return')
                    ).length;

                    return (
                      <div key={p.id} className="kb-card" style={{ border: activeLoansCount > 0 ? '1px dashed #0d9488' : '1px solid var(--gray-200)', opacity: 1 }}>
                        <div className="kb-card-header" style={{ border: 'none', background: 'transparent', padding: '24px 24px 12px 24px' }}>
                          <div className={`kb-card-icon-container`} style={{ background: '#e6f4ea', color: '#137333' }}>
                            <Monitor size={24} />
                          </div>
                          <div className="kb-card-title-section">
                            <span className="badge badge-success" style={{ background: '#e6f4ea', color: '#137333' }}>{p.category}</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                            <p style={{ fontSize: 12 }}>{p.brand} {p.model}</p>
                          </div>
                        </div>

                        {/* Image component if any */}
                        {p.image && (
                          <div style={{ height: 130, background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-100)' }}>
                            <img src={p.image} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                          </div>
                        )}

                        <div style={{ padding: '16px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
                            <span>{currentLang === 'th' ? 'รหัสครุภัณฑ์:' : 'Asset ID:'}</span>
                            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{p.itemId}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
                            <span>{currentLang === 'th' ? 'สภาพเครื่อง:' : 'Condition:'}</span>
                            <span style={{ fontWeight: 600, color: p.condition === 'Normal' ? '#137333' : '#c5221f' }}>{p.condition}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
                            <span>{currentLang === 'th' ? 'จำนวนในคลัง:' : 'Available in stock:'}</span>
                            <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 15 }}>{p.quantity} {currentLang === 'th' ? 'ชิ้น' : 'units'}</span>
                          </div>

                          {activeLoansCount > 0 && (
                            <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 700, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                              <span>{currentLang === 'th' ? 'จำนวนที่กำลังดำเนินการ:' : 'Active requests:'}</span>
                              <span>{activeLoansCount} {currentLang === 'th' ? 'รายการ' : 'active'}</span>
                            </div>
                          )}

                          {availableToBorrow <= 0 || p.status === 'Out of Stock' ? (
                            <button
                              className="btn btn-outline"
                              disabled
                              style={{ width: '100%', height: 42, cursor: 'not-allowed', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', fontWeight: 700 }}
                            >
                              {currentLang === 'th' ? 'ของหมด ยืมไม่ได้' : 'Out of stock - Cannot borrow'}
                            </button>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 600 }}>
                                  {currentLang === 'th' ? 'เลือกจำนวนที่ต้องการยืม:' : 'Borrow quantity:'}
                                </span>
                                <select
                                  className="form-select"
                                  style={{ width: 80, height: 32, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--gray-300)' }}
                                  value={selectedQuantities[p.id] || 1}
                                  onChange={(e) => setSelectedQuantities(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 1 }))}
                                >
                                  {Array.from({ length: Math.min(availableToBorrow, 10) }, (_, i) => i + 1).map(v => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                className="btn btn-primary"
                                style={{ width: '100%', height: 42, background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)', border: 'none', fontWeight: 700 }}
                                onClick={() => handleRequestLoan(p.id, selectedQuantities[p.id] || 1, p.name)}
                                disabled={!!actionLoading[p.id]}
                              >
                                {actionLoading[p.id] ? '...' : (currentLang === 'th' ? 'ยืมอุปกรณ์นี้' : 'Borrow this equipment')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My active / historical loans */}
          {activeTab === 'my-loans' && (
            <div className="table-container animate-fadeIn" style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 800, color: 'var(--gray-800)' }}>
                {currentLang === 'th' ? 'ประวัติและการยืมครุภัณฑ์ของฉัน' : 'My IT Loan History'}
              </h3>

              {loans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-400)' }}>
                  <RotateCcw size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <p>{currentLang === 'th' ? 'คุณยังไม่มีประวัติการทำรายการยืม-คืนในระบบ' : 'You have no loan history in the system.'}</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{currentLang === 'th' ? 'รหัสอุปกรณ์' : 'Asset ID'}</th>
                      <th>{currentLang === 'th' ? 'ชื่ออุปกรณ์' : 'Asset Name'}</th>
                      <th>{currentLang === 'th' ? 'ผู้ยืม' : 'Borrower'}</th>
                      <th>{currentLang === 'th' ? 'วันที่ขอทำรายการ' : 'Date Requested'}</th>
                      <th>{currentLang === 'th' ? 'สถานะอนุมัติ' : 'Status'}</th>
                      <th>{currentLang === 'th' ? 'จัดการ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <tr key={loan.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{loan.item_id}</td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{loan.item_name}</span>
                            {loan.quantity > 1 && (
                              <span className="badge badge-teal" style={{ marginLeft: 8, padding: '2px 6px', fontSize: 10 }}>
                                x{loan.quantity}
                              </span>
                            )}
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--gray-400)' }}>{loan.brand} {loan.model}</p>
                          </div>
                        </td>
                        <td>{loan.full_name}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                          {loan.created_at ? new Date(loan.created_at).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td>{getStatusBadge(loan.status)}</td>
                        <td>
                          {loan.status === 'borrowed' ? (
                            <button
                              className="btn btn-outline btn-sm btn-danger"
                              style={{ padding: '6px 12px', fontSize: 12, height: 'auto', minHeight: 'auto', fontWeight: 600 }}
                              onClick={() => handleReturnLoan(loan.id, loan.item_name)}
                              disabled={!!actionLoading[loan.id]}
                            >
                              {actionLoading[loan.id] ? '...' : (currentLang === 'th' ? 'คืนเครื่อง' : 'Return Device')}
                            </button>
                          ) : (
                            <span style={{ fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                              {loan.status === 'pending_borrow' && (currentLang === 'th' ? 'รอไอทีตรวจรับ' : 'Awaiting IT')}
                              {loan.status === 'pending_return' && (currentLang === 'th' ? 'รอตรวจสภาพคืน' : 'Awaiting Check')}
                              {loan.status === 'returned' && (currentLang === 'th' ? 'คืนเรียบร้อย' : 'Closed')}
                              {loan.status === 'rejected' && (currentLang === 'th' ? 'ปฏิเสธ' : 'Rejected')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: Admin Approval Portal */}
          {activeTab === 'admin-portal' && isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="animate-fadeIn">
              {/* SECTION 1: Pending Borrows */}
              <div className="table-container" style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', borderTop: '4px solid #f59e0b', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800, color: 'var(--gray-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{currentLang === 'th' ? 'คำขอยืมอุปกรณ์ (รออนุมัติ)' : 'Borrow Requests (Pending Approval)'}</span>
                  <span className="badge badge-orange">{loans.filter(l => l.status === 'pending_borrow').length}</span>
                </h3>
                {loans.filter(l => l.status === 'pending_borrow').length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', margin: 0 }}>
                    {currentLang === 'th' ? 'ไม่มีคำขอยืมอุปกรณ์ในขณะนี้' : 'No pending borrow requests.'}
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{currentLang === 'th' ? 'ผู้ขอทำรายการ' : 'Requester'}</th>
                        <th>{currentLang === 'th' ? 'อุปกรณ์ครุภัณฑ์' : 'Asset'}</th>
                        <th>{currentLang === 'th' ? 'วันที่ขอ' : 'Request Date'}</th>
                        <th>{currentLang === 'th' ? 'จำนวน' : 'Quantity'}</th>
                        <th>{currentLang === 'th' ? 'สถานะ' : 'Status'}</th>
                        <th style={{ textAlign: 'center' }}>{currentLang === 'th' ? 'การอนุมัติ' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.filter(l => l.status === 'pending_borrow').map(loan => (
                        <tr key={loan.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {getInitials(loan.full_name)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 14 }}>{loan.full_name}</span>
                                <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600, background: '#fffbeb', border: '1px solid #fef3c7', padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 2 }}>@{loan.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 600 }}>{loan.item_name}</span>
                              <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)' }}>{loan.item_id}</p>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                            {loan.created_at ? new Date(loan.created_at).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>x{loan.quantity || 1}</td>
                          <td>{getStatusBadge(loan.status)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: '6px 12px', fontSize: 12, height: 'auto', minHeight: 'auto', background: '#e6f4ea', color: '#137333', borderColor: '#cbd5e1' }}
                                onClick={() => handleApproveLoan(loan.id, loan.item_name)}
                                disabled={!!actionLoading[loan.id]}
                              >
                                {actionLoading[loan.id] ? '...' : (currentLang === 'th' ? 'อนุมัติ' : 'Approve')}
                              </button>
                              <button
                                className="btn btn-outline btn-sm btn-danger"
                                style={{ padding: '6px 12px', fontSize: 12, height: 'auto', minHeight: 'auto' }}
                                onClick={() => handleRejectLoan(loan.id, loan.item_name)}
                                disabled={!!actionLoading[loan.id]}
                              >
                                {actionLoading[loan.id] ? '...' : (currentLang === 'th' ? 'ปฏิเสธ' : 'Reject')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SECTION 2: Active Loans */}
              <div className="table-container" style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', borderTop: '4px solid #10b981', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800, color: 'var(--gray-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{currentLang === 'th' ? 'อุปกรณ์ที่อยู่ระหว่างการยืม (ใช้งานอยู่)' : 'Active Loans (Currently in Use)'}</span>
                  <span className="badge badge-green">{loans.filter(l => l.status === 'borrowed').length}</span>
                </h3>
                {loans.filter(l => l.status === 'borrowed').length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', margin: 0 }}>
                    {currentLang === 'th' ? 'ไม่มีอุปกรณ์ที่อยู่ระหว่างการยืมในขณะนี้' : 'No active loans at the moment.'}
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{currentLang === 'th' ? 'ผู้ยืม' : 'Borrower'}</th>
                        <th>{currentLang === 'th' ? 'อุปกรณ์ครุภัณฑ์' : 'Asset'}</th>
                        <th>{currentLang === 'th' ? 'วันที่ยืม' : 'Borrow Date'}</th>
                        <th>{currentLang === 'th' ? 'จำนวน' : 'Quantity'}</th>
                        <th>{currentLang === 'th' ? 'สถานะ' : 'Status'}</th>
                        <th style={{ textAlign: 'center' }}>{currentLang === 'th' ? 'การจัดการ' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.filter(l => l.status === 'borrowed').map(loan => (
                        <tr key={loan.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {getInitials(loan.full_name)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 14 }}>{loan.full_name}</span>
                                <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 2 }}>@{loan.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 600 }}>{loan.item_name}</span>
                              <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)' }}>{loan.item_id}</p>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                            {loan.borrow_date ? new Date(loan.borrow_date).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>x{loan.quantity || 1}</td>
                          <td>{getStatusBadge(loan.status)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                              {currentLang === 'th' ? 'ผู้ใช้ครอบครองอยู่' : 'In Use'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SECTION 3: Pending Returns */}
              <div className="table-container" style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', borderTop: '4px solid #1d4ed8', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800, color: 'var(--gray-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{currentLang === 'th' ? 'คำขอคืนอุปกรณ์ (รออนุมัติ)' : 'Return Requests (Pending Approval)'}</span>
                  <span className="badge badge-blue">{loans.filter(l => l.status === 'pending_return').length}</span>
                </h3>
                {loans.filter(l => l.status === 'pending_return').length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', margin: 0 }}>
                    {currentLang === 'th' ? 'ไม่มีคำขอคืนอุปกรณ์ในขณะนี้' : 'No pending return requests.'}
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{currentLang === 'th' ? 'ผู้ขอคืน' : 'Requester'}</th>
                        <th>{currentLang === 'th' ? 'อุปกรณ์ครุภัณฑ์' : 'Asset'}</th>
                        <th>{currentLang === 'th' ? 'วันที่ยื่นเรื่องคืน' : 'Return Request Date'}</th>
                        <th>{currentLang === 'th' ? 'จำนวน' : 'Quantity'}</th>
                        <th>{currentLang === 'th' ? 'สถานะ' : 'Status'}</th>
                        <th style={{ textAlign: 'center' }}>{currentLang === 'th' ? 'การอนุมัติ' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.filter(l => l.status === 'pending_return').map(loan => (
                        <tr key={loan.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {getInitials(loan.full_name)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 14 }}>{loan.full_name}</span>
                                <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, background: '#eff6ff', border: '1px solid #dbeafe', padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 2 }}>@{loan.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 600 }}>{loan.item_name}</span>
                              <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)' }}>{loan.item_id}</p>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                            {loan.updated_at ? new Date(loan.updated_at).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>x{loan.quantity || 1}</td>
                          <td>{getStatusBadge(loan.status)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: '6px 12px', fontSize: 12, height: 'auto', minHeight: 'auto', background: '#e6f4ea', color: '#137333', borderColor: '#cbd5e1' }}
                                onClick={() => handleApproveLoan(loan.id, loan.item_name)}
                                disabled={!!actionLoading[loan.id]}
                              >
                                {actionLoading[loan.id] ? '...' : (currentLang === 'th' ? 'ยืนยันรับคืน' : 'Approve Return')}
                              </button>
                              <button
                                className="btn btn-outline btn-sm btn-danger"
                                style={{ padding: '6px 12px', fontSize: 12, height: 'auto', minHeight: 'auto' }}
                                onClick={() => handleRejectLoan(loan.id, loan.item_name)}
                                disabled={!!actionLoading[loan.id]}
                              >
                                {actionLoading[loan.id] ? '...' : (currentLang === 'th' ? 'ปฏิเสธ' : 'Reject')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SECTION 4: Resolved History */}
              <div className="table-container" style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid var(--gray-200)', borderTop: '4px solid #475569', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800, color: 'var(--gray-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{currentLang === 'th' ? 'ประวัติการทำรายการยืม-คืนอุปกรณ์ (เสร็จสิ้น)' : 'Device Loan & Return History (Completed)'}</span>
                  <span className="badge badge-gray">{loans.filter(l => l.status === 'returned' || l.status === 'rejected').length}</span>
                </h3>
                {loans.filter(l => l.status === 'returned' || l.status === 'rejected').length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', margin: 0 }}>
                    {currentLang === 'th' ? 'ไม่มีประวัติการทำรายการ' : 'No history records.'}
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{currentLang === 'th' ? 'ผู้ทำรายการ' : 'Requester'}</th>
                        <th>{currentLang === 'th' ? 'อุปกรณ์ครุภัณฑ์' : 'Asset'}</th>
                        <th>{currentLang === 'th' ? 'วันที่ขอ' : 'Request Date'}</th>
                        <th>{currentLang === 'th' ? 'จำนวน' : 'Quantity'}</th>
                        <th>{currentLang === 'th' ? 'สถานะล่าสุด' : 'Current Status'}</th>
                        <th>{currentLang === 'th' ? 'การจัดการ' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.filter(l => l.status === 'returned' || l.status === 'rejected').map(loan => (
                        <tr key={loan.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {getInitials(loan.full_name)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 14 }}>{loan.full_name}</span>
                                <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 2 }}>@{loan.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 600 }}>{loan.item_name}</span>
                              <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)' }}>{loan.item_id}</p>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                            {loan.created_at ? new Date(loan.created_at).toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ fontWeight: 600 }}>x{loan.quantity || 1}</td>
                          <td>{getStatusBadge(loan.status)}</td>
                          <td>
                            <span style={{ fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                              {currentLang === 'th' ? 'ดำเนินการเสร็จสิ้น' : 'Resolved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

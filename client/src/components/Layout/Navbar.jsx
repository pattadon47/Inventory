import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Menu,
  Home,
  Package,
  Truck,
  DollarSign,
  ChevronDown,
  Edit,
  LogOut,
  List,
  RefreshCw,
  ClipboardList,
  ShoppingBag,
  Clock,
} from 'lucide-react';

export default function Navbar({ sidebarCollapsed, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  // Real-time ticking clock
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleNav = (path) => {
    navigate(path);
    setOpenDropdown(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    const name = user.fullName || user.username || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <nav className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} ref={dropdownRef}>
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <span className="navbar-title">itopplus</span>
        
        {/* Digital Clock in Navbar */}
        <div className="navbar-clock" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'var(--gray-50)',
          border: '1px solid var(--gray-200)',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--gray-700)',
          marginLeft: '12px',
          fontFamily: 'monospace'
        }}>
          <Clock size={14} style={{ color: 'var(--primary-500)' }} />
          <span>{formattedTime}</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Home */}
        <div className="navbar-nav-item">
          <button
            className={`navbar-nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => handleNav('/dashboard')}
          >
            <Home size={16} />
            <span>{t('home')}</span>
          </button>
        </div>

        {/* Inventory Dropdown */}
        <div className="navbar-nav-item">
          <button
            className={`navbar-nav-btn ${openDropdown === 'inventory' ? 'active' : ''}`}
            onClick={() => toggleDropdown('inventory')}
          >
            <Package size={16} />
            <span>{t('inventory')}</span>
            <ChevronDown size={14} />
          </button>
          {openDropdown === 'inventory' && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-item" onClick={() => handleNav('/inventory')}>
                <List size={16} />
                {t('productList')}
              </div>
              <div className="navbar-dropdown-item" onClick={() => handleNav('/inventory')}>
                <RefreshCw size={16} />
                {t('updateProduct')}
              </div>
            </div>
          )}
        </div>

        {/* Purchases Dropdown */}
        <div className="navbar-nav-item">
          <button
            className={`navbar-nav-btn ${openDropdown === 'purchases' ? 'active' : ''}`}
            onClick={() => toggleDropdown('purchases')}
          >
            <Truck size={16} />
            <span>{t('purchases')}</span>
            <ChevronDown size={14} />
          </button>
          {openDropdown === 'purchases' && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-item" onClick={() => handleNav('/purchases')}>
                <ClipboardList size={16} />
                {t('manageOrder')}
              </div>
              <div className="navbar-dropdown-item" onClick={() => handleNav('/purchases')}>
                <ShoppingBag size={16} />
                {t('purchases')}
              </div>
            </div>
          )}
        </div>

        {/* Sales */}
        <div className="navbar-nav-item">
          <button
            className={`navbar-nav-btn ${location.pathname === '/sales' ? 'active' : ''}`}
            onClick={() => handleNav('/sales')}
          >
            <DollarSign size={16} />
            <span>{t('sales')}</span>
          </button>
        </div>

        {/* Account Dropdown */}
        <div className="navbar-nav-item">
          <button
            className="navbar-user-info"
            onClick={() => toggleDropdown('account')}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="navbar-user-avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="navbar-user-avatar">{getInitials()}</div>
            )}
            <div>
              <div className="navbar-user-name">{user?.fullName || user?.username || 'User'}</div>
              <div className="navbar-user-role">{user?.role || 'user'}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--gray-400)' }} />
          </button>
          {openDropdown === 'account' && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-item" onClick={() => handleNav('/profile')}>
                <Edit size={16} />
                {t('editProfile')}
              </div>
              <div className="navbar-dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} />
                {t('signOut')}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

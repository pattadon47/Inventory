import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  DollarSign,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { path: '/inventory', labelKey: 'inventory', icon: Package },
  { path: '/purchases', labelKey: 'purchases', icon: ShoppingCart },
  { path: '/sales', labelKey: 'sales', icon: DollarSign },
  { path: '/users', labelKey: 'users', icon: Users, adminOnly: true },
  { path: '/settings', labelKey: 'settings', icon: Settings },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();
  const { t } = useLanguage();

  const handleNavClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
          }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Package size={20} color="white" />
          </div>
          <span className="sidebar-brand-text">itopplus</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const labelText = t(item.labelKey);
            return (
              <div
                key={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={collapsed ? labelText : ''}
              >
                <Icon size={20} className="sidebar-item-icon" />
                <span className="sidebar-item-text">{labelText}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <div
            className="sidebar-item"
            onClick={handleLogout}
            title={collapsed ? t('logout') : ''}
          >
            <LogOut size={20} className="sidebar-item-icon" />
            <span className="sidebar-item-text">{t('logout')}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

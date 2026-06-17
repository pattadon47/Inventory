import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Home,
  List,
  Monitor,
  Wrench,
  BarChart2,
  UserCheck,
  Settings,
  LogOut,
  Package,
  BookOpen,
  ArrowLeftRight
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', labelKey: 'home', icon: Home },
  { path: '/inventory?tab=overview', labelKey: 'inventory', icon: List },
  { path: '/inventory?tab=devices', labelKey: 'devices', icon: Monitor },
  { path: '/inventory?tab=maintenance', labelKey: 'control', icon: Wrench },
  { path: '/loans', labelKey: 'loans', icon: ArrowLeftRight },
  { path: '/sales', labelKey: 'reports', icon: BarChart2 },
  { path: '/users', labelKey: 'enrollment', icon: UserCheck, adminOnly: true },
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

  // Helper to determine if a menu item is active
  const checkActive = (itemPath) => {
    if (itemPath.startsWith('/inventory')) {
      if (location.pathname !== '/inventory') return false;
      const tabParam = new URLSearchParams(location.search).get('tab') || 'overview';
      const itemTabParam = new URLSearchParams(itemPath.split('?')[1] || '').get('tab') || 'overview';
      
      // If the sidebar item is Inventory (tab=overview), it's active for general inventory sub-tabs.
      if (itemTabParam === 'overview') {
        const inventoryGeneralTabs = [
          'overview', 'software', 'hardware', 
          'alerts', 'categories', 'scanner', 'warranty'
        ];
        return inventoryGeneralTabs.includes(tabParam);
      }
      return tabParam === itemTabParam;
    }
    
    return location.pathname === itemPath;
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
            <Package size={18} color="white" />
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = checkActive(item.path);
            const labelText = t(item.labelKey);
            return (
              <div
                key={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={labelText}
              >
                <Icon size={20} className="sidebar-item-icon" />
                <span className="sidebar-item-text">{labelText}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div
            className={`sidebar-item ${checkActive('/inventory?tab=kb') ? 'active' : ''}`}
            onClick={() => handleNavClick('/inventory?tab=kb')}
            title={t('knowledgeBase')}
          >
            <BookOpen size={20} className="sidebar-item-icon" />
            <span className="sidebar-item-text">{t('knowledgeBase')}</span>
          </div>
          <div className="sidebar-divider" />
          <div
            className="sidebar-item"
            onClick={handleLogout}
            title={t('logout')}
          >
            <LogOut size={20} className="sidebar-item-icon" />
            <span className="sidebar-item-text">{t('logout')}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      const newVal = !sidebarCollapsed;
      setSidebarCollapsed(newVal);
      localStorage.setItem('sidebarCollapsed', String(newVal));
      window.dispatchEvent(new Event('sidebarToggle'));
    }
  };

  useEffect(() => {
    const handleToggle = () => {
      setSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    };
    window.addEventListener('sidebarToggle', handleToggle);
    return () => window.removeEventListener('sidebarToggle', handleToggle);
  }, []);

  const isInventory = location.pathname === '/inventory';

  return (
    <div className="layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className={`layout-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isInventory ? 'no-navbar' : ''}`}>
        {!isInventory && (
          <Navbar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
        )}
        <main className="layout-content">
          <div key={location.pathname} className="page-fade-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

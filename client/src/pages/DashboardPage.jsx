import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dashboardAPI, inventoryAPI } from '../services/api';
import {
  Package,
  CreditCard,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ShieldCheck,
  Calendar,
  ChevronDown,
  Laptop,
  Terminal,
  Mouse,
  Network,
  Link,
  Plus,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  AreaChart, Area,
} from 'recharts';

// Premium Multi-Color Palette
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Mock data (fallback when API is not available)
const mockMonthlyPurchases = [
  { month: 'Jan', amount: 12400 },
  { month: 'Feb', amount: 18200 },
  { month: 'Mar', amount: 15600 },
  { month: 'Apr', amount: 22100 },
  { month: 'May', amount: 19800 },
  { month: 'Jun', amount: 24500 },
];

const mockCategoryData = [
  { name: 'Hardware', value: 45 },
  { name: 'Software', value: 20 },
  { name: 'Accessories', value: 18 },
  { name: 'Network', value: 10 },
  { name: 'Cables', value: 7 },
];

const mockExpenseTrend = [
  { month: 'Jan', expenses: 8500 },
  { month: 'Feb', expenses: 12300 },
  { month: 'Mar', expenses: 10800 },
  { month: 'Apr', expenses: 15200 },
  { month: 'May', expenses: 13900 },
  { month: 'Jun', expenses: 18600 },
];

const mockRecentActivity = [
  { id: 1, action: 'Added new product', item: 'Dell Monitor 27"', user: 'admin', time: '2 min ago' },
  { id: 2, action: 'Updated stock', item: 'Logitech Mouse MX3', user: 'admin', time: '15 min ago' },
  { id: 3, action: 'Created purchase order', item: 'PO-2024-0042', user: 'john', time: '1 hour ago' },
  { id: 4, action: 'Deleted product', item: 'Old Keyboard K120', user: 'admin', time: '2 hours ago' },
];

// Helper: format date as YYYY-MM-DD
const toISO = (d) => d.toISOString().split('T')[0];

// Helper: compute date ranges
function getPresetRange(preset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const day = now.getDay(); // 0=Sun

  switch (preset) {
    case 'thisWeek': {
      const start = new Date(y, m, d - (day === 0 ? 6 : day - 1)); // Monday
      return { from: toISO(start), to: toISO(now) };
    }
    case 'thisMonth':
      return { from: toISO(new Date(y, m, 1)), to: toISO(now) };
    case 'lastMonth':
      return { from: toISO(new Date(y, m - 1, 1)), to: toISO(new Date(y, m, 0)) };
    case 'last3Months':
      return { from: toISO(new Date(y, m - 2, 1)), to: toISO(now) };
    case 'last6Months':
      return { from: toISO(new Date(y, m - 5, 1)), to: toISO(now) };
    case 'thisYear':
      return { from: toISO(new Date(y, 0, 1)), to: toISO(now) };
    case 'allTime':
    default:
      return { from: null, to: null };
  }
}

// Stable random generator helper for trading card sparklines
const getCategoryTrend = (name, currentValue) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const points = [];
  const length = 9;
  const baseValue = currentValue || 5;
  
  for (let i = 0; i < length; i++) {
    const seed = Math.sin(hash + i) * 10000;
    const factor = 0.75 + (seed - Math.floor(seed)) * 0.5;
    points.push({ val: Math.round(baseValue * factor) });
  }
  
  points[length - 1] = { val: currentValue };
  
  const firstVal = points[0].val;
  const lastVal = points[length - 1].val;
  const isPositive = lastVal >= firstVal;
  
  let pctChange = 0;
  if (currentValue === 0) {
    pctChange = 0;
  } else if (firstVal > 0) {
    pctChange = ((lastVal - firstVal) / firstVal) * 100;
  } else {
    pctChange = lastVal * 10;
  }
  
  const pctString = `${isPositive ? '+' : ''}${pctChange.toFixed(1)}%`;
  
  return {
    sparklineData: points,
    isPositive,
    pctString
  };
};

const getCategoryIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('hardware') || lower.includes('pc') || lower.includes('computer')) return Laptop;
  if (lower.includes('software') || lower.includes('app') || lower.includes('os')) return Terminal;
  if (lower.includes('accessory') || lower.includes('mouse') || lower.includes('keyboard')) return Mouse;
  if (lower.includes('network') || lower.includes('switch') || lower.includes('router') || lower.includes('wifi')) return Network;
  if (lower.includes('cable') || lower.includes('wire') || lower.includes('link')) return Link;
  return Package;
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPurchases: 0,
    lowStock: 0,
    totalValue: 0,
  });
  const [monthlyPurchases, setMonthlyPurchases] = useState(mockMonthlyPurchases);
  const [categoryData, setCategoryData] = useState(mockCategoryData);
  const [expenseTrend, setExpenseTrend] = useState(mockExpenseTrend);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [conditionCounts, setConditionCounts] = useState({
    Normal: 0,
    InUse: 0,
    UnderRepair: 0,
    Broken: 0,
  });
  const [loading, setLoading] = useState(false);

  // Date range state
  const [activePreset, setActivePreset] = useState('allTime');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tradingTab, setTradingTab] = useState('watchlist'); // 'watchlist', 'trending', 'gainers', 'losers'
  const [tradingSubtab, setTradingSubtab] = useState('All');
  const [showCustom, setShowCustom] = useState(false);
  const [maintenanceTab, setMaintenanceTab] = useState('overview'); // 'overview', 'repairs', 'history'
  const [brokenProducts, setBrokenProducts] = useState([]);
  const [repairHistory, setRepairHistory] = useState([
    { id: 'h1', name: 'MacBook Pro 16"', resolvedAt: 'Yesterday, 14:30', user: 'admin', previousStatus: 'Broken' },
    { id: 'h2', name: 'Dell Monitor 24"', resolvedAt: '2 days ago', user: 'admin', previousStatus: 'Under Repair' },
    { id: 'h3', name: 'Cisco Router Switch', resolvedAt: '5 days ago', user: 'system', previousStatus: 'Broken' }
  ]);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshInterval = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    fetchBrokenProducts();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        fetchDashboardData();
        fetchBrokenProducts();
      }, 10000);
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    }
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  const fetchBrokenProducts = async () => {
    try {
      const res = await inventoryAPI.getAll();
      let allProducts = [];
      if (Array.isArray(res)) {
        allProducts = res;
      } else if (res.data && Array.isArray(res.data)) {
        allProducts = res.data;
      } else if (res.products && Array.isArray(res.products)) {
        allProducts = res.products;
      } else if (res.data?.products && Array.isArray(res.data.products)) {
        allProducts = res.data.products;
      }
      
      const filtered = allProducts.filter(p => p.condition === 'Broken' || p.condition === 'Under Repair');
      setBrokenProducts(filtered);
    } catch (err) {
      console.error('Error fetching broken products:', err);
    }
  };

  const handleResolveProduct = async (product) => {
    try {
      // Resolve status to 'Normal'
      const updatedProduct = { ...product, condition: 'Normal' };
      const prodId = product._id || product.id;
      await inventoryAPI.update(prodId, updatedProduct);
      
      // Add to log / state
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
      const historyItem = {
        id: `h-${Date.now()}`,
        name: product.name,
        resolvedAt: nowStr,
        user: user?.fullName || user?.username || 'admin',
        previousStatus: product.condition
      };
      
      setRepairHistory(prev => [historyItem, ...prev]);
      
      // Refresh statistics and broken list
      fetchDashboardData();
      fetchBrokenProducts();
    } catch (err) {
      console.error("Failed to resolve asset repair:", err);
    }
  };

  const fetchDashboardData = async (from = null, to = null) => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats(from, to);
      const data = res.data;

      if (data) {
        setStats({
          totalProducts: data.totalProducts || 0,
          totalPurchases: data.totalPurchaseAmount || 0,
          lowStock: data.lowStockCount || 0,
          totalValue: data.totalStockValue || 0,
        });

        if (data.conditionCounts) {
          setConditionCounts(data.conditionCounts);
        }

        if (data.monthlyPurchases && data.monthlyPurchases.length > 0) {
          const mappedMonthly = data.monthlyPurchases.map(p => ({
            month: p.month,
            amount: p.total
          }));
          setMonthlyPurchases(mappedMonthly);
        } else {
          setMonthlyPurchases(mockMonthlyPurchases);
        }

        if (data.categoryDistribution && data.categoryDistribution.length > 0) {
          const mappedCategories = data.categoryDistribution.map(c => ({
            name: c.category,
            value: c.total_quantity
          }));
          setCategoryData(mappedCategories);
        } else {
          setCategoryData(mockCategoryData);
        }

        if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
          const mappedExpenses = data.monthlyExpenses.map(e => ({
            month: e.month,
            expenses: e.total
          }));
          setExpenseTrend(mappedExpenses);
        } else {
          setExpenseTrend(mockExpenseTrend);
        }

        if (data.recentActivity && data.recentActivity.length > 0) {
          const mappedActivity = data.recentActivity.map((a, idx) => {
            const dateObj = new Date(a.created_at || a.created_time);
            const timeStr = isNaN(dateObj.getTime()) ? 'Just now' : dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });
            return {
              id: a.id || idx,
              action: a.action,
              item: a.details,
              user: a.username || 'admin',
              time: timeStr
            };
          });
          setRecentActivity(mappedActivity);
        } else {
          setRecentActivity(mockRecentActivity);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset) => {
    setActivePreset(preset);
    setShowCustom(preset === 'custom');
    if (preset === 'custom') return; // wait for user to pick dates
    const { from, to } = getPresetRange(preset);
    setDateFrom(from || '');
    setDateTo(to || '');
    fetchDashboardData(from, to);
  };

  const handleCustomApply = () => {
    fetchDashboardData(dateFrom || null, dateTo || null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
  };

  const presets = [
    { key: 'thisWeek', label: t('thisWeek') },
    { key: 'thisMonth', label: t('thisMonth') },
    { key: 'lastMonth', label: t('lastMonth') },
    { key: 'last3Months', label: t('last3Months') },
    { key: 'last6Months', label: t('last6Months') },
    { key: 'thisYear', label: t('thisYear') },
    { key: 'allTime', label: t('allTime') },
    { key: 'custom', label: t('customRange') },
  ];

  const statCards = [
    { title: t('totalProducts'), value: stats.totalProducts, icon: Package, color: 'blue' },
    { title: t('totalPurchases'), value: formatCurrency(stats.totalPurchases), icon: CreditCard, color: 'green' },
    { title: t('lowStock'), value: stats.lowStock, icon: AlertTriangle, color: 'orange' },
    { title: t('totalValue'), value: formatCurrency(stats.totalValue), icon: DollarSign, color: 'purple' },
  ];

  const totalAssets = conditionCounts.Normal + conditionCounts.InUse + conditionCounts.UnderRepair + conditionCounts.Broken;
  const getPercent = (val) => {
    if (!totalAssets) return 0;
    return Math.round((val / totalAssets) * 100);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0 }}>{t('welcome')}, {user?.fullName || user?.username || 'User'} 👋</h1>
            <button
              onClick={() => setAutoRefresh(prev => !prev)}
              className="btn btn-outline btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '30px',
                fontSize: '11px',
                fontWeight: '600',
                height: 'auto',
                minHeight: 'auto',
                borderColor: autoRefresh ? 'var(--primary-500)' : 'var(--gray-200)',
                background: autoRefresh ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                color: autoRefresh ? 'var(--primary-700)' : 'var(--gray-600)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={11} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
              <span>Auto Refresh: {autoRefresh ? 'ON (10s)' : 'OFF'}</span>
            </button>
          </div>
          <p style={{ marginTop: '4px', marginBottom: 0 }}>Here's what's happening with your IT inventory today.</p>
        </div>

        {/* Date Range Picker */}
        <div className="dashboard-date-range">
          <div className="date-range-presets">
            {presets.map((p) => (
              <button
                key={p.key}
                className={`date-range-btn ${activePreset === p.key ? 'active' : ''}`}
                onClick={() => handlePresetClick(p.key)}
              >
                {p.key === 'custom' && <Calendar size={14} />}
                {p.label}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="date-range-custom">
              <div className="date-range-input-group">
                <label>{t('dateFrom')}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="date-range-input"
                />
              </div>
              <div className="date-range-input-group">
                <label>{t('dateTo')}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="date-range-input"
                />
              </div>
              <button className="date-range-apply" onClick={handleCustomApply}>
                {t('applyFilter')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="stat-card-header">
                <div className={`stat-card-icon ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="stat-card-title">{card.title}</div>
              <div className="stat-card-value">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {/* Monthly Purchases Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <BarChart3 size={20} color="var(--primary-600)" />
            {t('monthlyPurchases')}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyPurchases}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="amount" fill="url(#greenGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <TrendingUp size={20} color="var(--primary-600)" />
            {t('expenseTrend')}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={expenseTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution — Trading-Style Watchlist Cards */}
        <div className="category-trading-container" style={{ gridColumn: 'span 2' }}>
          <div className="category-trading-header">
            <div className="chart-title" style={{ margin: 0 }}>
              <Activity size={20} color="var(--primary-600)" />
              {t('categoryDist')}
            </div>
            
            {/* Watchlist Tabs */}
            <div className="category-trading-tabs">
              <button 
                className={`category-trading-tab ${tradingTab === 'watchlist' ? 'active' : ''}`}
                onClick={() => setTradingTab('watchlist')}
              >
                Watchlist
              </button>
              <button 
                className={`category-trading-tab ${tradingTab === 'trending' ? 'active' : ''}`}
                onClick={() => setTradingTab('trending')}
              >
                Trending
              </button>
              <button 
                className={`category-trading-tab ${tradingTab === 'gainers' ? 'active' : ''}`}
                onClick={() => setTradingTab('gainers')}
              >
                Top Gainers
              </button>
              <button 
                className={`category-trading-tab ${tradingTab === 'losers' ? 'active' : ''}`}
                onClick={() => setTradingTab('losers')}
              >
                Top Losers
              </button>
            </div>

            {/* Sub-tabs / Categories list */}
            <div className="category-trading-subtabs">
              <button 
                className={`category-trading-subtab ${tradingSubtab === 'All' ? 'active' : ''}`}
                onClick={() => setTradingSubtab('All')}
              >
                All
              </button>
              {categoryData.map(c => (
                <button
                  key={c.name}
                  className={`category-trading-subtab ${tradingSubtab === c.name ? 'active' : ''}`}
                  onClick={() => setTradingSubtab(c.name)}
                >
                  {c.name}
                </button>
              ))}
              
              <button className="category-trading-add-btn" onClick={() => window.location.href='/inventory'}>
                <Plus size={14} /> Add Asset
              </button>
            </div>
          </div>

          {/* Watchlist Cards Row */}
          <div className="category-trading-row">
            {(() => {
              // 1. Calculate trend properties
              const items = categoryData.map(c => {
                const trend = getCategoryTrend(c.name, c.value);
                return { ...c, ...trend };
              });

              // 2. Sort/Filter based on tradingTab
              let filtered = [...items];
              if (tradingTab === 'trending') {
                filtered.sort((a, b) => {
                  const pctA = Math.abs(parseFloat(a.pctString));
                  const pctB = Math.abs(parseFloat(b.pctString));
                  return pctB - pctA;
                });
              } else if (tradingTab === 'gainers') {
                filtered = filtered.filter(c => c.isPositive);
                filtered.sort((a, b) => parseFloat(b.pctString) - parseFloat(a.pctString));
              } else if (tradingTab === 'losers') {
                filtered = filtered.filter(c => !c.isPositive);
                filtered.sort((a, b) => parseFloat(a.pctString) - parseFloat(b.pctString));
              }

              // 3. Filter based on subtab
              if (tradingSubtab !== 'All') {
                filtered = filtered.filter(c => c.name === tradingSubtab);
              }

              if (filtered.length === 0) {
                return (
                  <div style={{ color: '#64748b', fontSize: '13px', padding: '24px 0', textAlign: 'center', width: '100%' }}>
                    No categories found in this list.
                  </div>
                );
              }

              return filtered.map((c) => {
                const Icon = getCategoryIcon(c.name);
                const isPositive = c.isPositive;
                
                return (
                  <div 
                    key={c.name} 
                    className={`category-trading-card ${isPositive ? 'positive' : 'negative'}`}
                    onClick={() => {
                      setTradingSubtab(c.name);
                    }}
                  >
                    <div className="category-trading-card-header">
                      <div className="category-trading-icon-circle" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                        <Icon size={16} />
                      </div>
                      <span className="category-trading-card-name" title={c.name}>{c.name}</span>
                    </div>
                    
                    <div className="category-trading-card-body">
                      <div className="category-trading-card-value">
                        {c.value} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Units</span>
                      </div>
                      <div className={`category-trading-card-change ${isPositive ? 'up' : 'down'}`}>
                        {isPositive ? '▲' : '▼'} {c.pctString} <span style={{ color: '#64748b', fontWeight: '500' }}>today</span>
                      </div>
                    </div>

                    <div className="category-trading-sparkline-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={c.sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`sparklineGrad-${c.name}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="val"
                            stroke={isPositive ? '#10b981' : '#ef4444'}
                            fill={`url(#sparklineGrad-${c.name})`}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>



        {/* IT Asset Condition Overview Card */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-title">
            <ShieldCheck size={20} color="var(--primary-600)" />
            {t('assetOverview')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0', flex: 1 }}>
            {/* Normal */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                  {t('condNormal')}
                </span>
                <span style={{ color: 'var(--gray-600)' }}>{conditionCounts.Normal} {t('condUnit')} ({getPercent(conditionCounts.Normal)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(conditionCounts.Normal)}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* In Use */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span>
                  {t('condInUse')}
                </span>
                <span style={{ color: 'var(--gray-600)' }}>{conditionCounts.InUse} {t('condUnit')} ({getPercent(conditionCounts.InUse)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(conditionCounts.InUse)}%`, height: '100%', background: '#3b82f6', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Under Repair */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  {t('condRepair')}
                </span>
                <span style={{ color: 'var(--gray-600)' }}>{conditionCounts.UnderRepair} {t('condUnit')} ({getPercent(conditionCounts.UnderRepair)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(conditionCounts.UnderRepair)}%`, height: '100%', background: '#f59e0b', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Broken */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                  {t('condBroken')}
                </span>
                <span style={{ color: 'var(--gray-600)' }}>{conditionCounts.Broken} {t('condUnit')} ({getPercent(conditionCounts.Broken)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercent(conditionCounts.Broken)}%`, height: '100%', background: '#ef4444', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/inventory?tab=maintenance" style={{ fontSize: '12px', color: 'var(--primary-600)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Manage Repairs & Maintenance →
            </a>
          </div>
        </div>

        {/* Recent Activity — Admin only */}
        {isAdmin && (
          <div className="chart-card">
            <div className="chart-title">
              <Activity size={20} color="var(--primary-600)" />
              {t('recentActivity')}
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Item</th>
                    <th>User</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item) => (
                    <tr key={item.id}>
                      <td>{item.action}</td>
                      <td style={{ fontWeight: 600 }}>{item.item}</td>
                      <td>
                        <span className="badge badge-green">{item.user}</span>
                      </td>
                      <td style={{ color: 'var(--gray-400)', fontSize: 13 }}>{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dashboardAPI } from '../services/api';
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
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
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

export default function DashboardPage() {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
  };

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
      <div className="page-header">
        <h1>{t('welcome')}, {user?.fullName || user?.username || 'User'} 👋</h1>
        <p>Here's what's happening with your IT inventory today.</p>
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

        {/* Category Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <PieChartIcon size={20} color="var(--primary-600)" />
            {t('categoryDist')}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                formatter={(value) => <span style={{ fontSize: '13px', color: '#374151' }}>{value}</span>}
              />
            </PieChart>
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

        {/* IT Asset Condition Overview Card */}
        <div className="chart-card">
          <div className="chart-title">
            <ShieldCheck size={20} color="var(--primary-600)" />
            {t('assetOverview')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
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
        </div>

        {/* Recent Activity */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
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
      </div>
    </div>
  );
}

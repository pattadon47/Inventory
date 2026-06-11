import { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import { DollarSign, TrendingUp, Calendar, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857'];

const mockMonthlyExpenses = [
  { month: 'Jan', amount: 8500 },
  { month: 'Feb', amount: 12300 },
  { month: 'Mar', amount: 10800 },
  { month: 'Apr', amount: 15200 },
  { month: 'May', amount: 13900 },
  { month: 'Jun', amount: 18600 },
  { month: 'Jul', amount: 11200 },
  { month: 'Aug', amount: 16700 },
  { month: 'Sep', amount: 14500 },
  { month: 'Oct', amount: 19800 },
  { month: 'Nov', amount: 17300 },
  { month: 'Dec', amount: 21500 },
];

const mockCategoryExpenses = [
  { name: 'Hardware', value: 85000 },
  { name: 'Software', value: 42000 },
  { name: 'Accessories', value: 18500 },
  { name: 'Network', value: 12000 },
  { name: 'Cables', value: 5800 },
  { name: 'Services', value: 17000 },
];

export default function SalesPage() {
  const [monthlyExpenses, setMonthlyExpenses] = useState(mockMonthlyExpenses);
  const [categoryExpenses, setCategoryExpenses] = useState(mockCategoryExpenses);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSalesSummary();
  }, []);

  const fetchSalesSummary = async () => {
    try {
      setLoading(true);
      const res = await salesAPI.getSummary();
      const data = res.data;
      if (data) {
        if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
          const mappedMonthly = data.monthlyExpenses.map(m => ({
            month: m.month,
            amount: m.total_amount
          }));
          setMonthlyExpenses(mappedMonthly);
        }
        if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
          const mappedCategory = data.categoryBreakdown.map(c => ({
            name: c.category,
            value: c.total_spent
          }));
          setCategoryExpenses(mappedCategory);
        }
      }
    } catch (err) {
      console.error('Error fetching sales summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = monthlyExpenses.reduce((sum, m) => sum + m.amount, 0);
  const thisMonth = monthlyExpenses[monthlyExpenses.length - 1]?.amount || 0;
  const avgMonthly = Math.round(totalSpent / Math.max(monthlyExpenses.length, 1));

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  const summaryCards = [
    { label: 'Total Spent', value: formatCurrency(totalSpent), icon: DollarSign },
    { label: 'This Month', value: formatCurrency(thisMonth), icon: Calendar },
    { label: 'This Year', value: formatCurrency(totalSpent), icon: TrendingUp },
    { label: 'Avg Monthly', value: formatCurrency(avgMonthly), icon: BarChart3 },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Sales & Expenses Overview</h1>
        <p>Track your spending and financial performance</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="summary-card">
              <div className="flex-between mb-8">
                <span className="summary-card-label">{card.label}</span>
                <Icon size={20} color="var(--primary-500)" />
              </div>
              <div className="summary-card-value">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">
            <BarChart3 size={20} color="var(--primary-600)" />
            Monthly Expenses
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Amount']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="amount" fill="url(#salesGreenGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="salesGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <PieChartIcon size={20} color="var(--primary-600)" />
            Expense by Category
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={categoryExpenses} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={4} dataKey="value">
                {categoryExpenses.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Amount']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend formatter={(value) => <span style={{ fontSize: '13px', color: '#374151' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Expense Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Amount</th>
              <th>% of Total</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {monthlyExpenses.map((item, index) => {
              const pct = ((item.amount / totalSpent) * 100).toFixed(1);
              const prev = index > 0 ? monthlyExpenses[index - 1].amount : item.amount;
              const change = ((item.amount - prev) / prev * 100).toFixed(1);
              return (
                <tr key={item.month}>
                  <td style={{ fontWeight: 600 }}>{item.month}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                  <td>
                    <div className="flex gap-8" style={{ alignItems: 'center' }}>
                      <div style={{ flex: 1, maxWidth: 120, height: 6, background: 'var(--gray-100)', borderRadius: 3 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: 3 }} />
                      </div>
                      <span className="text-sm text-gray">{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${Number(change) >= 0 ? 'badge-green' : 'badge-red'}`}>
                      {Number(change) >= 0 ? '+' : ''}{change}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

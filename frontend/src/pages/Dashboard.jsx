import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../utils/api';
import StatCard from '../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ families: 0, members: 0, taxTotal: 0, pendingExpenses: 0 });
  const [expenseData, setExpenseData] = useState(null);
  const [residentData, setResidentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [finRes, resRes, expRes] = await Promise.all([
          api.get('/reports/financial'),
          api.get('/reports/residents'),
          api.get('/expenses?status=pending&limit=5'),
        ]);
        const fin = finRes.data.data;
        const res = resRes.data.data;

        const taxTotal = fin.income?.reduce((s, i) => s + parseFloat(i.total || 0), 0) || 0;

        setStats({
          families: res.total_families,
          members: res.total_members,
          taxTotal: taxTotal.toFixed(2),
          pendingExpenses: expRes.data.pagination?.total || 0,
        });

        // Expense breakdown pie
        if (fin.expenses?.length) {
          setExpenseData({
            labels: fin.expenses.map((e) => e.category),
            datasets: [{ data: fin.expenses.map((e) => parseFloat(e.total)), backgroundColor: ['#1B4D3E','#3EB489','#2D5986','#EF4444','#F59E0B','#8B5CF6'] }],
          });
        }

        // Ward distribution bar
        if (res.ward_breakdown?.length) {
          setResidentData({
            labels: res.ward_breakdown.map((w) => w.ward_number || 'N/A'),
            datasets: [{ label: t('families'), data: res.ward_breakdown.map((w) => parseInt(w.count)), backgroundColor: '#3EB489' }],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-400">{t('loading')}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('total_families')} value={stats.families} icon="👨‍👩‍👧" />
        <StatCard label={t('total_members')} value={stats.members} icon="👥" />
        <StatCard label={t('tax_collected')} value={`₹${stats.taxTotal}`} icon="💰" color="text-accent" />
        <StatCard label={t('pending_expenses')} value={stats.pendingExpenses} icon="📋" color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expenseData && (
          <div className="card">
            <h2 className="text-base font-semibold mb-4">{t('expense_breakdown')}</h2>
            <Pie data={expenseData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        )}
        {residentData && (
          <div className="card">
            <h2 className="text-base font-semibold mb-4">{t('ward_distribution')}</h2>
            <Bar data={residentData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        )}
      </div>
    </div>
  );
}

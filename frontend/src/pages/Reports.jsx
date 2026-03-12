import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('financial');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fin, setFin] = useState(null);
  const [res, setRes] = useState(null);

  async function loadFinancial() {
    const r = await api.get('/reports/financial', { params: { from, to } });
    setFin(r.data.data);
  }

  async function loadResidents() {
    const r = await api.get('/reports/residents');
    setRes(r.data.data);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('reports')}</h1>

      <div className="flex gap-2 border-b">
        {['financial', 'residents'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
            {tab === 'financial' ? t('financial_report') : t('resident_report')}
          </button>
        ))}
      </div>

      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="card flex gap-3 items-end">
            <div><label className="text-sm font-medium block mb-1">{t('from')}</label><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="text-sm font-medium block mb-1">{t('to')}</label><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <button onClick={loadFinancial} className="btn-primary">{t('generate')}</button>
          </div>
          {fin && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-slate-500 text-sm">{t('income')}</p>
                <p className="text-2xl font-bold text-accent">₹{fin.summary.total_income.toFixed(2)}</p>
              </div>
              <div className="card text-center">
                <p className="text-slate-500 text-sm">{t('expenses')}</p>
                <p className="text-2xl font-bold text-red-500">₹{fin.summary.total_expense.toFixed(2)}</p>
              </div>
              <div className="card text-center">
                <p className="text-slate-500 text-sm">{t('balance')}</p>
                <p className="text-2xl font-bold text-primary">₹{fin.summary.balance.toFixed(2)}</p>
              </div>
              {fin.expenses?.length > 0 && (
                <div className="card lg:col-span-3">
                  <h2 className="font-semibold mb-4">{t('expense_breakdown')}</h2>
                  <Pie
                    data={{ labels: fin.expenses.map((e) => e.category), datasets: [{ data: fin.expenses.map((e) => parseFloat(e.total)), backgroundColor: ['#1B4D3E','#3EB489','#2D5986','#EF4444','#F59E0B','#8B5CF6','#EC4899'] }] }}
                    options={{ responsive: true, plugins: { legend: { position: 'right' } } }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'residents' && (
        <div className="space-y-4">
          <button onClick={loadResidents} className="btn-primary">{t('generate')}</button>
          {res && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div><p className="text-slate-500 text-sm">{t('total_families')}</p><p className="text-2xl font-bold">{res.total_families}</p></div>
                  <div><p className="text-slate-500 text-sm">{t('total_members')}</p><p className="text-2xl font-bold">{res.total_members}</p></div>
                  <div><p className="text-slate-500 text-sm">{t('voter')}</p><p className="text-2xl font-bold text-accent">{res.voters}</p></div>
                </div>
              </div>
              {res.ward_breakdown?.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold mb-4">{t('ward_distribution')}</h2>
                  <Bar
                    data={{ labels: res.ward_breakdown.map((w) => w.ward_number || 'N/A'), datasets: [{ label: t('families'), data: res.ward_breakdown.map((w) => parseInt(w.count)), backgroundColor: '#3EB489' }] }}
                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

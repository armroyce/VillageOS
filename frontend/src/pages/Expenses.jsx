import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import PermissionGate from '../components/PermissionGate';
import toast from 'react-hot-toast';

export default function Expenses() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await api.get('/expenses', { params: { page, status: statusFilter || undefined } });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleAction(id, action) {
    try {
      await api.put(`/expenses/${id}/${action}`);
      toast.success(`Expense ${action}d`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge-green">{t('approved')}</span>;
    if (s === 'rejected') return <span className="badge-red">{t('rejected')}</span>;
    return <span className="badge-yellow">{t('pending')}</span>;
  };

  const columns = [
    { key: 'title', label: t('title') },
    { key: 'category', label: t('category'), render: (r) => r.category || '—' },
    { key: 'amount', label: t('amount'), render: (r) => `₹${r.amount}` },
    { key: 'status', label: t('status'), render: (r) => statusBadge(r.status) },
    { key: 'created_at', label: t('date'), render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: (r) => r.status === 'pending' ? (
        <PermissionGate permission="EXPENSE_APPROVE">
          <div className="flex gap-2">
            <button onClick={() => handleAction(r.id, 'approve')} className="text-xs text-green-600 hover:underline">{t('approve')}</button>
            <button onClick={() => handleAction(r.id, 'reject')} className="text-xs text-red-600 hover:underline">{t('reject')}</button>
          </div>
        </PermissionGate>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('expenses')}</h1>
        <PermissionGate permission="EXPENSE_CREATE">
          <Link to="/expenses/new" className="btn-primary text-sm">+ {t('new_expense')}</Link>
        </PermissionGate>
      </div>
      <div className="card">
        <div className="flex gap-2 mb-4">
          {['', 'pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium border ${statusFilter === s ? 'bg-primary text-white border-primary' : 'border-slate-300 text-slate-600'}`}>
              {s ? t(s) : 'All'}
            </button>
          ))}
        </div>
        {loading ? <p className="text-slate-400 text-sm">{t('loading')}</p> : (
          <>
            <Table columns={columns} data={data} />
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={load} />
          </>
        )}
      </div>
    </div>
  );
}

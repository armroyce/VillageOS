import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import PermissionGate from '../components/PermissionGate';

export default function Tax() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [summary, setSummary] = useState([]);
  const [dues, setDues] = useState([]);
  const [activeTab, setActiveTab] = useState('records');
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    try {
      const [taxRes, sumRes, duesRes] = await Promise.all([
        api.get('/tax', { params: { page } }),
        api.get('/tax/summary'),
        api.get('/tax/dues'),
      ]);
      setData(taxRes.data.data);
      setPagination(taxRes.data.pagination);
      setSummary(sumRes.data.data);
      setDues(duesRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'receipt_number', label: t('receipt') },
    { key: 'type', label: t('type'), render: (r) => <span className={r.type === 'house_tax' ? 'badge-green' : 'badge-yellow'}>{t(r.type)}</span> },
    { key: 'amount', label: t('amount'), render: (r) => `₹${r.amount}` },
    { key: 'status', label: t('status'), render: (r) => <span className="badge-green">{t(r.status)}</span> },
    { key: 'collectedAt', label: t('date'), render: (r) => new Date(r.collectedAt || r.collected_at).toLocaleDateString() },
    {
      key: 'receipt_action', label: '',
      render: (r) => <Link to={`/tax/receipt/${r.id}`} className="text-primary text-xs hover:underline">{t('receipt')}</Link>
    },
  ];

  const dueColumns = [
    { key: 'family_head_name', label: t('family_head') },
    { key: 'ward_number', label: t('ward') },
    { key: 'address', label: t('address') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('tax')}</h1>
        <PermissionGate permission="TAX_CREATE">
          <Link to="/tax/collect" className="btn-primary text-sm">+ {t('collect_tax')}</Link>
        </PermissionGate>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        {summary.map((s, i) => (
          <div key={i} className="card py-3 px-5 flex-1 min-w-[150px]">
            <p className="text-xs text-slate-500">{t(s.type)} / {t(s.status)}</p>
            <p className="text-xl font-bold text-primary">₹{parseFloat(s.total).toFixed(2)}</p>
            <p className="text-xs text-slate-400">{s.count} records</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {['records', 'dues'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
            {tab === 'records' ? 'Records' : `${t('dues')} (${dues.length})`}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <p className="text-slate-400 text-sm">{t('loading')}</p> : (
          activeTab === 'records' ? (
            <>
              <Table columns={columns} data={data} />
              <Pagination page={pagination.page} pages={pagination.pages} onPageChange={load} />
            </>
          ) : (
            <Table columns={dueColumns} data={dues} />
          )
        )}
      </div>
    </div>
  );
}

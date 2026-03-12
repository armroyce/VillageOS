import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';

export default function Audit() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filter, setFilter] = useState({ module: '', action: '' });
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await api.get('/audit', { params: { page, ...filter } });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);

  const columns = [
    { key: 'action', label: t('action') },
    { key: 'module', label: t('module') },
    { key: 'user_id', label: 'User ID', render: (r) => <span className="font-mono text-xs">{r.user_id?.slice(0, 8) || '—'}…</span> },
    { key: 'ip', label: t('ip') },
    { key: 'createdAt', label: t('date'), render: (r) => new Date(r.createdAt || r.created_at).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('audit')}</h1>
      <div className="card">
        <div className="flex gap-3 mb-4">
          <input className="input max-w-xs" placeholder={t('module')} value={filter.module} onChange={(e) => setFilter({ ...filter, module: e.target.value })} />
          <input className="input max-w-xs" placeholder={t('action')} value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })} />
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

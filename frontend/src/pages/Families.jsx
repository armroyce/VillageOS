import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import PermissionGate from '../components/PermissionGate';

export default function Families() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [ward, setWard] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await api.get('/families', { params: { page, limit: 20, search, ward } });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, ward]);

  const columns = [
    { key: 'family_head_name', label: t('family_head') },
    { key: 'ward_number', label: t('ward') },
    { key: 'address', label: t('address') },
    {
      key: 'members',
      label: t('members'),
      render: (row) => <span className="badge-green">{row.members?.length || 0}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/families/${row.id}`} className="text-primary text-xs hover:underline">View →</Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('families')}</h1>
        <PermissionGate permission="FAMILY_CREATE">
          <Link to="/families/new" className="btn-primary text-sm">+ {t('add_family')}</Link>
        </PermissionGate>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            className="input max-w-xs"
            placeholder={t('search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            className="input max-w-xs"
            placeholder={t('ward')}
            value={ward}
            onChange={(e) => setWard(e.target.value)}
          />
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

export default function SuperDashboard() {
  const { t } = useTranslation();
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/super/villages')
      .then((res) => { setVillages(res.data.data || []); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.error?.message || 'Failed to load villages'); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <Link to="/super/villages" className="btn-primary text-sm">Manage Villages →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary">{villages.length}</p>
          <p className="text-sm text-slate-500 mt-1">{t('villages')}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent">{villages.filter((v) => v.is_active).length}</p>
          <p className="text-sm text-slate-500 mt-1">Active Villages</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-500">{villages.filter((v) => v.subscription?.plan === 'standard').length}</p>
          <p className="text-sm text-slate-500 mt-1">Standard Plan</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">{t('villages')}</h2>
        {loading ? (
          <p className="text-slate-400 py-4 text-center">{t('loading')}</p>
        ) : error ? (
          <p className="text-red-500 py-4 text-center">{error}</p>
        ) : villages.length === 0 ? (
          <p className="text-slate-400 py-4 text-center">No villages found. Create your first village →</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 font-medium text-slate-600">Name</th>
              <th className="text-left py-2 font-medium text-slate-600">Subdomain</th>
              <th className="text-left py-2 font-medium text-slate-600">Plan</th>
              <th className="text-left py-2 font-medium text-slate-600">Status</th>
            </tr></thead>
            <tbody>
              {villages.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 font-medium">{v.name}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">{v.subdomain}</td>
                  <td className="py-2"><span className="badge-green">{v.subscription?.plan || 'free'}</span></td>
                  <td className="py-2">{v.is_active ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

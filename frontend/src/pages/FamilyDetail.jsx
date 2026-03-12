import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import PermissionGate from '../components/PermissionGate';

export default function FamilyDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/families/${id}`).then((res) => { setFamily(res.data.data); setLoading(false); });
  }, [id]);

  if (loading) return <p className="text-slate-400">{t('loading')}</p>;
  if (!family) return <p>Not found</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{family.family_head_name}</h1>
        <Link to="/families" className="text-sm text-slate-500 hover:underline">← Back</Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">{t('ward')}</span><p className="font-medium">{family.ward_number || '—'}</p></div>
          <div><span className="text-slate-500">{t('address')}</span><p className="font-medium">{family.address || '—'}</p></div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t('members')}</h2>
          <PermissionGate permission="FAMILY_CREATE">
            <Link to={`/members/new/${id}`} className="btn-primary text-xs">+ Add</Link>
          </PermissionGate>
        </div>
        {family.members?.length === 0 ? (
          <p className="text-slate-400 text-sm">{t('no_data')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 font-medium text-slate-600">{t('name')}</th>
              <th className="text-left py-2 font-medium text-slate-600">{t('age')}</th>
              <th className="text-left py-2 font-medium text-slate-600">{t('gender')}</th>
              <th className="text-left py-2 font-medium text-slate-600">{t('relation')}</th>
              <th className="text-left py-2 font-medium text-slate-600">{t('voter')}</th>
            </tr></thead>
            <tbody>
              {family.members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2">{m.name}</td>
                  <td className="py-2">{m.age || '—'}</td>
                  <td className="py-2">{m.gender || '—'}</td>
                  <td className="py-2">{m.relation || '—'}</td>
                  <td className="py-2">{m.is_voter ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

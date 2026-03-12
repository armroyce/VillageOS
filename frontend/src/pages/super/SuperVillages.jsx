import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function SuperVillages() {
  const { t } = useTranslation();
  const [villages, setVillages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subdomain: '', db_connection_string: '', theme_color: '#1B4D3E', language_default: 'en', plan: 'free' });

  async function load() {
    const res = await api.get('/super/villages');
    setVillages(res.data.data);
  }
  useEffect(() => { load(); }, []);

  async function createVillage(e) {
    e.preventDefault();
    try {
      await api.post('/super/villages', form);
      toast.success('Village created and DB provisioned!');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  async function toggleActive(village) {
    await api.put(`/super/villages/${village.id}`, { is_active: !village.is_active });
    toast.success('Updated');
    load();
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('villages')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ {t('create_village')}</button>
      </div>

      {showForm && (
        <div className="card max-w-lg">
          <h2 className="font-semibold mb-4">{t('create_village')}</h2>
          <form onSubmit={createVillage} className="space-y-3">
            <input className="input" placeholder="Village name" value={form.name} onChange={set('name')} />
            <input className="input" placeholder="subdomain (e.g. village-03)" value={form.subdomain} onChange={set('subdomain')} />
            <input className="input" placeholder="PostgreSQL connection string" value={form.db_connection_string} onChange={set('db_connection_string')} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.plan} onChange={set('plan')}>
                <option value="free">{t('free')}</option>
                <option value="standard">{t('standard')}</option>
                <option value="premium">{t('premium')}</option>
              </select>
              <select className="input" value={form.language_default} onChange={set('language_default')}>
                <option value="en">{t('english')}</option>
                <option value="ta">{t('tamil')}</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">{t('save')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2 font-medium text-slate-600">Name</th><th className="text-left py-2 font-medium text-slate-600">Subdomain</th><th className="text-left py-2 font-medium text-slate-600">Plan</th><th className="text-left py-2 font-medium text-slate-600">Status</th><th /></tr></thead>
          <tbody>
            {villages.map((v) => (
              <tr key={v.id} className="border-b border-slate-100">
                <td className="py-2">{v.name}</td>
                <td className="py-2 font-mono text-xs">{v.subdomain}</td>
                <td className="py-2"><span className="badge-green">{v.subscription?.plan || 'free'}</span></td>
                <td className="py-2">{v.is_active ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                <td className="py-2"><button onClick={() => toggleActive(v)} className="text-xs text-slate-500 hover:underline">{v.is_active ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

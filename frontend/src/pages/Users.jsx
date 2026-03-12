import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import Table from '../components/Table';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });

  async function load() {
    const [uRes, rRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
    setUsers(uRes.data.data);
    setRoles(rRes.data.data);
  }
  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('User created');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role_id: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Error'); }
  }

  async function deactivate(id) {
    await api.delete(`/users/${id}`);
    toast.success('User deactivated');
    load();
  }

  const columns = [
    { key: 'name', label: t('name') },
    { key: 'email', label: t('email') },
    { key: 'role', label: t('role'), render: (r) => r.role?.name || '—' },
    { key: 'is_active', label: t('status'), render: (r) => r.is_active ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span> },
    {
      key: 'actions', label: '',
      render: (r) => r.is_active ? (
        <PermissionGate permission="USER_EDIT">
          <button onClick={() => deactivate(r.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>
        </PermissionGate>
      ) : null
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('users')}</h1>
        <PermissionGate permission="USER_CREATE">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ {t('create_user')}</button>
        </PermissionGate>
      </div>

      {showForm && (
        <div className="card max-w-md">
          <form onSubmit={createUser} className="space-y-3">
            <input className="input" placeholder={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" className="input" placeholder={t('email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" className="input" placeholder={t('password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="input" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">— {t('role')} —</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">{t('save')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <Table columns={columns} data={users} />
      </div>
    </div>
  );
}

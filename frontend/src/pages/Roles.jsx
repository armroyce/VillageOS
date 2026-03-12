import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';

const ALL_PERMISSIONS = [
  'FAMILY_VIEW','FAMILY_CREATE','FAMILY_EDIT','FAMILY_DELETE',
  'TAX_VIEW','TAX_CREATE',
  'EXPENSE_VIEW','EXPENSE_CREATE','EXPENSE_APPROVE',
  'ROLE_VIEW','ROLE_MANAGE',
  'USER_VIEW','USER_CREATE','USER_EDIT',
  'AUDIT_VIEW',
];

export default function Roles() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [perms, setPerms] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await api.get('/roles');
    setRoles(res.data.data);
  }
  useEffect(() => { load(); }, []);

  function selectRole(role) {
    setSelected(role);
    setPerms(role.permissions?.map((p) => p.permission_key) || []);
  }

  function togglePerm(key) {
    setPerms((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function savePerms() {
    try {
      await api.post(`/roles/${selected.id}/permissions`, { permission_keys: perms });
      toast.success('Permissions saved');
      load();
    } catch (err) { toast.error('Error'); }
  }

  async function createRole(e) {
    e.preventDefault();
    if (!newRoleName) return;
    try {
      await api.post('/roles', { name: newRoleName });
      toast.success('Role created');
      setNewRoleName('');
      setShowForm(false);
      load();
    } catch (err) { toast.error('Error'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('roles')}</h1>
        <PermissionGate permission="ROLE_MANAGE">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ {t('create_role')}</button>
        </PermissionGate>
      </div>

      {showForm && (
        <div className="card max-w-sm">
          <form onSubmit={createRole} className="flex gap-3">
            <input className="input flex-1" placeholder="Role name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
            <button type="submit" className="btn-primary">{t('save')}</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-3 text-sm">{t('roles')}</h2>
          <ul className="space-y-2">
            {roles.map((r) => (
              <li key={r.id}>
                <button onClick={() => selectRole(r)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selected?.id === r.id ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}>
                  {r.name}
                  <span className="ml-2 text-xs opacity-60">{r.permissions?.length || 0} perms</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selected && (
          <div className="card lg:col-span-2">
            <h2 className="font-semibold mb-3 text-sm">{t('assign_permissions')} — {selected.name}</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ALL_PERMISSIONS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={perms.includes(key)} onChange={() => togglePerm(key)} className="w-4 h-4" />
                  <span>{key}</span>
                </label>
              ))}
            </div>
            <PermissionGate permission="ROLE_MANAGE">
              <button onClick={savePerms} className="btn-primary">{t('save')}</button>
            </PermissionGate>
          </div>
        )}
      </div>
    </div>
  );
}

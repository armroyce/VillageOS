import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function SuperSettings() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setPwForm({ ...pwForm, [k]: e.target.value });

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/super-admin/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account Info */}
      <div className="card">
        <h2 className="font-semibold text-base mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4 py-2 border-b border-slate-100">
            <span className="w-32 text-slate-500 font-medium">Name</span>
            <span className="font-semibold text-slate-800">{user?.name}</span>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-slate-100">
            <span className="w-32 text-slate-500 font-medium">Email</span>
            <span className="text-slate-800">{user?.email}</span>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-slate-100">
            <span className="w-32 text-slate-500 font-medium">Role</span>
            <span className="inline-flex items-center gap-1">
              <span className="badge-green">Super Admin</span>
              {user?.is_root && <span className="badge-green bg-purple-100 text-purple-700">Root</span>}
            </span>
          </div>
          <div className="flex items-center gap-4 py-2">
            <span className="w-32 text-slate-500 font-medium">User ID</span>
            <span className="font-mono text-xs text-slate-400">{user?.id}</span>
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div className="card">
        <h2 className="font-semibold text-base mb-4">Platform Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4 py-2 border-b border-slate-100">
            <span className="w-32 text-slate-500 font-medium">Platform</span>
            <span className="text-slate-800 font-semibold">VillageOS v1.0</span>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-slate-100">
            <span className="w-32 text-slate-500 font-medium">Backend</span>
            <span className="text-slate-800">Node.js + Express + Sequelize</span>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-slate-100">
            <span className="w-32 text-slate-500 font-medium">Database</span>
            <span className="text-slate-800">PostgreSQL on Neon.tech (Silo Model)</span>
          </div>
          <div className="flex items-center gap-4 py-2">
            <span className="w-32 text-slate-500 font-medium">Hosting</span>
            <span className="text-slate-800">Render (API) + Netlify (Frontend)</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="font-semibold text-base mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Current Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter current password"
              value={pwForm.current_password}
              onChange={set('current_password')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter new password"
              value={pwForm.new_password}
              onChange={set('new_password')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Confirm new password"
              value={pwForm.confirm_password}
              onChange={set('confirm_password')}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SuperLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password, null, true);
      navigate('/super/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🔐</span>
          <h1 className="text-2xl font-bold text-white mt-2">VillageOS</h1>
          <p className="text-slate-400 text-sm mt-1">{t('super_login')}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t('email')}</label>
              <input type="email" className="input bg-slate-700 border-slate-600 text-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t('password')}</label>
              <input type="password" className="input bg-slate-700 border-slate-600 text-white" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : t('login')}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-4">
            <a href="/login" className="hover:text-slate-300">← Village Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

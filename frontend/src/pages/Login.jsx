import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', village_id: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.email) e.email = 'Email required';
    if (!form.password) e.password = 'Password required';
    if (!form.village_id) e.village_id = 'Village ID required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password, form.village_id, false);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🌳</span>
          <h1 className="text-2xl font-bold text-primary mt-2">{t('app_name')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('village_login')}</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('village_id')}</label>
              <input
                type="text"
                className="input"
                placeholder="village-01"
                value={form.village_id}
                onChange={(e) => setForm({ ...form, village_id: e.target.value })}
              />
              {errors.village_id && <p className="text-red-500 text-xs mt-1">{errors.village_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : t('login')}
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-4">
            <a href="/super/login" className="text-primary hover:underline">Super Admin →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['road', 'temple', 'water', 'electricity', 'sanitation', 'education', 'other'];

export default function ExpenseNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ title: '', amount: '', category: 'road', expense_date: today });
  const [file, setFile] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('bill', file);
    try {
      await api.post('/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Expense submitted');
      navigate('/expenses');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('new_expense')}</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('title')}</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">{t('amount')} (₹)</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('category')}</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('date')}</label>
            <input type="date" className="input" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('upload_bill')}</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setFile(e.target.files[0])} />
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 5MB</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{t('submit')}</button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

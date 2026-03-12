import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function TaxCollect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [families, setFamilies] = useState([]);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ family_id: '', amount: '', type: 'house_tax', collected_date: today });
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.get('/families?limit=200').then((res) => setFamilies(res.data.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.family_id || !form.amount) { toast.error('All fields required'); return; }
    try {
      const res = await api.post('/tax', form);
      setReceipt(res.data.data);
      toast.success('Tax collected! Receipt: ' + res.data.data.receipt_number);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('collect_tax')}</h1>

      {!receipt ? (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('families')}</label>
              <select className="input" value={form.family_id} onChange={set('family_id')}>
                <option value="">— Select Family —</option>
                {families.map((f) => <option key={f.id} value={f.id}>{f.family_head_name} ({f.ward_number})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('type')}</label>
              <select className="input" value={form.type} onChange={set('type')}>
                <option value="house_tax">{t('house_tax')}</option>
                <option value="festival">{t('festival')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('amount')} (₹)</label>
              <input type="number" className="input" value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('date')}</label>
              <input type="date" className="input" value={form.collected_date} onChange={set('collected_date')} />
            </div>
            <button type="submit" className="btn-primary w-full">{t('collect_tax')}</button>
          </form>
        </div>
      ) : (
        <div className="card border-2 border-accent" id="receipt-print">
          <div className="text-center space-y-2">
            <p className="text-2xl">🌳</p>
            <h2 className="text-xl font-bold text-primary">VillageOS</h2>
            <p className="text-slate-500 text-sm">Tax Collection Receipt</p>
          </div>
          <hr className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t('receipt')}</span><span className="font-mono font-bold">{receipt.receipt_number}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('type')}</span><span>{t(receipt.type)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('amount')}</span><span className="font-bold text-primary">₹{receipt.amount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('date')}</span><span>{new Date(receipt.collectedAt || receipt.collected_at).toLocaleString()}</span></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => window.print()} className="btn-secondary flex-1">{t('print')}</button>
            <button onClick={() => navigate('/tax')} className="btn-primary flex-1">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

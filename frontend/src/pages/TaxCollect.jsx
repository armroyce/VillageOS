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
  const [familyId, setFamilyId] = useState('');
  const [pendingDues, setPendingDues] = useState([]);
  const [loadingDues, setLoadingDues] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null); // pending due being collected
  const [form, setForm] = useState({ amount: '', type: 'house_tax', collected_date: today });
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.get('/families?limit=200').then((res) => setFamilies(res.data.data));
  }, []);

  async function handleFamilyChange(id) {
    setFamilyId(id);
    setSelectedDue(null);
    setForm({ amount: '', type: 'house_tax', collected_date: today });
    if (!id) { setPendingDues([]); return; }
    setLoadingDues(true);
    try {
      const res = await api.get(`/tax/family/${id}/dues`);
      setPendingDues(res.data.data || []);
    } catch {
      setPendingDues([]);
    } finally {
      setLoadingDues(false);
    }
  }

  function selectDue(due) {
    setSelectedDue(due);
    setForm({ amount: parseFloat(due.amount).toFixed(0), type: due.type, collected_date: today });
  }

  function clearDueSelection() {
    setSelectedDue(null);
    setForm({ amount: '', type: 'house_tax', collected_date: today });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!familyId || !form.amount) { toast.error('All fields required'); return; }
    try {
      const payload = {
        family_id: familyId,
        amount: form.amount,
        type: form.type,
        collected_date: form.collected_date,
        ...(selectedDue && { tax_ledger_id: selectedDue.id }),
      };
      const res = await api.post('/tax', payload);
      setReceipt(res.data.data);
      toast.success('Tax collected! Receipt: ' + res.data.data.receipt_number);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const selectedFamily = families.find((f) => f.id === parseInt(familyId));

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('collect_tax')}</h1>

      {!receipt ? (
        <>
          {/* Family selector */}
          <div className="card">
            <label className="block text-sm font-medium mb-1">{t('families')}</label>
            <select
              className="input"
              value={familyId}
              onChange={(e) => handleFamilyChange(e.target.value)}
            >
              <option value="">— Select Family —</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.family_name ? `${f.family_name} — ` : ''}{f.family_head_name}{f.ward_number ? ` (Ward ${f.ward_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Pending dues for selected family */}
          {familyId && (
            <div className="card border-l-4 border-yellow-400">
              <h2 className="font-semibold mb-3 text-yellow-700">
                Pending Dues
                {loadingDues && <span className="text-xs text-slate-400 ml-2">Loading…</span>}
              </h2>
              {!loadingDues && pendingDues.length === 0 && (
                <p className="text-sm text-slate-400">No pending dues — you can record a new ad-hoc collection below.</p>
              )}
              {pendingDues.map((due) => (
                <div
                  key={due.id}
                  className={`flex items-center justify-between p-2 rounded mb-2 cursor-pointer border ${
                    selectedDue?.id === due.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => selectedDue?.id === due.id ? clearDueSelection() : selectDue(due)}
                >
                  <div>
                    <p className="text-sm font-medium">{due.description || '—'}</p>
                    <p className="text-xs text-slate-500">
                      <span className={due.type === 'house_tax' ? 'badge-green' : 'badge-yellow'}>{t(due.type)}</span>
                      <span className="ml-2 text-red-600 font-semibold">₹{parseFloat(due.amount).toFixed(0)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`text-xs px-3 py-1 rounded font-medium ${
                      selectedDue?.id === due.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selectedDue?.id === due.id ? 'Selected ✓' : 'Collect'}
                  </button>
                </div>
              ))}
              {pendingDues.length > 0 && !selectedDue && (
                <p className="text-xs text-slate-400 mt-2">Select a due above to collect it, or scroll down to record a new collection.</p>
              )}
            </div>
          )}

          {/* Collection form */}
          {familyId && (
            <div className="card">
              <h2 className="font-semibold mb-3">
                {selectedDue ? (
                  <span className="text-primary">Collecting: {selectedDue.description}</span>
                ) : (
                  'New Collection'
                )}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('type')}</label>
                  <select className="input" value={form.type} onChange={set('type')} disabled={!!selectedDue}>
                    <option value="house_tax">{t('house_tax')}</option>
                    <option value="festival">{t('festival')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('amount')} (₹)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.amount}
                    onChange={set('amount')}
                    placeholder={selectedDue ? '' : 'Enter amount'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('date')}</label>
                  <input type="date" className="input" value={form.collected_date} onChange={set('collected_date')} />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">{t('collect_tax')}</button>
                  {selectedDue && (
                    <button type="button" onClick={clearDueSelection} className="btn-secondary">
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </>
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
            <div className="flex justify-between"><span className="text-slate-500">{t('family')}</span><span>{selectedFamily?.family_head_name || '—'}</span></div>
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

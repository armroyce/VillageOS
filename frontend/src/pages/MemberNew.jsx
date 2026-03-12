import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function MemberNew() {
  const { t } = useTranslation();
  const { familyId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', gender: 'male', relation: 'head', aadhaar_last4: '', is_voter: false });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) { toast.error('Name required'); return; }
    try {
      await api.post(`/families/${familyId}/members`, form);
      toast.success('Member added');
      navigate(`/families/${familyId}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Add {t('members')}</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('name')}</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">{t('age')}</label><input type="number" className="input" value={form.age} onChange={set('age')} /></div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('gender')}</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('relation')}</label>
            <select className="input" value={form.relation} onChange={set('relation')}>
              {['head','spouse','child','parent','other'].map((r) => <option key={r} value={r}>{t(r)}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">{t('aadhaar')}</label><input maxLength={4} className="input" value={form.aadhaar_last4} onChange={set('aadhaar_last4')} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="voter" checked={form.is_voter} onChange={set('is_voter')} className="w-4 h-4" />
            <label htmlFor="voter" className="text-sm">{t('voter')}</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{t('save')}</button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

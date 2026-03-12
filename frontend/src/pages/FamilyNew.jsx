import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function FamilyNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ family_head_name: '', address: '', ward_number: '' });
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.family_head_name) { setErrors({ family_head_name: 'Required' }); return; }
    try {
      await api.post('/families', form);
      toast.success('Family added');
      navigate('/families');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('add_family')}</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('family_head')}</label>
            <input className="input" value={form.family_head_name} onChange={(e) => setForm({ ...form, family_head_name: e.target.value })} />
            {errors.family_head_name && <p className="text-red-500 text-xs mt-1">{errors.family_head_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('ward')}</label>
            <input className="input" value={form.ward_number} onChange={(e) => setForm({ ...form, ward_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('address')}</label>
            <textarea className="input" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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

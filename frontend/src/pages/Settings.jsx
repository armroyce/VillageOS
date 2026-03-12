import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { village } = useAuth();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get('/config').then((res) => setConfig(res.data.data));
  }, []);

  if (!config) return <p className="text-slate-400">{t('loading')}</p>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('settings')}</h1>
      <div className="card space-y-4">
        <h2 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">Village Info</h2>
        <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{config.name}</p></div>
        <div><p className="text-sm text-slate-500">Subdomain</p><p className="font-mono text-sm">{config.subdomain}</p></div>
        <div><p className="text-sm text-slate-500">Theme Color</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: config.theme_color }} />
            <span className="text-sm font-mono">{config.theme_color}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-2">{t('language')}</p>
          <div className="flex gap-2">
            <button onClick={() => i18n.changeLanguage('en')} className={`px-4 py-2 rounded-lg text-sm ${i18n.language === 'en' ? 'bg-primary text-white' : 'border border-primary text-primary'}`}>
              🇬🇧 {t('english')}
            </button>
            <button onClick={() => i18n.changeLanguage('ta')} className={`px-4 py-2 rounded-lg text-sm ${i18n.language === 'ta' ? 'bg-primary text-white' : 'border border-primary text-primary'}`}>
              🇮🇳 {t('tamil')}
            </button>
          </div>
        </div>
        {config.logo_url && (
          <div><p className="text-sm text-slate-500">Logo</p><img src={config.logo_url} className="h-12 mt-1 rounded" alt="logo" /></div>
        )}
      </div>
    </div>
  );
}

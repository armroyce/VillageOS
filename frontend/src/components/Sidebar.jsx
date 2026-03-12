import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const villageNavItems = [
  { key: 'dashboard', path: '/dashboard', perm: null, icon: '🏠' },
  { key: 'families', path: '/families', perm: 'FAMILY_VIEW', icon: '👨‍👩‍👧' },
  { key: 'tax', path: '/tax', perm: 'TAX_VIEW', icon: '💰' },
  { key: 'expenses', path: '/expenses', perm: 'EXPENSE_VIEW', icon: '📋' },
  { key: 'roles', path: '/roles', perm: 'ROLE_VIEW', icon: '🔑' },
  { key: 'users', path: '/users', perm: 'USER_VIEW', icon: '👤' },
  { key: 'audit', path: '/audit', perm: 'AUDIT_VIEW', icon: '📝' },
  { key: 'reports', path: '/reports', perm: 'AUDIT_VIEW', icon: '📊' },
  { key: 'settings', path: '/settings', perm: null, icon: '⚙️' },
];

const superNavItems = [
  { key: 'dashboard', path: '/super/dashboard', perm: null, icon: '🏠' },
  { key: 'villages', path: '/super/villages', perm: null, icon: '🌳' },
  { key: 'settings', path: '/super/settings', perm: null, icon: '⚙️' },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, village, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(user?.is_super_admin ? '/super/login' : '/login');
    toast.success('Logged out');
  }

  const navItems = user?.is_super_admin ? superNavItems : villageNavItems;
  const visibleItems = navItems.filter((item) => !item.perm || hasPermission(item.perm));

  return (
    <aside className="w-64 min-h-screen bg-primary flex flex-col text-white">
      <div className="p-5 border-b border-primary-light">
        <div className="flex items-center gap-2">
          {village?.logo_url ? (
            <img src={village.logo_url} className="w-8 h-8 rounded-full" alt="logo" />
          ) : (
            <span className="text-2xl">🌳</span>
          )}
          <div>
            <p className="font-bold text-sm">{t('app_name')}</p>
            {village && <p className="text-xs text-accent">{village.name}</p>}
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive ? 'bg-primary-light text-white font-semibold' : 'text-white/80 hover:bg-primary-light/50'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-light space-y-2">
        {/* Language toggle */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`flex-1 py-1 rounded ${i18n.language === 'en' ? 'bg-accent' : 'bg-primary-light'}`}
          >
            EN
          </button>
          <button
            onClick={() => i18n.changeLanguage('ta')}
            className={`flex-1 py-1 rounded ${i18n.language === 'ta' ? 'bg-accent' : 'bg-primary-light'}`}
          >
            தமிழ்
          </button>
        </div>
        <div className="text-xs text-white/60">{user?.name}</div>
        <button onClick={handleLogout} className="w-full text-xs text-left text-white/70 hover:text-white">
          {t('logout')} →
        </button>
      </div>
    </aside>
  );
}

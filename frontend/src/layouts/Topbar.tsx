import { Sun, Moon, Bell, LogOut } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocation, useNavigate } from 'react-router-dom';

const pageTitles: Record<string, [string, string]> = {
  '/':                ['Dashboard',       'Home / Dashboard'],
  '/devices':         ['Device Management','Home / Devices'],
  '/traffic':         ['Traffic Monitor',  'Home / Traffic'],
  '/attack-pipeline': ['Attack Pipeline',  'Home / Attack Pipeline'],
  '/fl-training':     ['FL Training',      'Home / FL Training'],
  '/prevention':      ['Prevention',       'Home / Prevention'],
  '/settings':        ['Settings',         'Home / Settings'],
};

export default function Topbar() {
  const { theme, toggle } = useThemeStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [title, breadcrumb] = pageTitles[location.pathname] ?? ['Dashboard', 'Home'];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header
      className="flex items-center justify-between sticky top-0 z-30"
      style={{
        height: 'var(--topbar-height)',
        padding: '0 28px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Title + Breadcrumb */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {title}
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{breadcrumb}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Last Updated */}
        <span
          className="hidden lg:block mr-3"
          style={{ fontSize: 11, color: 'var(--text-muted)' }}
        >
          Last updated: Just now
        </span>

        {/* Theme Toggle */}
        <button onClick={toggle} className="btn-ghost" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark'
            ? <Sun style={{ width: 18, height: 18 }} />
            : <Moon style={{ width: 18, height: 18 }} />
          }
        </button>

        {/* Notification Bell */}
        <button className="btn-ghost relative">
          <Bell style={{ width: 18, height: 18 }} />
          <span
            className="absolute rounded-full"
            style={{ top: 6, right: 6, width: 7, height: 7, background: 'var(--danger)', border: '2px solid var(--bg-card)' }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 8px' }} />

        {/* User — clickable, navigates to settings/profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="Open profile settings"
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 34, height: 34, background: 'var(--accent)', fontSize: 13, fontWeight: 700, color: '#fff' }}
            >
              {(user?.username?.[0] ?? 'A').toUpperCase()}
            </div>
            <div className="hidden sm:block" style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {user?.username ?? 'Admin'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role ?? 'admin'}
              </p>
            </div>
          </button>
          <button onClick={handleLogout} className="btn-ghost" title="Logout"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </header>
  );
}

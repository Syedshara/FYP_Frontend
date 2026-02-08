import { Sun, Moon, Bell, LogOut, User } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

export default function Topbar() {
  const { theme, toggle } = useThemeStore();
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page context */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Proactive Privacy-Preserving IDS
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--danger)] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[var(--text-primary)]">{user?.username ?? 'Admin'}</p>
            <p className="text-xs text-[var(--text-muted)]">{user?.role ?? 'admin'}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}

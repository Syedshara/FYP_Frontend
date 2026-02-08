import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <Topbar />

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] px-6 py-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>© 2026 Proactive Privacy-Preserving IDS</span>
          <div className="flex items-center gap-2">
            <span className="status-dot status-online" />
            <span>Connected</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

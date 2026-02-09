import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <Topbar />

        <main className="flex-1 overflow-auto" style={{ padding: '24px 28px' }}>
          <div className="animate-fade-in" style={{ maxWidth: 1600, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>

        <footer
          className="flex items-center justify-between"
          style={{
            padding: '10px 28px',
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>IoT IDS Platform &copy; 2026</span>
          <div className="flex items-center gap-2">
            <span className="status-dot status-online" />
            System Online
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

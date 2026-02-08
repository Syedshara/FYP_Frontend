import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Save } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [threshold, setThreshold] = useState(0.5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Configure platform preferences</p>
      </motion.div>

      {/* Model Configuration */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Model Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Active Model</label>
            <select className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm">
              <option>global_final.pt</option>
              <option>cnn_lstm_global_with_HE_25rounds_16k.pt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Detection Threshold: <span className="font-mono text-[var(--accent)]">{threshold}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>0 (Sensitive)</span>
              <span>1 (Strict)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--text-muted)]">Sequence Length</span>
              <p className="text-[var(--text-primary)] font-mono">10 (fixed)</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Features</span>
              <p className="text-[var(--text-primary)] font-mono">78 (fixed)</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backend Connection */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Backend Connection</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">API URL</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="status-dot status-online" />
            <span className="text-green-500">Connected</span>
          </div>
        </div>
      </motion.div>

      {/* User Preferences */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">User Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  theme === 'light'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  theme === 'dark'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Dashboard Refresh Rate</label>
            <select defaultValue="5" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm">
              <option value="1">1 second</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Save */}
      <motion.div variants={item}>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm transition-colors">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </motion.div>
    </motion.div>
  );
}

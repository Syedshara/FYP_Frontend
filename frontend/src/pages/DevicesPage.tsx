import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Monitor as MonitorIcon, Loader2, Trash2, Edit3, Activity,
} from 'lucide-react';
import { devicesApi } from '@/api/devices';
import type { Device, DeviceCreate } from '@/types';
import { cn, getStatusDotClass, formatRelativeTime } from '@/lib/utils';

const DEVICE_TYPES = ['sensor', 'camera', 'gateway', 'actuator', 'smart_plug', 'custom'];
const PROTOCOLS = ['mqtt', 'coap', 'http', 'tcp', 'udp'];
const TRAFFIC_SOURCES = ['simulated', 'live_capture', 'pcap_upload'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);

  const load = async () => {
    try {
      const d = await devicesApi.list();
      setDevices(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.ip_address ?? '').includes(search);
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this device?')) return;
    await devicesApi.delete(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Device Management</h1>
          <p className="text-sm text-[var(--text-muted)]">{devices.length} devices registered</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditDevice(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Device
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="under_attack">Under Attack</option>
          <option value="quarantined">Quarantined</option>
        </select>
      </motion.div>

      {/* Device Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MonitorIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No devices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((device) => (
            <motion.div
              key={device.id}
              variants={item}
              layout
              className="card p-5 flex flex-col"
            >
              {/* Device Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={getStatusDotClass(device.status)} />
                  <h3 className="font-semibold text-[var(--text-primary)]">{device.name}</h3>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  device.status === 'online' ? 'bg-green-500/10 text-green-500' :
                  device.status === 'under_attack' ? 'bg-red-500/10 text-red-500' :
                  device.status === 'quarantined' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-gray-500/10 text-gray-400'
                )}>
                  {device.status}
                </span>
              </div>

              {/* Device Details */}
              <div className="space-y-1.5 text-sm flex-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Type</span>
                  <span className="text-[var(--text-primary)] capitalize">{device.device_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">IP</span>
                  <span className="text-[var(--text-primary)] font-mono text-xs">{device.ip_address ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Protocol</span>
                  <span className="text-[var(--text-primary)] uppercase">{device.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Port</span>
                  <span className="text-[var(--text-primary)]">{device.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Last Seen</span>
                  <span className="text-[var(--text-primary)]">
                    {device.last_seen_at ? formatRelativeTime(device.last_seen_at) : 'Never'}
                  </span>
                </div>
                {device.threat_count_today > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Threats Today</span>
                    <span className="text-red-500 font-medium">{device.threat_count_today}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors">
                  <Activity className="w-3.5 h-3.5" /> Monitor
                </button>
                <button
                  onClick={() => { setEditDevice(device); setShowModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(device.id)}
                  className="flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <DeviceModal
            device={editDevice}
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); load(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Modal ──────────────────────────────────────────────── */
function DeviceModal({
  device,
  onClose,
  onSaved,
}: {
  device: Device | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!device;
  const [form, setForm] = useState<DeviceCreate>({
    name: device?.name ?? '',
    device_type: device?.device_type ?? 'sensor',
    ip_address: device?.ip_address ?? '',
    protocol: device?.protocol ?? 'tcp',
    port: device?.port ?? 0,
    traffic_source: device?.traffic_source ?? 'simulated',
    description: device?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await devicesApi.update(device!.id, form);
      } else {
        await devicesApi.create(form);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {isEdit ? 'Edit Device' : 'Add New Device'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Device Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="e.g., Camera_03"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Device Type</label>
              <select
                value={form.device_type}
                onChange={(e) => setForm({ ...form, device_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Protocol */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Protocol</label>
              <select
                value={form.protocol}
                onChange={(e) => setForm({ ...form, protocol: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {PROTOCOLS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* IP */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">IP Address</label>
              <input
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="192.168.1.x"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Port</label>
              <input
                type="number"
                min={0}
                max={65535}
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          {/* Traffic Source */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Traffic Source</label>
            <select
              value={form.traffic_source}
              onChange={(e) => setForm({ ...form, traffic_source: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {TRAFFIC_SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors text-sm"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Update' : 'Add Device'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

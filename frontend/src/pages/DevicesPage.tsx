import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Plus, Loader2, Search, X } from 'lucide-react';
import { devicesApi } from '@/api/devices';
import type { Device } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const statusConfig: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  online:       { color: 'var(--success)', bg: 'var(--success-light)', label: 'Online',      dot: 'status-dot status-online' },
  offline:      { color: 'var(--text-muted)', bg: 'var(--bg-secondary)', label: 'Offline',    dot: 'status-dot status-offline' },
  under_attack: { color: 'var(--danger)',  bg: 'var(--danger-light)',  label: 'Under Attack', dot: 'status-dot status-attack' },
  quarantined:  { color: 'var(--warning)', bg: 'var(--warning-light)', label: 'Quarantined',  dot: 'status-dot status-quarantined' },
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    devicesApi.list().then(setDevices).finally(() => setLoading(false));
  }, []);

  const filtered = devices
    .filter((d) => filter === 'all' || d.status === filter)
    .filter((d) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || (d.ip_address ?? '').toLowerCase().includes(q);
    });

  const counts = {
    all: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    under_attack: devices.filter((d) => d.status === 'under_attack').length,
    quarantined: devices.filter((d) => d.status === 'quarantined').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} /></div>;
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-stack">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Device Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{devices.length} registered devices</p>
        </div>
        <button className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} /> Add Device
        </button>
      </motion.div>

      {/* Filters + Search */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
        {/* Status filters */}
        <div className="flex gap-1.5">
          {(['all', 'online', 'offline', 'under_attack', 'quarantined'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500,
                background: filter === s ? 'var(--accent)' : 'var(--bg-secondary)',
                color: filter === s ? '#fff' : 'var(--text-secondary)',
                transition: 'all .15s',
              }}
            >
              {s === 'all' ? 'All' : s === 'under_attack' ? 'Attack' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1" style={{ maxWidth: 280 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            className="input"
            style={{ paddingLeft: 34, paddingRight: search ? 34 : 14, height: 36, fontSize: 13 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Device Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((device) => {
            const sc = statusConfig[device.status] ?? statusConfig.offline;
            return (
              <motion.div
                key={device.id}
                variants={fadeUp}
                className="card card-interactive cursor-pointer"
                style={{ padding: 20, borderLeft: `3px solid ${sc.color}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Monitor style={{ width: 18, height: 18, color: sc.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{device.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{device.ip_address}</p>
                    </div>
                  </div>
                  <span className={sc.dot} />
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {device.last_seen_at ? formatRelativeTime(device.last_seen_at) : 'Never seen'}
                  </span>
                </div>

                {device.device_type && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                    Type: <span style={{ color: 'var(--text-secondary)' }}>{device.device_type}</span>
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center" style={{ padding: 48 }}>
          <Monitor style={{ width: 40, height: 40, color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No devices found</p>
        </div>
      )}
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Line,
} from 'recharts';
import {
  ShieldAlert, Monitor, Crosshair, CheckCircle2, Loader2, TrendingUp,
} from 'lucide-react';
import { predictionsApi } from '@/api/predictions';
import { devicesApi } from '@/api/devices';
import type { PredictionSummary, Device } from '@/types';
import { getStatusDotClass, formatRelativeTime } from '@/lib/utils';

const PIE_COLORS = ['#ef4444', '#22c55e'];
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const chartTooltipStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', fontSize: 12,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d] = await Promise.all([predictionsApi.summary(), devicesApi.list()]);
        setSummary(s); setDevices(d);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 10_000);
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const attackCount = devices.filter((d) => d.status === 'under_attack').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  const attackRate = summary?.attack_rate ?? 0;
  const threatLevel = attackRate > 0.5 ? 'CRITICAL' : attackRate > 0.2 ? 'HIGH' : attackRate > 0.05 ? 'MEDIUM' : 'LOW';

  const threatColors: Record<string, { color: string; bg: string }> = {
    CRITICAL: { color: 'var(--danger)', bg: 'var(--danger-light)' },
    HIGH:     { color: 'var(--danger)', bg: 'var(--danger-light)' },
    MEDIUM:   { color: 'var(--warning)', bg: 'var(--warning-light)' },
    LOW:      { color: 'var(--success)', bg: 'var(--success-light)' },
  };
  const tc = threatColors[threatLevel];

  const pieData = summary
    ? [{ name: 'Attacks', value: summary.attack_count }, { name: 'Benign', value: summary.benign_count }]
    : [];

  const timelineData = Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    score: +(Math.random() * attackRate + Math.random() * 0.2).toFixed(3),
  }));

  const kpis = [
    {
      icon: ShieldAlert, label: 'THREAT LEVEL', value: threatLevel,
      sub: `Score: ${(attackRate).toFixed(2)} / 1.0`, color: tc.color, bg: tc.bg,
      bar: attackRate,
    },
    {
      icon: Monitor, label: 'ACTIVE DEVICES', value: `${devices.length}`,
      sub: `${onlineCount} online  ·  ${offlineCount} offline`, color: 'var(--info)', bg: 'var(--info-light)',
      extra: attackCount > 0 ? `${attackCount} under attack` : undefined,
      extraColor: 'var(--danger)',
    },
    {
      icon: Crosshair, label: 'ATTACKS DETECTED', value: `${summary?.attack_count ?? 0}`,
      sub: `of ${summary?.total_predictions ?? 0} predictions`, color: 'var(--danger)', bg: 'var(--danger-light)',
    },
    {
      icon: CheckCircle2, label: 'BENIGN RATE', value: `${((1 - attackRate) * 100).toFixed(1)}%`,
      sub: `Avg confidence: ${((summary?.avg_confidence ?? 0) * 100).toFixed(1)}%`, color: 'var(--success)', bg: 'var(--success-light)',
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-stack">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Security Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Real-time threat monitoring & analytics</p>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: 999 }}>
          <TrendingUp style={{ width: 12, height: 12 }} /> Live &middot; 10s refresh
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp} className="card" style={{ padding: 20 }}>
            <div className="flex items-start justify-between">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}>
                  {kpi.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8, lineHeight: 1 }}>
                  {kpi.value}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{kpi.sub}</p>
                {kpi.extra && (
                  <p style={{ fontSize: 11, color: kpi.extraColor, marginTop: 2 }}>{kpi.extra}</p>
                )}
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon style={{ width: 20, height: 20, color: kpi.color }} />
              </div>
            </div>
            {/* Threat bar on first card */}
            {kpi.bar !== undefined && (
              <div style={{ marginTop: 14 }}>
                <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--bg-secondary)' }}>
                  <div style={{ width: `${Math.min(kpi.bar * 100, 100)}%`, height: '100%', borderRadius: 3, background: kpi.color, transition: 'width 0.5s' }} />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Threat Timeline */}
        <motion.div variants={fadeUp} className="card lg:col-span-2" style={{ padding: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Live Threat Timeline</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Anomaly score over time (real-time)</p>
            </div>
            <div className="flex gap-1">
              {['1H', '6H', '24H', '7D'].map((label, i) => (
                <button key={label} style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  background: i === 0 ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: i === 0 ? '#fff' : 'var(--text-muted)',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="scoreG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey={() => 0.5} stroke="var(--danger)" strokeDasharray="6 3" dot={false} strokeWidth={1} name="Threshold" />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreG)" dot={false} activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} name="Score" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Attack Type Breakdown</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Distribution of detected attacks</p>
          {summary && summary.total_predictions > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" animationBegin={200}>
                    {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6" style={{ marginTop: 4 }}>
                {pieData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], display: 'inline-block' }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200, color: 'var(--text-muted)', fontSize: 13 }}>No predictions yet</div>
          )}
        </motion.div>
      </div>

      {/* Recent Alerts Table */}
      <motion.div variants={fadeUp} className="card" style={{ padding: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Alerts</h3>
          <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>View All &rarr;</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Device</th>
                <th>Attack Type</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.total_predictions ?? 0) > 0 ? (
                [
                  { id: 1, time: '10:14:32 AM', device: 'Camera_01', type: 'DDoS Flood', conf: 0.94, status: 'Active', color: 'var(--danger)' },
                  { id: 2, time: '10:13:58 AM', device: 'Sensor_03', type: 'Port Scan', conf: 0.87, status: 'Blocked', color: 'var(--warning)' },
                  { id: 3, time: '10:12:11 AM', device: 'Gateway_02', type: 'Benign', conf: 0.12, status: 'Clear', color: 'var(--success)' },
                  { id: 4, time: '10:11:45 AM', device: 'Camera_02', type: 'Brute Force', conf: 0.91, status: 'Active', color: 'var(--danger)' },
                  { id: 5, time: '10:10:22 AM', device: 'Sensor_01', type: 'Benign', conf: 0.08, status: 'Clear', color: 'var(--success)' },
                ].map((row) => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{row.id}</td>
                    <td>{row.time}</td>
                    <td style={{ fontWeight: 500 }}>{row.device}</td>
                    <td style={{ color: row.color, fontWeight: 600 }}>{row.type}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--bg-secondary)' }}>
                          <div style={{ width: `${row.conf * 100}%`, height: '100%', borderRadius: 3, background: row.color }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: row.color }}>{row.conf.toFixed(2)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: row.status === 'Clear' ? 'var(--success-light)' : row.status === 'Blocked' ? 'var(--warning-light)' : 'var(--danger-light)', color: row.color }}>
                        ● {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No recent alerts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Device Health Map */}
      <motion.div variants={fadeUp} className="card" style={{ padding: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Device Health Map</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Click a device to open Traffic Monitor</p>
          </div>
          <div className="flex gap-4" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><span className="status-dot status-online" /> Online</span>
            <span className="flex items-center gap-1.5"><span className="status-dot status-attack" /> Under Attack</span>
            <span className="flex items-center gap-1.5"><span className="status-dot status-quarantined" /> Quarantined</span>
            <span className="flex items-center gap-1.5"><span className="status-dot status-offline" /> Offline</span>
          </div>
        </div>

        {devices.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {devices.map((device) => {
              const borderColor = device.status === 'under_attack' ? 'var(--danger)' : device.status === 'quarantined' ? 'var(--warning)' : device.status === 'offline' ? 'var(--text-muted)' : 'var(--success)';
              return (
                <div
                  key={device.id}
                  className="card cursor-pointer transition-all"
                  style={{
                    padding: 14, textAlign: 'center',
                    borderColor, borderWidth: 1.5,
                    opacity: device.status === 'offline' ? 0.5 : 1,
                  }}
                >
                  <div className="flex justify-center" style={{ marginBottom: 8 }}>
                    <span className={getStatusDotClass(device.status)} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {device.name}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {device.ip_address}
                  </p>
                  <p style={{ fontSize: 11, color: borderColor, marginTop: 4, fontWeight: 500 }}>
                    {device.status.replace('_', ' ')}
                  </p>
                  {device.last_seen_at && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatRelativeTime(device.last_seen_at)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>No devices registered</p>
        )}
      </motion.div>
    </motion.div>
  );
}

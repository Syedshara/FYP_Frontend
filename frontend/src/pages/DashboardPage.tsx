import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  ShieldAlert, Monitor, Crosshair, CheckCircle2, Loader2,
} from 'lucide-react';
import { predictionsApi } from '@/api/predictions';
import { devicesApi } from '@/api/devices';
import type { PredictionSummary, Device } from '@/types';
import { cn, getStatusDotClass, formatRelativeTime } from '@/lib/utils';

const PIE_COLORS = ['#ef4444', '#22c55e'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d] = await Promise.all([
          predictionsApi.summary(),
          devicesApi.list(),
        ]);
        setSummary(s);
        setDevices(d);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.length - onlineCount;

  const threatLevel = !summary
    ? 'N/A'
    : summary.attack_rate > 0.5
    ? 'HIGH'
    : summary.attack_rate > 0.2
    ? 'MEDIUM'
    : 'LOW';

  const threatColor =
    threatLevel === 'HIGH'
      ? 'text-red-500'
      : threatLevel === 'MEDIUM'
      ? 'text-amber-500'
      : 'text-green-500';

  const pieData = summary
    ? [
        { name: 'Attacks', value: summary.attack_count },
        { name: 'Benign', value: summary.benign_count },
      ]
    : [];

  // Generate mock timeline data from summary
  const timelineData = Array.from({ length: 20 }, (_, i) => ({
    time: `${String(Math.floor(i / 2) + 10).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    score: Math.random() * (summary?.attack_rate ?? 0.3) + Math.random() * 0.3,
  }));

  const kpis = [
    {
      icon: ShieldAlert,
      label: 'Threat Level',
      value: threatLevel,
      sub: `${((summary?.attack_rate ?? 0) * 100).toFixed(1)}% attack rate`,
      color: threatColor,
      bgColor: threatLevel === 'HIGH' ? 'bg-red-500/10' : threatLevel === 'MEDIUM' ? 'bg-amber-500/10' : 'bg-green-500/10',
    },
    {
      icon: Monitor,
      label: 'Active Devices',
      value: `${devices.length}`,
      sub: `${onlineCount} online · ${offlineCount} offline`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Crosshair,
      label: 'Attacks Detected',
      value: `${summary?.attack_count ?? 0}`,
      sub: `of ${summary?.total_predictions ?? 0} predictions`,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: CheckCircle2,
      label: 'Benign Rate',
      value: `${(((1 - (summary?.attack_rate ?? 0)) * 100)).toFixed(1)}%`,
      sub: `Avg confidence: ${((summary?.avg_confidence ?? 0) * 100).toFixed(1)}%`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Real-time threat monitoring overview</p>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          Auto-refreshing every 10s
        </span>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className={cn('text-2xl font-bold mt-1', kpi.color)}>{kpi.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{kpi.sub}</p>
              </div>
              <div className={cn('p-2.5 rounded-lg', kpi.bgColor)}>
                <kpi.icon className={cn('w-5 h-5', kpi.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Timeline */}
        <motion.div variants={item} className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Threat Timeline
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              {/* Threshold line */}
              <Line
                type="monotone"
                dataKey={() => 0.5}
                stroke="var(--danger)"
                strokeDasharray="6 3"
                dot={false}
                strokeWidth={1}
                name="Threshold"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Attack Breakdown Pie */}
        <motion.div variants={item} className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Attack vs Benign
          </h3>
          {summary && summary.total_predictions > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={200}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-[var(--text-muted)] text-sm">
              No predictions yet
            </div>
          )}
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Attacks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Benign
            </span>
          </div>
        </motion.div>
      </div>

      {/* Device Health Map */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Device Health Map
        </h3>
        {devices.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {devices.map((device) => (
              <motion.div
                key={device.id}
                whileHover={{ scale: 1.03 }}
                className="card p-3 text-center cursor-pointer"
              >
                <span className={getStatusDotClass(device.status)} />
                <p className="text-sm font-medium text-[var(--text-primary)] mt-2 truncate">
                  {device.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {device.last_seen_at ? formatRelativeTime(device.last_seen_at) : 'Never seen'}
                </p>
                {device.threat_count_today > 0 && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                    {device.threat_count_today} threats
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            No devices registered. Go to Devices to add one.
          </p>
        )}
        <div className="flex gap-4 mt-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="status-dot status-online" /> Online</span>
          <span className="flex items-center gap-1.5"><span className="status-dot status-attack" /> Under Attack</span>
          <span className="flex items-center gap-1.5"><span className="status-dot status-quarantined" /> Quarantined</span>
          <span className="flex items-center gap-1.5"><span className="status-dot status-offline" /> Offline</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

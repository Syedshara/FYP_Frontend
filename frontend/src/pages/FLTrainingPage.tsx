import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Activity, Lock, Server, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { flApi } from '@/api/fl';
import type { FLRound, FLStatus, FLClient } from '@/types';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const tooltipStyle = { contentStyle: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' } };

/* ---------- Round Lifecycle Steps ---------- */
const roundSteps = [
  { label: '1. Distribute global model', color: '#A855F7' },
  { label: '2. Clients train on local data', color: 'var(--accent)' },
  { label: '3. CKKS encrypt updates', color: '#EF4444' },
  { label: '4. Send via gRPC', color: '#22C55E' },
  { label: '5. Decrypt + FedAvg', color: '#F59E0B' },
  { label: '6. Update global model', color: '#A855F7' },
  { label: '7. Save checkpoint', color: '#3B82F6' },
];

/* ---------- CKKS Config ---------- */
const ckksConfig = [
  { param: 'Library', value: 'TenSEAL' },
  { param: 'poly_modulus_degree', value: '16384' },
  { param: 'coeff_mod_bit_sizes', value: '[60,40,40,40,40,60]' },
  { param: 'global_scale', value: '2^40' },
  { param: 'Encrypted layers', value: 'LSTM + FC only' },
];

export default function FLTrainingPage() {
  const [status, setStatus] = useState<FLStatus | null>(null);
  const [rounds, setRounds] = useState<FLRound[]>([]);
  const [clients, setClients] = useState<FLClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      flApi.status().catch(() => null),
      flApi.rounds().catch(() => []),
      flApi.clients().catch(() => []),
    ]).then(([s, r, c]) => {
      setStatus(s);
      setRounds(r);
      setClients(c);
    }).finally(() => setLoading(false));
  }, []);

  const chartData = rounds.map((r) => ({
    round: `R${r.round_number}`,
    accuracy: r.global_accuracy ? +(r.global_accuracy * 100).toFixed(1) : null,
    loss: r.global_loss ? +r.global_loss.toFixed(4) : null,
    f1: r.global_f1 ? +(r.global_f1 * 100).toFixed(1) : null,
  }));

  const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} /></div>;
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-stack">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Federated Learning Training</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Flower Framework | FedAvg | TenSEAL CKKS | CNN-LSTM IDS Model
        </p>
      </motion.div>

      {/* Round Lifecycle */}
      <motion.div variants={fadeUp} className="card" style={{ padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Round Lifecycle (repeated N times, default 25)
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {roundSteps.map((step, i) => (
            <div key={step.label} className="flex items-center" style={{ flexShrink: 0 }}>
              <span style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: step.color, color: step.color === '#F59E0B' ? '#0F172A' : '#fff',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
              {i < roundSteps.length - 1 && (
                <span style={{ width: 20, height: 1.5, background: 'var(--border)', display: 'inline-block', margin: '0 2px' }} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { icon: Activity, label: 'Training Status', value: status?.is_training ? 'Active' : 'Idle', color: status?.is_training ? 'var(--success)' : 'var(--text-muted)' },
          { icon: TrendingUp, label: 'Rounds Completed', value: status?.total_rounds_completed ?? rounds.length, color: 'var(--accent)' },
          { icon: Users, label: 'Active Clients', value: status?.active_clients ?? clients.length, color: 'var(--warning)' },
          { icon: Lock, label: 'Encryption', value: 'CKKS HE', color: 'var(--danger)' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={fadeUp} className="kpi-card" style={{ '--accent-color': kpi.color } as React.CSSProperties}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `color-mix(in srgb, ${kpi.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 16, height: 16, color: kpi.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy & F1 */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Training Accuracy & F1</h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="round" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="accuracy" stroke="var(--accent)" strokeWidth={2} dot={false} name="Accuracy %" />
                <Line type="monotone" dataKey="f1" stroke="#22C55E" strokeWidth={2} dot={false} name="F1 %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Loss */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Training Loss</h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="round" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="loss" stroke="#EF4444" strokeWidth={2} fill="url(#lossGrad)" dot={false} name="Loss" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Server Details + CKKS + Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FedAvg Strategy */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 24, borderLeft: '3px solid #A855F7' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#A855F7' }}>FedAvg Aggregation Strategy</h3>
          <p style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-primary)' }}>
            w_global = SUM(n_k / n) * w_k
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
            Weighted average of client model updates, proportional to each client's sample count.
          </p>
          <div className="space-y-1 mt-3" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <p>1. Wait for all 3 clients</p>
            <p style={{ color: 'var(--danger)' }}>2. Decrypt CKKS ciphertexts</p>
            <p>3. Compute weighted average</p>
            <p>4. Update global state_dict</p>
          </div>
        </motion.div>

        {/* CKKS Encryption */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 24, borderLeft: '3px solid var(--danger)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>CKKS Homomorphic Encryption</h3>
          <div className="space-y-2 mt-3">
            {ckksConfig.map((c) => (
              <div key={c.param} className="flex items-center justify-between">
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.param}</span>
                <span style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-primary)', fontFamily: 'monospace', fontSize: 10, color: 'var(--danger)' }}>
            secret_key.decrypt(encrypted_update)
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
            Decrypts LSTM + FC layer weights only
          </p>
        </motion.div>

        {/* FL Clients */}
        <motion.div variants={fadeUp} className="card" style={{ padding: 24, borderLeft: '3px solid var(--accent)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>FL Clients</h3>
            <Server style={{ width: 16, height: 16, color: 'var(--accent)' }} />
          </div>

          {clients.length > 0 ? (
            <div className="space-y-2">
              {clients.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <span className={`status-dot ${c.status === 'online' ? 'status-online' : 'status-offline'}`} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.client_id}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.data_path}</p>
                  </div>
                  <span className="badge" style={{
                    background: c.status === 'online' ? 'var(--success-light)' : 'var(--bg-secondary)',
                    color: c.status === 'online' ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No FL clients registered
            </p>
          )}
        </motion.div>
      </div>

      {/* Latest Round Details */}
      {latestRound && (
        <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            Latest Round: #{latestRound.round_number}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Accuracy', value: latestRound.global_accuracy ? `${(latestRound.global_accuracy * 100).toFixed(1)}%` : '—' },
              { label: 'Loss', value: latestRound.global_loss?.toFixed(4) ?? '—' },
              { label: 'F1 Score', value: latestRound.global_f1 ? `${(latestRound.global_f1 * 100).toFixed(1)}%` : '—' },
              { label: 'Precision', value: latestRound.global_precision ? `${(latestRound.global_precision * 100).toFixed(1)}%` : '—' },
              { label: 'Clients', value: latestRound.num_clients },
              { label: 'Duration', value: latestRound.duration_seconds ? `${latestRound.duration_seconds.toFixed(1)}s` : '—' },
            ].map((m) => (
              <div key={m.label} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-primary)', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{m.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

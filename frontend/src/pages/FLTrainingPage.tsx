import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Brain, Users, Shield, Lock, Loader2, Download } from 'lucide-react';
import { flApi } from '@/api/fl';
import type { FLStatus, FLRound, FLClient, FLRoundDetail } from '@/types';
import { cn } from '@/lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function FLTrainingPage() {
  const [status, setStatus] = useState<FLStatus | null>(null);
  const [rounds, setRounds] = useState<FLRound[]>([]);
  const [clients, setClients] = useState<FLClient[]>([]);
  const [selectedRound, setSelectedRound] = useState<FLRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, c] = await Promise.all([
          flApi.status(),
          flApi.rounds(),
          flApi.clients(),
        ]);
        setStatus(s);
        setRounds(r);
        setClients(c);

        // Load details for latest round
        if (r.length > 0) {
          const latest = r[r.length - 1];
          const detail = await flApi.round(latest.round_number);
          setSelectedRound(detail);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const chartData = rounds.map((r) => ({
    round: `R${r.round_number}`,
    loss: r.global_loss ?? 0,
    accuracy: r.global_accuracy ? r.global_accuracy * 100 : 0,
  }));

  const latestRound = rounds[rounds.length - 1];

  const kpis = [
    {
      icon: Brain,
      label: 'Rounds',
      value: `${status?.total_rounds_completed ?? 0}`,
      sub: status?.is_training ? '🔄 Training...' : '✅ Complete',
      color: 'text-[var(--accent)]',
      bgColor: 'bg-indigo-500/10',
    },
    {
      icon: Users,
      label: 'Clients',
      value: `${status?.active_clients ?? 0}`,
      sub: clients.map((c) => c.client_id).join(', ') || 'None',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Shield,
      label: 'Global Accuracy',
      value: latestRound?.global_accuracy
        ? `${(latestRound.global_accuracy * 100).toFixed(1)}%`
        : 'N/A',
      sub: latestRound?.global_f1
        ? `F1: ${(latestRound.global_f1 * 100).toFixed(1)}%`
        : 'No metrics',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Lock,
      label: 'HE Status',
      value: '🔐 CKKS',
      sub: '16384-bit poly modulus',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Federated Learning Monitor</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Training convergence, client metrics, and encryption details
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{kpi.label}</p>
                <p className={cn('text-2xl font-bold mt-1', kpi.color)}>{kpi.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{kpi.sub}</p>
              </div>
              <div className={cn('p-2.5 rounded-lg', kpi.bgColor)}>
                <kpi.icon className={cn('w-5 h-5', kpi.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Training Convergence */}
        <motion.div variants={item} className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Training Convergence
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="round" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="loss" stroke="var(--danger)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="acc" orientation="right" stroke="var(--success)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend />
                <Line yAxisId="loss" type="monotone" dataKey="loss" stroke="var(--danger)" strokeWidth={2} dot={{ r: 3 }} name="Loss" />
                <Line yAxisId="acc" type="monotone" dataKey="accuracy" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} name="Accuracy %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">
              No training rounds recorded
            </div>
          )}
        </motion.div>

        {/* Per-Client Metrics */}
        <motion.div variants={item} className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Client Metrics {selectedRound ? `(Round ${selectedRound.round_number})` : ''}
          </h3>
          {selectedRound && selectedRound.client_metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={selectedRound.client_metrics.map((m) => ({
                client: m.client_id,
                loss: m.local_loss,
                accuracy: m.local_accuracy * 100,
                samples: m.num_samples,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="client" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend />
                <Bar dataKey="loss" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Loss" />
                <Bar dataKey="accuracy" fill="var(--success)" radius={[4, 4, 0, 0]} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">
              No client metrics for selected round
            </div>
          )}
        </motion.div>
      </div>

      {/* Encryption Details */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Encryption Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Scheme</span>
              <span className="text-[var(--text-primary)] font-medium">CKKS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Poly Modulus</span>
              <span className="text-[var(--text-primary)] font-mono">16384</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Scale</span>
              <span className="text-[var(--text-primary)] font-mono">2^40</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Coeff Modulus</span>
              <span className="text-[var(--text-primary)] font-mono text-xs">[60, 40, 40, 40, 40, 60]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Privacy</span>
              <span className="text-green-500 font-medium">IND-CPA</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[var(--text-muted)] text-xs mb-1">Encrypted Layers:</p>
            <div className="flex flex-wrap gap-1.5">
              {['lstm.weight_ih_l0', 'lstm.weight_hh_l0', 'fc.weight', 'fc.bias'].map((l) => (
                <span key={l} className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                  ✅ {l}
                </span>
              ))}
              {['conv1.weight', 'conv1.bias'].map((l) => (
                <span key={l} className="text-xs px-2 py-0.5 rounded bg-gray-500/10 text-[var(--text-muted)]">
                  ❌ {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* FL Clients */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Registered FL Clients
        </h3>
        {clients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map((client) => (
              <div key={client.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text-primary)]">{client.client_id}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    client.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400',
                  )}>
                    {client.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono truncate">{client.data_path}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No FL clients registered</p>
        )}
      </motion.div>

      {/* Model Actions */}
      <motion.div variants={item} className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm transition-colors">
          <Download className="w-4 h-4" /> Download Model (.pt)
        </button>
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Activity, Loader2, Info, Pause, Play, Download } from 'lucide-react';
import { predictionsApi } from '@/api/predictions';
import { devicesApi } from '@/api/devices';
import type { Prediction, Device, ModelInfo } from '@/types';
import { cn, formatDate } from '@/lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// Mock feature names for XAI chart
const FEATURE_NAMES = [
  'Fwd Pkt Len', 'Flow Duration', 'Bwd Pkt Len', 'Tot Fwd Pkt', 'Pkt Size Avg',
  'Flow IAT Mean', 'Fwd IAT Mean', 'Bwd IAT Mean',
];

export default function TrafficMonitorPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [devs, info] = await Promise.all([
          devicesApi.list(),
          predictionsApi.model(),
        ]);
        setDevices(devs);
        setModelInfo(info);
        if (devs.length > 0) {
          setSelectedDeviceId(devs[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedDeviceId || paused) return;
    const load = async () => {
      try {
        const preds = await predictionsApi.deviceHistory(selectedDeviceId, 50);
        setPredictions(preds);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, paused]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  // Chart data from predictions
  const chartData = [...predictions]
    .reverse()
    .map((p, i) => ({
      idx: i + 1,
      score: p.score,
      time: formatDate(p.timestamp),
    }));

  // Mock feature importance
  const featureData = FEATURE_NAMES.map((name) => ({
    name,
    importance: Math.random() * 0.4,
  })).sort((a, b) => b.importance - a.importance);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Traffic Monitor</h1>
          <p className="text-sm text-[var(--text-muted)]">Real-time anomaly detection & prediction history</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Device Selector */}
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <button
            onClick={() => setPaused(!paused)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              paused
                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
            )}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Resume' : 'Pause'}
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </motion.div>

      {/* Anomaly Score Chart */}
      <motion.div variants={item} className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Anomaly Score
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="idx" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Prediction #', position: 'insideBottom', offset: -5, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
              <YAxis domain={[0, 1]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                labelFormatter={(v) => `Prediction #${v}`}
              />
              {/* Threshold line */}
              <Line type="monotone" dataKey={() => 0.5} stroke="var(--danger)" strokeDasharray="6 3" dot={false} strokeWidth={1} name="Threshold" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--accent)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">
            No predictions for this device yet
          </div>
        )}
      </motion.div>

      {/* Feature Importance + Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Feature Importance */}
        <motion.div variants={item} className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Feature Importance (XAI)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={featureData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[0, 0.5]} stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 10 }} width={75} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="importance" fill="var(--accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Prediction History Table */}
        <motion.div variants={item} className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Prediction History
          </h3>
          {predictions.length > 0 ? (
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--bg-card)]">
                  <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Timestamp</th>
                    <th className="pb-2 pr-3">Prediction</th>
                    <th className="pb-2 pr-3">Score</th>
                    <th className="pb-2">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred, idx) => (
                    <tr
                      key={pred.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="py-2 pr-3 text-[var(--text-muted)]">{idx + 1}</td>
                      <td className="py-2 pr-3 text-[var(--text-primary)] text-xs font-mono">
                        {formatDate(pred.timestamp)}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          pred.label === 'attack'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-green-500/10 text-green-500',
                        )}>
                          {pred.label === 'attack' ? '🚨 ATTACK' : '✅ BENIGN'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-[var(--text-primary)]">
                        {pred.score.toFixed(3)}
                      </td>
                      <td className="py-2 text-[var(--text-muted)]">
                        {pred.inference_latency_ms.toFixed(1)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">
              No predictions yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Model Info */}
      {modelInfo && (
        <motion.div variants={item} className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Model Info</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-[var(--text-muted)]">Architecture</span>
              <p className="text-[var(--text-primary)] font-medium mt-0.5">{modelInfo.architecture}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Input Shape</span>
              <p className="text-[var(--text-primary)] font-mono mt-0.5">{modelInfo.input_shape}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Threshold</span>
              <p className="text-[var(--text-primary)] font-mono mt-0.5">{modelInfo.threshold}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Version</span>
              <p className="text-[var(--text-primary)] font-medium mt-0.5">{modelInfo.version}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

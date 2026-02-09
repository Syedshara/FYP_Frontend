import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Eye, EyeOff, Loader2, Lock, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try { await login(username, password); navigate('/'); }
    catch { setError('Invalid username or password'); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left — Branding */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between"
        style={{
          padding: '48px',
          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #818cf8 70%, #3b82f6 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[450px] h-[450px] rounded-full" style={{ border: '1px solid rgba(255,255,255,.08)' }} />
          <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full" style={{ background: 'rgba(255,255,255,.04)' }} />
          <div className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full" style={{ border: '1px solid rgba(255,255,255,.06)' }} />
        </div>

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)' }}>
            <Shield style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>IoT IDS Platform</span>
        </div>

        {/* Center */}
        <div className="relative z-10 max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}
          >
            Privacy-Preserving<br />
            <span style={{ color: 'rgba(255,255,255,.7)' }}>Intrusion Detection</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, maxWidth: 440 }}
          >
            Federated Learning with Homomorphic Encryption for real-time IoT
            threat detection — without compromising data privacy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap gap-2"
            style={{ marginTop: 32 }}
          >
            {['CNN-LSTM Model', 'CKKS Encryption', 'FedAvg Aggregation', 'Real-time Detection'].map((f) => (
              <span
                key={f}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.1)',
                  backdropFilter: 'blur(4px)',
                  color: 'rgba(255,255,255,.85)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,.12)',
                }}
              >{f}</span>
            ))}
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
            <Fingerprint style={{ width: 14, height: 14 }} /> Privacy-First Architecture
          </div>
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
            <Lock style={{ width: 14, height: 14 }} /> End-to-End Encrypted
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: '32px' }}>
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow" style={{ background: '#6366f1' }}>
              <Shield style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>IoT IDS Platform</span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>Sign in to your security dashboard</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 8, marginBottom: 20,
                  background: 'rgba(239,68,68,.1)', color: '#ef4444', fontSize: 13, border: '1px solid rgba(239,68,68,.2)',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8,
                  border: '1.5px solid #1e293b', background: '#131c31',
                  color: '#f1f5f9', fontSize: 14, outline: 'none',
                  transition: 'border-color .15s, box-shadow .15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#1e293b'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%', padding: '12px 48px 12px 16px', borderRadius: 8,
                    border: '1.5px solid #1e293b', background: '#131c31',
                    color: '#f1f5f9', fontSize: 14, outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1e293b'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-0 h-full flex items-center justify-center"
                  style={{ width: 48, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                background: '#6366f1', color: '#fff',
                fontSize: 14, fontWeight: 600, border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background .15s, box-shadow .15s',
                boxShadow: '0 4px 14px rgba(99,102,241,.3)',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#4f46e5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1'; }}
            >
              {isLoading && <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              Register
            </Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#475569' }}>
            Default: <span style={{ color: '#94a3b8' }}>admin</span> / <span style={{ color: '#94a3b8' }}>admin123</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

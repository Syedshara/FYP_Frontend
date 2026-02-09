import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Shield, Eye, EyeOff, Loader2, Lock, Fingerprint, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPw) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ username, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: '1.5px solid #1e293b', background: '#131c31',
    color: '#f1f5f9', fontSize: 14, outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#6366f1';
    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.15)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#1e293b';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left — Branding */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between"
        style={{
          padding: 48,
          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #818cf8 70%, #3b82f6 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[450px] h-[450px] rounded-full" style={{ border: '1px solid rgba(255,255,255,.08)' }} />
          <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full" style={{ background: 'rgba(255,255,255,.04)' }} />
          <div className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full" style={{ border: '1px solid rgba(255,255,255,.06)' }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)' }}>
            <Shield style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>IoT IDS Platform</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}
          >
            Join the<br />
            <span style={{ color: 'rgba(255,255,255,.7)' }}>Security Platform</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, maxWidth: 440 }}
          >
            Create your account to access the IoT Intrusion Detection System
            with Federated Learning and Homomorphic Encryption.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap gap-2"
            style={{ marginTop: 32 }}
          >
            {['Real-time Monitoring', 'Automated Prevention', 'Privacy-First', 'Team Access'].map((f) => (
              <span
                key={f}
                style={{
                  padding: '8px 16px', borderRadius: 999,
                  background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(4px)',
                  color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: 500,
                  border: '1px solid rgba(255,255,255,.12)',
                }}
              >{f}</span>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
            <Fingerprint style={{ width: 14, height: 14 }} /> Privacy-First Architecture
          </div>
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
            <Lock style={{ width: 14, height: 14 }} /> End-to-End Encrypted
          </div>
        </div>
      </div>

      {/* Right — Register Form */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: 32 }}>
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow" style={{ background: '#6366f1' }}>
              <Shield style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>IoT IDS Platform</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <UserPlus style={{ width: 24, height: 24, color: '#6366f1' }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>Create Account</h2>
          </div>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>Register for a new security dashboard account</p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: 24, borderRadius: 12, textAlign: 'center',
                background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Shield style={{ width: 24, height: 24, color: '#fff' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>Account Created!</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Redirecting to login...</p>
            </motion.div>
          ) : (
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
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Username</label>
                <input
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username" required autoFocus
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" required
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)" required
                    style={{ ...inputStyle, paddingRight: 48 }} onFocus={onFocus} onBlur={onBlur}
                  />
                  <button
                    type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-0 top-0 h-full flex items-center justify-center"
                    style={{ width: 48, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Confirm Password</label>
                <input
                  type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter your password" required
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 8,
                  background: '#6366f1', color: '#fff',
                  fontSize: 14, fontWeight: 600, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background .15s, box-shadow .15s',
                  boxShadow: '0 4px 14px rgba(99,102,241,.3)',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4f46e5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1'; }}
              >
                {loading && <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

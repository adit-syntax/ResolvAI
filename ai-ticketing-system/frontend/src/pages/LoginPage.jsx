/**
 * LoginPage.jsx — Login & Registration gate for ResolvAI
 *
 * Access Rules:
 *   - End-User  : Self-registers here → Support Portal
 *   - Employee  : Account created by Admin → logs in here
 *   - Admin     : Pre-seeded demo credential only → Admin Dashboard
 *
 * Auth: All login/register calls go to the real backend (/api/auth/login,
 * /api/auth/register). No credentials are stored or validated in the browser.
 */

import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import {
  Mail, Lock, Eye, EyeOff, Sparkles,
  User, ShieldCheck, AlertTriangle, Zap, UserPlus, LogIn, Info, Headphones,
  Loader2
} from 'lucide-react';
import { authApi, setAuthToken } from '../api.js';

// ── Demo credentials (sent to real API with bcrypt-hashed passwords in DB) ────
const DEMO_CREDENTIALS = {
  user:     { email: 'user@gmail.com',      password: 'user123',     role: 'user'     },
  admin:    { email: 'admin@gmail.com',     password: 'admin123',    role: 'admin'    },
  employee: { email: 'employee@company.com',password: 'employee123', role: 'employee' },
};

// Google icon
function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
    </svg>
  );
}

// Google Login Button component (only mounted when clientId exists)
function GoogleOAuthButton({ onSuccess, onError }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${codeResponse.access_token}` },
        });
        const info = await res.json();
        const googleEmail = (info.email || '').toLowerCase();
        const googleName  = info.name || googleEmail.split('@')[0];
        const data = await authApi.googleAuth({
          email: googleEmail,
          name: googleName,
          access_token: codeResponse?.access_token,
        });
        setAuthToken(data.access_token);
        onSuccess({ role: data.role, email: data.email, name: data.name }, data.access_token);
      } catch (err) {
        onError(err.message || 'Google sign-in failed. Please try again.');
      }
    },
    onError: () => onError('Google sign-in was cancelled or failed.'),
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => { onError(''); googleLogin(); }}
      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-sm transition-all shadow-md active:scale-[0.98] mb-4"
    >
      <GoogleIcon className="w-4 h-4" />
      Continue with Google
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage({ onLogin }) {
  const [authTab, setAuthTab] = useState('login');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Login form
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  // Register form
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPassword, setRegPassword]   = useState('');
  const [regError, setRegError]         = useState('');
  const [regLoading, setRegLoading]     = useState(false);

  // Google OAuth
  const [googleError, setGoogleError]   = useState('');

  // ── Sign In ──────────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email.trim().toLowerCase(), password);
      // Store the JWT — api.js will attach it to every future request
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regName.trim().length < 2) { setRegError('Please enter your full name.'); return; }
    if (!regEmail.trim().includes('@')) { setRegError('Please enter a valid email.'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }

    setRegLoading(true);
    try {
      const data = await authApi.register(regName.trim(), regEmail.trim().toLowerCase(), regPassword);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // ── Quick Demo Login ──────────────────────────────────────────────────────────

  const quickLogin = async (type) => {
    setError('');
    setLoading(true);
    const cred = DEMO_CREDENTIALS[type];
    setEmail(cred.email);
    setPassword(cred.password);
    try {
      const data = await authApi.login(cred.email, cred.password);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
    } catch (err) {
      setError(err.message || 'Demo login failed — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/4 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <ResolvAiLogo variant="icon" className="w-16 h-16 mb-4 drop-shadow-[0_0_25px_rgba(34,197,94,0.35)] rounded-2xl inline-block" />
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Resolv<span className="text-[#22c55e]">AI</span></h1>
          <p className="text-neutral-400 text-sm font-medium">Smart AI Helpdesk &amp; Autonomous Triage</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 shadow-2xl">

          {/* Tab Switcher */}
          <div className="flex bg-[#161616] p-1 rounded-xl border border-[#2a2a2a] mb-5">
            <button
              onClick={() => { setAuthTab('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authTab === 'login' ? 'bg-[#22c55e] text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => { setAuthTab('register'); setRegError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authTab === 'register' ? 'bg-[#22c55e] text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>

          {/* Google OAuth Button */}
          {googleClientId ? (
            <>
              <GoogleOAuthButton
                onSuccess={onLogin}
                onError={setGoogleError}
              />
              {googleError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-400 text-xs mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{googleError}
                </div>
              )}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#2a2a2a]" />
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">or with email</span>
                <div className="flex-1 h-px bg-[#2a2a2a]" />
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2 bg-neutral-800/40 border border-neutral-700/40 rounded-xl px-3 py-2.5 mb-5">
              <Info className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                Google OAuth not configured. Set <code className="bg-neutral-800 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to enable.
              </p>
            </div>
          )}

          {authTab === 'login' ? (
            /* ── SIGN IN FORM ── */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-start gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2.5">
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300/80 leading-relaxed">
                  <span className="font-semibold text-blue-300">Employees:</span> use credentials provided by your administrator.
                  <span className="text-neutral-500 ml-1">Admins: use pre-seeded admin credentials below.</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#22c55e]/20 mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

          ) : (
            /* ── REGISTER FORM (End-Users only) ── */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="flex items-start gap-2 bg-[#22c55e]/8 border border-[#22c55e]/20 rounded-xl px-3 py-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#22c55e]/80 leading-relaxed">
                  Registration is for <span className="font-semibold text-[#22c55e]">Support Users</span> (customers) only.
                  Employees &amp; Admins are added by the system administrator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text" required placeholder="John Doe"
                  value={regName} onChange={e => setRegName(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email" required placeholder="john@example.com"
                  value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Password *</label>
                <input
                  type="password" required minLength={6} placeholder="••••••••  (min 6 chars)"
                  value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              {regError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {regError}
                </div>
              )}

              <button
                type="submit" disabled={regLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-[#22c55e]/20 mt-2"
              >
                {regLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : 'Create My Account'}
              </button>
            </form>
          )}

          {/* Quick Demo Access */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#222222]" />
            <span className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#22c55e]" /> Quick Demo Access
            </span>
            <div className="flex-1 h-px bg-[#222222]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              id="demo-user-btn"
              onClick={() => quickLogin('user')} disabled={loading}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5 transition-all group active:scale-[0.97] disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center group-hover:bg-[#22c55e]/20 transition-colors">
                <User className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">User</p>
                <p className="text-[9px] text-neutral-600 mt-0.5">Support Portal</p>
              </div>
            </button>

            <button
              id="demo-employee-btn"
              onClick={() => quickLogin('employee')} disabled={loading}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group active:scale-[0.97] disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Headphones className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">Employee</p>
                <p className="text-[9px] text-neutral-500 mt-0.5">My Dashboard</p>
              </div>
            </button>

            <button
              id="demo-admin-btn"
              onClick={() => quickLogin('admin')} disabled={loading}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group active:scale-[0.97] disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">Admin</p>
                <p className="text-[9px] text-neutral-600 mt-0.5">Dashboard</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Re-export helpers that EmployeeDirectory previously used from this file
// (kept for backward compat — they're no-ops now since auth is server-side)
export function getRegisteredUsers() { return []; }
export function saveRegisteredUser() {}

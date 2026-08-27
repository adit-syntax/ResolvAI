/**
 * LoginPage.jsx — Login & Registration gate for AI Ticketing System
 */

import React, { useState } from 'react';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import {
  CircleDot, Mail, Lock, Eye, EyeOff, Sparkles,
  User, ShieldCheck, AlertTriangle, ArrowRight, Zap, UserPlus, LogIn
} from 'lucide-react';

const DEMO_CREDENTIALS = {
  user: { email: 'user@gmail.com', password: 'user123', role: 'user' },
  admin: { email: 'admin@gmail.com', password: 'admin123', role: 'admin' },
};

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem('resolv_registered_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(userObj) {
  const users = getRegisteredUsers();
  users.push(userObj);
  localStorage.setItem('resolv_registered_users', JSON.stringify(users));
}

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
    </svg>
  );
}

export default function LoginPage({ onLogin }) {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('user');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 400));
    const emailTrim = email.trim().toLowerCase();

    // 1. Check demo credentials
    const demoMatch = Object.values(DEMO_CREDENTIALS).find(
      c => c.email === emailTrim && c.password === password
    );

    if (demoMatch) {
      onLogin(demoMatch.role, demoMatch.email);
      setLoading(false);
      return;
    }

    // 2. Check registered users
    const registered = getRegisteredUsers();
    const regMatch = registered.find(
      u => u.email.toLowerCase() === emailTrim && u.password === password
    );

    if (regMatch) {
      onLogin(regMatch.role, regMatch.email);
      setLoading(false);
      return;
    }

    // 3. Fallback: allow any valid email + password
    if (emailTrim.includes('@') && password.length >= 3) {
      onLogin('user', emailTrim);
      setLoading(false);
      return;
    }

    setError('Invalid credentials. Click "Create Account" tab to register.');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regName.trim().length < 2) {
      setRegError('Please enter your full name.');
      return;
    }

    if (!regEmail.trim().includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 3) {
      setRegError('Password must be at least 3 characters.');
      return;
    }

    setRegLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const emailTrim = regEmail.trim().toLowerCase();
    const registered = getRegisteredUsers();

    if (registered.some(u => u.email.toLowerCase() === emailTrim)) {
      setRegError('An account with this email already exists. Please Sign In.');
      setRegLoading(false);
      return;
    }

    const newUser = {
      name: regName.trim(),
      email: emailTrim,
      password: regPassword,
      role: regRole,
      createdAt: new Date().toISOString(),
    };

    saveRegisteredUser(newUser);
    setRegLoading(false);
    onLogin(regRole, emailTrim);
  };

  const quickLogin = async (type) => {
    setError('');
    setLoading(true);
    const cred = DEMO_CREDENTIALS[type];
    setEmail(cred.email);
    setPassword(cred.password);
    await new Promise(r => setTimeout(r, 400));
    onLogin(cred.role, cred.email);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/4 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <ResolvAiLogo className="w-16 h-16 mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,0.35)] inline-block" />
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Resolv<span className="text-[#22c55e]">AI</span></h1>
          <p className="text-neutral-400 text-sm font-medium">Smart AI Helpdesk &amp; Autonomous Triage</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 shadow-2xl">
          
          {/* Tab Switcher */}
          <div className="flex bg-[#161616] p-1 rounded-xl border border-[#2a2a2a] mb-6">
            <button
              onClick={() => { setAuthTab('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authTab === 'login'
                  ? 'bg-[#22c55e] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => { setAuthTab('register'); setRegError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authTab === 'register'
                  ? 'bg-[#22c55e] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>

          {/* ── Google OAuth Button ───────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setShowGooglePicker(true)}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-all shadow-md active:scale-[0.98] mb-4"
          >
            <GoogleIcon className="w-4 h-4" />
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[#2a2a2a] w-full" />
            <span className="bg-[#111111] px-3 text-[10px] text-neutral-500 font-medium uppercase tracking-wider absolute">
              Or with email credentials
            </span>
          </div>

          {authTab === 'login' ? (
            /* ── SIGN IN FORM ── */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
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
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
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
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#22c55e]/20 mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* ── REGISTER FORM ── */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('user')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      regRole === 'user'
                        ? 'bg-[#22c55e]/15 border-[#22c55e]/50 text-[#22c55e]'
                        : 'bg-[#0f0f0f] border-[#2a2a2a] text-neutral-400'
                    }`}
                  >
                    User (Portal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      regRole === 'admin'
                        ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                        : 'bg-[#0f0f0f] border-[#2a2a2a] text-neutral-400'
                    }`}
                  >
                    Admin (Dashboard)
                  </button>
                </div>
              </div>

              {regError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-[#22c55e]/20 mt-2"
              >
                {regLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#222222]" />
            <span className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#22c55e]" /> Quick Demo Access
            </span>
            <div className="flex-1 h-px bg-[#222222]" />
          </div>

          {/* Demo buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              id="demo-user-btn"
              onClick={() => quickLogin('user')}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#22c55e]/40 hover:bg-[#22c55e]/5 transition-all group active:scale-[0.97] disabled:opacity-60"
            >
              <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center group-hover:bg-[#22c55e]/20 transition-colors">
                <User className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">Demo User</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">Support Portal</p>
              </div>
            </button>

            <button
              id="demo-admin-btn"
              onClick={() => quickLogin('admin')}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group active:scale-[0.97] disabled:opacity-60"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">Demo Admin</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">Admin Dashboard</p>
              </div>
            </button>
          </div>

        </div>

      </div>

      {/* ── Google OAuth Sign-In Modal ────────────────────────────── */}
      {showGooglePicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGooglePicker(false)}>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                  <GoogleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google OAuth Authentication</h3>
                  <p className="text-xs text-neutral-400">Sign in with your Google Account</p>
                </div>
              </div>
              <button onClick={() => setShowGooglePicker(false)} className="text-neutral-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const targetEmail = customGoogleEmail.trim();
              if (targetEmail.includes('@')) {
                onLogin(regRole || 'user', targetEmail.toLowerCase());
                setShowGooglePicker(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Google Account Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="email"
                    required
                    placeholder="your.name@gmail.com"
                    value={customGoogleEmail}
                    onChange={e => setCustomGoogleEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-[#4285F4]/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Access Portal Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('user')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      regRole === 'user'
                        ? 'bg-[#22c55e]/15 border-[#22c55e]/50 text-[#22c55e]'
                        : 'bg-[#0f0f0f] border-[#2a2a2a] text-neutral-400'
                    }`}
                  >
                    Support User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      regRole === 'admin'
                        ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                        : 'bg-[#0f0f0f] border-[#2a2a2a] text-neutral-400'
                    }`}
                  >
                    System Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!customGoogleEmail.includes('@')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-[#4285F4]/20 mt-3"
              >
                <GoogleIcon className="w-4 h-4" />
                Sign In with Google Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

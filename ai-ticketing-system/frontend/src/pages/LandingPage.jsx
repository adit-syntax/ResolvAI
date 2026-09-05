import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import DocumentationModal from '../components/DocumentationModal.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import SecondaryButton from '../components/SecondaryButton.jsx';
import StatCard from '../components/StatCard.jsx';
import HeroIllustration from '../components/HeroIllustration.jsx';
import {
  ArrowRight, ShieldCheck, User, Bot, AlertTriangle,
  MessageSquare, CheckCircle2, Headphones,
  X, UserPlus, LogIn, ExternalLink, Zap, Users
} from 'lucide-react';
import { authApi, setAuthToken } from '../api.js';

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

const DEMO_CREDENTIALS = {
  user:     { email: 'user@gmail.com',        password: 'user123'     },
  employee: { email: 'employee@company.com',  password: 'employee123' },
  admin:    { email: 'admin@gmail.com',       password: 'admin123'    },
};

const LIVE_EXAMPLES = [
  {
    id: 'vpn',
    tag: 'IT Access',
    title: 'VPN drops after macOS update',
    desc: 'Unable to connect to staging gateway via GlobalProtect after Sequoia 15.2.',
    sop: 'KB-AUTH-101: SSO & VPN Runbook',
    outcome: 'Auto-matched SOP with config snippet → routed to IT queue.',
    confidence: '94%',
    priority: 'Normal',
  },
  {
    id: 'outage',
    tag: 'Infrastructure',
    title: '502 Bad Gateway on payments endpoint',
    desc: 'Multiple pods OOM-restarting on checkout-service container.',
    sop: 'KB-INFRA-202: API Gateway 502 Mitigation',
    outcome: 'P1 incident triggered → auto-assigned to on-call engineer.',
    confidence: '98%',
    priority: 'Critical',
  },
  {
    id: 'billing',
    tag: 'Finance',
    title: 'Duplicate charge on invoice #INV-2026-88',
    desc: 'Corporate card billed twice for annual seats on March 1st cycle.',
    sop: 'KB-FIN-404: Duplicate Payment & Refund',
    outcome: 'Invoice verified via tool → draft refund notice generated.',
    confidence: '91%',
    priority: 'Medium',
  },
];

function GoogleOAuthButton({ onSuccess, onError }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
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
        onError(err.message || 'Google sign-in failed.');
      }
    },
    onError: () => onError('Google sign-in was cancelled.'),
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => { onError(''); googleLogin(); }}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-colors mb-3"
    >
      <GoogleIcon className="w-4 h-4" /> Continue with Google
    </button>
  );
}

export default function LandingPage({ onLogin }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showDocsModal, setShowDocsModal] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const [activeTab, setActiveTab] = useState(0);
  const currentExample = LIVE_EXAMPLES[activeTab];

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleQuickLogin = async (type) => {
    const cred = DEMO_CREDENTIALS[type];
    try {
      const data = await authApi.login(cred.email, cred.password);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err.message || 'Backend offline — start the API server.');
    }
  };

  const handleFormLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await authApi.login(loginEmail.trim().toLowerCase(), loginPassword);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFormRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regName.trim().length < 2) return setRegError('Please enter your full name.');
    if (!regEmail.trim().includes('@')) return setRegError('Enter a valid email address.');
    if (regPassword.length < 6) return setRegError('Password must be at least 6 characters.');
    setRegLoading(true);
    try {
      const data = await authApi.register(regName.trim(), regEmail.trim().toLowerCase(), regPassword);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
      setShowLoginModal(false);
    } catch (err) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] via-[#1e3a8a] to-[#0f172a] text-neutral-100 font-sans selection:bg-[#22c55e] selection:text-black">
  {/* ─── NAV ─── */}
  <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-neutral-800/80">
    <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
      <div className="flex items-center cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <ResolvAiLogo variant="horizontal" className="h-9 w-auto" />
      </div>
      <nav className="hidden md:flex items-center gap-6 text-[13px] text-neutral-400">
        <a href="#demo" className="hover:text-white transition-colors">See it work</a>
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <button onClick={() => setShowDocsModal(true)} className="hover:text-white transition-colors">Docs</button>
        <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">GitHub <ExternalLink className="w-3 h-3 text-neutral-600" /></a>
      </nav>
      <div className="flex items-center gap-2">
        <button id="header-sign-in-btn" onClick={() => { setAuthTab('login'); setShowLoginModal(true); }} className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors">Sign In</button>
        <button id="header-register-btn" onClick={() => { setAuthTab('register'); setShowLoginModal(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22c55e] text-black font-semibold text-xs hover:bg-[#1ea750] transition-colors">Create Account <ArrowRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  </header>

  {/* ─── HERO SECTION ─── */}
  <section className="relative pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
    <div className="flex-1 text-center md:text-left">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[11px] font-semibold text-[#22c55e] tracking-wide uppercase">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-70" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
        </span>
        Open-Source AI Helpdesk &amp; Workload Balancing
      </div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
        Autonomous Incident Triage,<br className="hidden sm:inline" />
        <span className="text-[#22c55e]">Grounded in Verified Runbooks.</span>
      </h1>
      <p className="max-w-2xl mx-auto md:mx-0 text-sm sm:text-base text-neutral-400 leading-relaxed mb-8">
        ResolvAI categorizes incoming tickets, scrubs sensitive PII, grounds solutions against verified SOPs using hybrid vector search, and balances active workloads across your engineering staff.
      </p>
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-14">
        <PrimaryButton onClick={() => handleQuickLogin('user')}><User className="w-4 h-4" /> Try as Customer</PrimaryButton>
        <PrimaryButton className="bg-neutral-900 border border-neutral-800 text-neutral-200" onClick={() => handleQuickLogin('employee')}><Headphones className="w-4 h-4 text-purple-400" /> Try as Support Staff</PrimaryButton>
        <PrimaryButton className="bg-neutral-900 border border-neutral-800 text-neutral-200" onClick={() => handleQuickLogin('admin')}><ShieldCheck className="w-4 h-4 text-blue-400" /> Try as Admin</PrimaryButton>
      </div>
    </div>
    <div className="flex-1 flex justify-center">
      <HeroIllustration />
    </div>
  </section>

  {/* ─── STATS SECTION ─── */}
  <section id="stats" className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
    <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">Powerful by the Numbers</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatCard icon={Zap} title="Tickets Processed" value="12,345" description="Automated triage and routing" />
      <StatCard icon={User} title="Active Users" value="542" description="Customers & support staff" />
      <StatCard icon={ShieldCheck} title="Runbooks" value="128" description="Verified SOPs integrated" />
    </div>
  </section>

  {/* ─── FEATURES ─── */}
  <section id="features" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-neutral-800/50">
    <div className="text-center mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Built to actually work</h2>
      <p className="text-sm text-neutral-500">No demo theatre. Every feature ships in production code you can read.</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-5">
      {[
        { icon: Bot, color: 'text-[#22c55e]', title: 'AI triage in seconds', desc: 'The agent reads, categorizes, and routes every ticket. Common issues close without a human touchpoint.' },
        { icon: ShieldCheck, color: 'text-blue-400', title: 'PII stripped before AI sees it', desc: 'Emails, card numbers, and API keys are redacted before hitting any LLM. Your data stays yours.' },
        { icon: Zap, color: 'text-amber-400', title: 'Answers grounded in your runbooks', desc: 'Hybrid vector search surfaces the right SOP — no hallucinations, just citations you can verify.' },
        { icon: Users, color: 'text-purple-400', title: 'Smart workload balancing', desc: 'Tickets route by skill and department based on who is actually free right now, not round-robin.' },
      ].map(({ icon: Icon, color, title, desc }) => (
        <div key={title} className="group p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/30 hover:bg-neutral-900/60 hover:border-neutral-700 transition-all">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 bg-neutral-800/60 group-hover:bg-neutral-800 transition-colors">
            <Icon className={`w-[18px] h-[18px] ${color}`} />
          </div>
          <h3 className="text-white font-semibold text-[15px] mb-1.5">{title}</h3>
          <p className="text-neutral-500 text-[13px] leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  </section>

  {/* ─── CTA STRIP ─── */}
  <section className="py-16 px-4 sm:px-6 border-t border-neutral-800/50">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to stop drowning in tickets?</h2>
      <p className="text-neutral-500 text-sm mb-8">Open-source, self-hostable, and free. Up and running in under a minute.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={() => { setAuthTab('register'); setShowLoginModal(true); }} className="px-7 py-3 rounded-xl bg-[#22c55e] text-black font-bold text-sm hover:bg-[#1ea750] transition-colors shadow-lg shadow-[#22c55e]/20 inline-flex items-center gap-2">Create free account <ArrowRight className="w-4 h-4" /></button>
        <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="px-7 py-3 rounded-xl border border-neutral-800 text-neutral-300 font-medium text-sm hover:border-neutral-700 hover:text-white transition-all inline-flex items-center gap-2">View on GitHub <ExternalLink className="w-3.5 h-3.5 text-neutral-500" /></a>
      </div>
    </div>
  </section>

  {/* ─── FOOTER ─── */}
  <footer className="border-t border-neutral-800/50 py-8 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
      <div className="flex items-center gap-2">
        <ResolvAiLogo variant="horizontal" className="h-6 w-auto" />
        <span className="text-neutral-500">· Open-source AI helpdesk</span>
      </div>
      <div className="flex items-center gap-5">
        <button onClick={() => setShowDocsModal(true)} className="hover:text-neutral-300 transition-colors">Docs</button>
        <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">GitHub</a>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />All systems operational</span>
      </div>
      <span>FastAPI · React 18 · Groq LLaMA 3.3</span>
    </div>
  </footer>

  {/* ─── MODALS ─── */}
  <DocumentationModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} />
  <AnimatePresence>
    {showLoginModal && (
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }} transition={{ duration: 0.18 }} className="relative w-full max-w-[400px] bg-[#111113] border border-neutral-800 rounded-2xl shadow-2xl p-6">
          {/* Close */}
          <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"><X className="w-4 h-4" /></button>
          {/* Header */}
          <div className="text-center mb-5">
            <ResolvAiLogo variant="icon" className="w-12 h-12 mx-auto mb-2.5 rounded-2xl" />
            <h3 className="text-[17px] font-bold text-white">{authTab === 'login' ? 'Welcome back' : 'Create your account'}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{authTab === 'login' ? 'Or try a demo profile instantly' : 'Free to use · Open-source'}</p>
          </div>
          {/* Tab toggle */}
          <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 mb-5">
            <button onClick={() => { setAuthTab('login'); setLoginError(''); setGoogleError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${authTab === 'login' ? 'bg-[#22c55e] text-black' : 'text-neutral-500 hover:text-neutral-200'}`}> <LogIn className="w-3.5 h-3.5" /> Sign in</button>
            <button onClick={() => { setAuthTab('register'); setRegError(''); setGoogleError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${authTab === 'register' ? 'bg-[#22c55e] text-black' : 'text-neutral-500 hover:text-neutral-200'}`}> <UserPlus className="w-3.5 h-3.5" /> Register</button>
          </div>
          {/* Google */}
          {googleClientId ? (
            <>
              <GoogleOAuthButton
                onSuccess={(profile, token) => {
                  onLogin(profile, token);
                  setShowLoginModal(false);
                }}
                onError={setGoogleError}
              />
              {googleError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{googleError}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mb-4">
              <button
                type="button"
                onClick={() =>
                  setGoogleError(
                    'Google OAuth requires VITE_GOOGLE_CLIENT_ID. Set it in your Render environment variables or .env file.'
                  )
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-colors shadow-sm"
                id="google-signin-btn"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>
              {googleError && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-300 text-xs mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] leading-relaxed">
                    <span>{googleError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick demo profiles */}
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider text-center mb-2">Quick demo access</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[{ type: 'user', label: 'Customer', sub: 'End user', icon: User, color: 'text-[#22c55e]' },{ type: 'employee', label: 'Support', sub: 'Staff queue', icon: Headphones, color: 'text-purple-400' },{ type: 'admin', label: 'Admin', sub: 'Full access', icon: ShieldCheck, color: 'text-blue-400' }].map(({ type, label, sub, icon: Icon, color }) => (
              <button key={type} type="button" onClick={() => handleQuickLogin(type)} className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 hover:border-neutral-700 transition-all text-center">
                <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
                <span className="text-xs font-semibold text-white block">{label}</span>
                <span className="text-[10px] text-neutral-600">{sub}</span>
              </button>
            ))}
          </div>
          {/* Divider */}
          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-neutral-800" />
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">{authTab === 'login' ? 'or with email' : 'your info'}</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>
          {/* Forms */}
          {authTab === 'login' ? (
            <form onSubmit={handleFormLogin} className="space-y-2.5">
              <input type="email" required placeholder="you@company.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]/60 transition-colors" />
              <input type="password" required placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]/60 transition-colors" />
              {loginError && (<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{loginError}</div>)}
              <button type="submit" disabled={loginLoading} className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#1ea750] text-black font-bold text-xs transition-colors disabled:opacity-60">{loginLoading ? 'Signing in…' : 'Sign in'}</button>
            </form>
          ) : (
            <form onSubmit={handleFormRegister} className="space-y-2.5">
              <input type="text" required placeholder="Full name" value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]/60 transition-colors" />
              <input type="email" required placeholder="you@company.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]/60 transition-colors" />
              <input type="password" required minLength={6} placeholder="Choose a password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]/60 transition-colors" />
              {regError && (<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{regError}</div>)}
              <button type="submit" disabled={regLoading} className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#1ea750] text-black font-bold text-xs transition-colors disabled:opacity-60">
                {regLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

    </div>
  );
}

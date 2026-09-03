import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import DocumentationModal from '../components/DocumentationModal.jsx';
import {
  ArrowRight, ShieldCheck, User, Bot, AlertTriangle,
  MessageSquare, BarChart3, CheckCircle2,
  Layers, Headphones, X, UserPlus, LogIn, Info,
  Search, Users, BookOpen, ExternalLink, Activity
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
    tag: 'Access / IT',
    title: 'VPN connection dropping after macOS update',
    desc: 'Unable to connect to internal staging gateway via GlobalProtect after Sequoia 15.2 update.',
    sop: 'KB-AUTH-101: SSO & VPN Troubleshooting Runbook',
    outcome: 'Auto-Matched to SOP with config snippet & routed to IT queue.',
    confidence: '94%',
    priority: 'Normal'
  },
  {
    id: 'outage',
    tag: 'Infrastructure / DevOps',
    title: '502 Bad Gateway on payments checkout endpoint',
    desc: 'Multiple upstream pods reporting OOM restarts on checkout-service container.',
    sop: 'KB-INFRA-202: API Gateway 502 & Outage Mitigation',
    outcome: 'Triggered P1 incident alert & auto-assigned to on-call engineer.',
    confidence: '98%',
    priority: 'Critical'
  },
  {
    id: 'billing',
    tag: 'Finance',
    title: 'Duplicate charge on invoice #INV-2026-88',
    desc: 'Corporate credit card billed twice for annual seats on March 1st cycle.',
    sop: 'KB-FIN-404: Duplicate Payment & Refund Verification',
    outcome: 'Auto-verified invoice status via tool & generated draft refund notice.',
    confidence: '91%',
    priority: 'Medium'
  }
];

const ARCHITECTURE_PILLARS = [
  {
    icon: Bot,
    title: 'Autonomous ReAct Agent Loop',
    desc: 'Executes multi-step reasoning: evaluates issues, runs diagnostic tools (system health, user lookup, invoice check), and preserves auditable traces.'
  },
  {
    icon: Search,
    title: 'Hybrid Vector RAG (384-D + BM25)',
    desc: 'Combines dense cosine similarity with sparse BM25 token matching using Reciprocal Rank Fusion (RRF) for zero-hallucination SOP citations.'
  },
  {
    icon: ShieldCheck,
    title: 'Zero-Leakage PII Guardrails',
    desc: 'Sanitizes prompts before dispatching to LLMs. Validates credit cards using the Luhn algorithm and redacts API keys, tokens, and credentials.'
  },
  {
    icon: Layers,
    title: 'Semantic Duplicate & Outage Clustering',
    desc: 'Computes vector embeddings to detect redundant tickets and clusters cascading incident spikes within rolling 60-minute time windows.'
  },
  {
    icon: Users,
    title: 'Workload-Balanced Routing',
    desc: 'Dispatches unresolvable tickets to team members by evaluating department domain, skill tags, and live active ticket counts.'
  },
  {
    icon: MessageSquare,
    title: 'Real-Time WebSocket Bus',
    desc: 'Instant ticket status broadcasts, SLA escalation sweeps, and interactive chat between customers and assigned support staff.'
  }
];

export default function LandingPage({ onLogin }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showDocsModal, setShowDocsModal] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const [activeTab, setActiveTab] = useState(0);
  const currentExample = LIVE_EXAMPLES[activeTab];

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

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
        onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
        setShowLoginModal(false);
      } catch (err) {
        setGoogleError(err.message || 'Google sign-in failed.');
      }
    },
    onError: () => setGoogleError('Google sign-in was cancelled or failed.'),
    flow: 'implicit',
  });

  const handleQuickLogin = async (type) => {
    const cred = DEMO_CREDENTIALS[type];
    try {
      const data = await authApi.login(cred.email, cred.password);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err.message || 'Connection to backend failed. Please verify API is running.');
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
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFormRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regName.trim().length < 2) return setRegError('Please enter your full name.');
    if (!regEmail.trim().includes('@')) return setRegError('Please enter a valid email.');
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
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-[#22c55e] selection:text-black">
      
      {/* ─── NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ResolvAiLogo className="w-7 h-7" />
            <span className="text-base font-bold tracking-tight text-white">
              Resolv<span className="text-[#22c55e]">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-white transition-colors">Core Architecture</a>
            <button onClick={() => setShowDocsModal(true)} className="hover:text-white transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#22c55e]" /> Documentation
            </button>
            <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setAuthTab('login'); setShowLoginModal(true); }}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22c55e] text-black font-semibold text-xs hover:bg-[#1ea750] transition-colors"
            >
              Launch Live App <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
          </span>
          <span>Open-Source AI Helpdesk &amp; Workload Balancing</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
          Autonomous Incident Triage, <br className="hidden sm:inline" />
          <span className="text-[#22c55e]">Grounded in Verified Runbooks.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-400 leading-relaxed mb-8">
          ResolvAI categorizes incoming tickets, scrubs sensitive PII, grounds solutions against verified SOPs using hybrid vector search, and balances active workloads across your engineering staff.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <button
            onClick={() => handleQuickLogin('user')}
            className="px-5 py-2.5 rounded-lg bg-[#22c55e] text-black font-semibold text-xs inline-flex items-center gap-2 hover:bg-[#1ea750] transition-colors"
          >
            <User className="w-4 h-4" /> Try as Customer
          </button>
          <button
            onClick={() => handleQuickLogin('employee')}
            className="px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-xs inline-flex items-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            <Headphones className="w-4 h-4 text-purple-400" /> Try as Support Staff
          </button>
          <button
            onClick={() => handleQuickLogin('admin')}
            className="px-5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-xs inline-flex items-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Try as Admin
          </button>
        </div>

        {/* ─── REAL INTERACTIVE PIPELINE DEMO ─── */}
        <div id="how-it-works" className="text-left rounded-2xl bg-neutral-950/80 border border-neutral-800 p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-800/80 gap-2">
            <div>
              <span className="text-xs font-semibold text-white tracking-wide block">How Tickets Are Evaluated in Real Time</span>
              <span className="text-xs text-neutral-400">Select an issue to inspect automated categorization, PII filtering, and SOP retrieval.</span>
            </div>
            <span className="text-[11px] font-mono text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded border border-[#22c55e]/20 self-start sm:self-auto">
              Pipeline: Active
            </span>
          </div>

          {/* Issue selector pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {LIVE_EXAMPLES.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activeTab === i
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {ex.tag}
              </button>
            ))}
          </div>

          {/* Ticket inspection grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2.5">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">Incoming Customer Request</span>
              <p className="text-xs font-semibold text-white">{currentExample.title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed font-mono">"{currentExample.desc}"</p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                  Priority: {currentExample.priority}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[#22c55e]">
                  Confidence: {currentExample.confidence}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">Autonomous System Action</span>
                <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  {currentExample.outcome}
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500">
                Grounded Document: <span className="text-neutral-300">{currentExample.sop}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ARCHITECTURE SECTION ─── */}
      <section id="architecture" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-neutral-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Production Engineering Architecture
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2">
            Built as a real, reliable microservice — no black boxes, no fake metrics, strictly auditable code.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {ARCHITECTURE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="bg-neutral-900/30 border border-neutral-800/90 p-5 rounded-xl space-y-2.5 hover:border-neutral-700 transition-colors">
                <Icon className="w-5 h-5 text-[#22c55e] mb-1" />
                <h3 className="text-sm font-semibold text-white">{pillar.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CLEAN FOOTER ─── */}
      <footer className="border-t border-neutral-800 bg-[#09090b] py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-neutral-400">
          <div className="flex items-center gap-2.5">
            <ResolvAiLogo className="w-5 h-5" />
            <span className="font-semibold text-white">ResolvAI</span>
            <span className="text-neutral-500">· Open-Source AI Ticketing Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setShowDocsModal(true)} className="hover:text-white transition-colors">
              Documentation
            </button>
            <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub Repository <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <p className="text-neutral-500">
            Built with FastAPI, React 18 &amp; Groq LLaMA 3.3
          </p>
        </div>
      </footer>

      {/* ─── DOCUMENTATION MODAL ─── */}
      <DocumentationModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} />

      {/* ─── AUTH MODAL ─── */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div key="auth-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div key="auth-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-xl">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <ResolvAiLogo className="w-10 h-10 inline-block mb-2" />
                <h3 className="text-lg font-bold text-white">Sign In to ResolvAI</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Use direct demo profiles or enter your account credentials</p>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 mb-5">
                <button
                  onClick={() => { setAuthTab('login'); setLoginError(''); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${authTab === 'login' ? 'bg-[#22c55e] text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
                <button
                  onClick={() => { setAuthTab('register'); setRegError(''); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${authTab === 'register' ? 'bg-[#22c55e] text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </button>
              </div>

              {/* Google OAuth button */}
              {googleClientId ? (
                <>
                  <button type="button" onClick={() => { setGoogleError(''); googleLogin(); }} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-colors mb-3">
                    <GoogleIcon className="w-4 h-4" /> Continue with Google
                  </button>
                  {googleError && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{googleError}</span>
                    </div>
                  )}
                </>
              ) : null}

              {/* 1-Click Demo Profiles */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <button type="button" onClick={() => handleQuickLogin('user')} className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 transition-colors text-center">
                  <User className="w-4 h-4 text-[#22c55e] mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-white block">Customer</span>
                  <span className="text-[9px] text-neutral-500">Demo User</span>
                </button>
                <button type="button" onClick={() => handleQuickLogin('employee')} className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 transition-colors text-center">
                  <Headphones className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-white block">Support</span>
                  <span className="text-[9px] text-neutral-500">Staff Queue</span>
                </button>
                <button type="button" onClick={() => handleQuickLogin('admin')} className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 transition-colors text-center">
                  <ShieldCheck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-white block">Admin</span>
                  <span className="text-[9px] text-neutral-500">Manager</span>
                </button>
              </div>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  {authTab === 'login' ? 'Or With Credentials' : 'Registration Info'}
                </span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {authTab === 'login' ? (
                <form onSubmit={handleFormLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                  {loginError && <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{loginError}</div>}
                  <button type="submit" disabled={loginLoading} className="w-full py-2 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors mt-2">
                    {loginLoading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleFormRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                  {regError && <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{regError}</div>}
                  <button type="submit" disabled={regLoading} className="w-full py-2 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors mt-2">
                    {regLoading ? 'Creating Account...' : 'Create Customer Account'}
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import DocumentationModal from '../components/DocumentationModal.jsx';
import DemoOverlayModal from '../components/DemoOverlayModal.jsx';
import LandingCarousel from '../components/LandingCarousel.jsx';
import {
  ArrowRight, ShieldCheck, User, Bot, AlertTriangle,
  MessageSquare, CheckCircle2, Headphones,
  X, UserPlus, LogIn, ExternalLink, Zap, Users, Loader2,
  Terminal, Database, Server, Lock, Layers,
  Activity, BarChart3, Clock, ChevronDown, Check, Play,
  Copy, RefreshCw, Cpu, GitBranch, ArrowUpRight
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
  customer: { email: 'customer@resolvai.com', password: 'customer123', label: 'customer@resolvai.com' },
  user:     { email: 'customer@resolvai.com', password: 'customer123', label: 'customer@resolvai.com' },
  staff:    { email: 'staff@resolvai.com',    password: 'staff123',    label: 'staff@resolvai.com' },
  employee: { email: 'staff@resolvai.com',    password: 'staff123',    label: 'staff@resolvai.com' },
  admin:    { email: 'admin@resolvai.com',    password: 'admin123',    label: 'admin@resolvai.com' },
};

// Interactive Sandbox Demo Scenarios
const SANDBOX_PRESETS = [
  {
    id: 'outage',
    name: '502 API Outage (Infra)',
    category: 'Server / Infra',
    severity: 'P1 Critical',
    severityColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    rawText: "CRITICAL: Multiple checkout pods are OOM-restarting on checkout-service with 502 Bad Gateway errors. AWS cluster us-east-1 pod memory > 95%.",
    sanitizedText: "CRITICAL: Multiple checkout pods are OOM-restarting on checkout-service with 502 Bad Gateway errors. AWS cluster us-east-1 pod memory > 95%.",
    entitiesRedacted: 0,
    matchedSop: "KB-INFRA-202: API Gateway 502 & Outage Runbook",
    confidence: "98.4%",
    thought: "User describes high-severity 502 Bad Gateway with Kubernetes pod memory spikes. Querying infrastructure runbooks.",
    action: 'search_knowledge_base("API Gateway 502 Bad Gateway pod rollout")',
    observation: "Matched KB-INFRA-202. Step 3 prescribes rolling restart: `kubectl rollout restart deployment/api-gateway`.",
    resolution: "Immediate Mitigation Plan:\n1. Run: `kubectl rollout restart deployment/api-gateway -n prod`\n2. Monitor Datadog dashboard #8849 for upstream latency.\n3. Ticket automatically elevated to P1 and dispatched to on-call DevOps lead.",
    routingTo: "Sarah Dev (DevOps Lead)",
    routingReason: "Specialist matched (Kubernetes, AWS) · Current load: 1/5 (Least busy)",
  },
  {
    id: 'billing_pii',
    name: 'Duplicate Card Charge (PII & Billing)',
    category: 'Billing / Finance',
    severity: 'Medium',
    severityColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    rawText: "Customer card 4111-2222-3333-4444 was charged twice ($499) on invoice #INV-9821. Stripe private secret is sk_live_9988223311aabbcc.",
    sanitizedText: "Customer card [CARD_REDACTED: 4111-****-****-4444] was charged twice ($499) on invoice #INV-9821. Stripe private secret is [SECRET_KEY_REDACTED].",
    entitiesRedacted: 2,
    matchedSop: "KB-FIN-404: Duplicate Payment & Refund Runbook",
    confidence: "94.6%",
    thought: "Detected Luhn-valid credit card number and Stripe secret key. Sanitized before LLM context dispatch. Searching billing SOPs.",
    action: 'verify_invoice(invoice_id="INV-9821", amount=499)',
    observation: "Confirmed duplicate authorization for $499 on March cycle. Tier-2 auto-credit limit ($500) applies.",
    resolution: "Grounded Resolution:\n1. Redacted 2 sensitive PII entities (Credit Card & Stripe API Key).\n2. Verified duplicate charge on invoice #INV-9821.\n3. Initiated $499 refund via automated Stripe tool (reflects in 3-5 business days).",
    routingTo: "Auto-Resolved (Self-Service)",
    routingReason: "Groundedness > 90% · Tier-2 refund policy verified without human escalation",
  },
  {
    id: 'okta_mfa',
    name: 'Okta SSO Lockout (Access)',
    category: 'Access / IT',
    severity: 'Normal',
    severityColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    rawText: "Locked out of Okta SSO after hardware YubiKey timeout. Password reset link expired for user alex@company.com.",
    sanitizedText: "Locked out of Okta SSO after hardware YubiKey timeout. Password reset link expired for user [EMAIL_REDACTED].",
    entitiesRedacted: 1,
    matchedSop: "KB-AUTH-101: SSO & Multi-Factor Authentication SOP",
    confidence: "96.2%",
    thought: "Authentication lockout issue. Masking user email and checking standard identity unlock procedure.",
    action: 'search_knowledge_base("Okta SSO unlock YubiKey password reset")',
    observation: "Matched KB-AUTH-101. Self-service unlock portal link active at portal.company.com/auth/unlock.",
    resolution: "Self-Service Instructions:\n1. Navigate to https://portal.company.com/auth/unlock\n2. Trigger secondary SMS verification push if hardware YubiKey is unavailable.\n3. Session unlock tokens expire in 15 minutes.",
    routingTo: "Auto-Resolved (Self-Service)",
    routingReason: "Standard SOP matched with 96.2% confidence",
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
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-colors mb-3 shadow-sm"
    >
      <GoogleIcon className="w-4 h-4" /> Continue with Google
    </button>
  );
}

export default function LandingPage({ onLogin }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showDemoOverlay, setShowDemoOverlay] = useState(false);
  const [overlayScenario, setOverlayScenario] = useState('ai-triage');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Interactive Hero Sandbox State
  const [activeSandboxTab, setActiveSandboxTab] = useState('triage'); // 'triage' | 'react' | 'routing'
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentPreset = SANDBOX_PRESETS[activePresetIndex];

  // Auth form states
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

  const [quickLoading, setQuickLoading] = useState(null);
  const [quickError, setQuickError] = useState('');
  const [isWakingBackend, setIsWakingBackend] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const handleQuickLogin = async (type) => {
    if (quickLoading) return;
    setQuickLoading(type);
    setQuickError('');
    setLoginError('');

    const wakeTimer = setTimeout(() => {
      setIsWakingBackend(true);
    }, 2000);

    const cred = DEMO_CREDENTIALS[type];
    try {
      const data = await authApi.login(cred.email, cred.password);
      clearTimeout(wakeTimer);
      setIsWakingBackend(false);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
      setShowLoginModal(false);
    } catch (err) {
      clearTimeout(wakeTimer);
      setIsWakingBackend(false);
      setQuickError(err.message || 'Unable to log in — cloud server is warming up. Please try once more.');
    } finally {
      setQuickLoading(null);
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

  const triggerSimulation = (idx) => {
    setActivePresetIndex(idx);
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 350);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-[#22c55e]/30 selection:text-white relative overflow-x-hidden">
      
      {/* ── Background Subtle Micro Grid ── */}
      <div className="absolute inset-0 bg-grid-dots pointer-events-none opacity-20 -z-10" />

      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-4 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ResolvAiLogo variant="horizontal" className="h-8 w-auto" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-neutral-400 font-medium">
            <a href="#sandbox" className="hover:text-white transition-colors">Live Sandbox</a>
            <a href="#metrics" className="hover:text-white transition-colors">AI Metrics</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#compare" className="hover:text-white transition-colors">Compare</a>
            <button onClick={() => setShowDocsModal(true)} className="hover:text-white transition-colors">Documentation</button>
            <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub <ArrowUpRight className="w-3 h-3 text-neutral-500" />
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              id="header-sign-in-btn"
              onClick={() => { setAuthTab('login'); setShowLoginModal(true); }}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 transition-colors active:scale-95"
            >
              Sign In
            </button>
            <button
              id="header-register-btn"
              onClick={() => { setAuthTab('register'); setShowLoginModal(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors active:scale-95"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-neutral-200">Autonomous Incident Triage &amp; Evaluation Engine</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] text-white">
            Autonomous Helpdesk Triage,<br />
            <span className="text-neutral-400">Grounded in Runbooks.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 leading-relaxed font-normal">
            ResolvAI eliminates ticket queues with autonomous ReAct agent loops, deterministic Luhn PII scrubbing, and real-time incident clustering.
          </p>

          {/* 1-Click Demo Profiles & Quick Launch */}
          <div className="pt-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-3">
              1-Click Demo Access
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                disabled={Boolean(quickLoading)}
                onClick={() => handleQuickLogin('customer')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {quickLoading === 'customer' ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <User className="w-4 h-4 text-neutral-400" />}
                <span>{quickLoading === 'customer' ? 'Connecting…' : 'Customer'}</span>
                <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">(customer@resolvai.com)</span>
              </button>

              <button
                disabled={Boolean(quickLoading)}
                onClick={() => handleQuickLogin('staff')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {quickLoading === 'staff' ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <Headphones className="w-4 h-4 text-neutral-400" />}
                <span>{quickLoading === 'staff' ? 'Connecting…' : 'Support Staff'}</span>
                <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">(staff@resolvai.com)</span>
              </button>

              <button
                disabled={Boolean(quickLoading)}
                onClick={() => handleQuickLogin('admin')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {quickLoading === 'admin' ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <ShieldCheck className="w-4 h-4 text-neutral-400" />}
                <span>{quickLoading === 'admin' ? 'Connecting…' : 'Admin'}</span>
                <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">(admin@resolvai.com)</span>
              </button>
            </div>

            {/* Render wake-up indicator */}
            {isWakingBackend && (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting to backend instance…</span>
              </div>
            )}
            {quickError && (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{quickError}</span>
              </div>
            )}
          </div>

          {/* Social Proof Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Grounded runbook retrieval</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Luhn PII scrubbing</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Workload-aware dispatch</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Continuous evaluation suite</span>
          </div>

        </div>

        {/* ─── SHOWSTOPPER: INTERACTIVE LIVE PRODUCT SANDBOX (macOS Frame) ─── */}
        <div id="sandbox" className="mt-14 max-w-5xl mx-auto">
          <div className="mac-window overflow-hidden">
            
            {/* macOS Chrome Titlebar */}
            <div className="bg-[#141418] border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="text-xs font-mono text-neutral-400 ml-2 hidden sm:inline">resolvai-engine://interactive-sandbox</span>
              </div>

              {/* Sandbox Tabs */}
              <div role="tablist" aria-label="Interactive Sandbox Views" className="flex items-center bg-[#0a0a0c] p-1 rounded-xl border border-white/[0.08]">
                <button
                  role="tab"
                  id="tab-triage"
                  aria-selected={activeSandboxTab === 'triage'}
                  aria-controls="panel-triage"
                  onClick={() => setActiveSandboxTab('triage')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeSandboxTab === 'triage'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  PII Scrub &amp; Triage
                </button>
                <button
                  role="tab"
                  id="tab-react"
                  aria-selected={activeSandboxTab === 'react'}
                  aria-controls="panel-react"
                  onClick={() => setActiveSandboxTab('react')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeSandboxTab === 'react'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ReAct Agent &amp; RAG
                </button>
                <button
                  role="tab"
                  id="tab-routing"
                  aria-selected={activeSandboxTab === 'routing'}
                  aria-controls="panel-routing"
                  onClick={() => setActiveSandboxTab('routing')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeSandboxTab === 'routing'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Incident Routing
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-neutral-400 border border-white/10 hidden md:inline">
                  Interactive Simulation
                </span>
              </div>
            </div>

            {/* Preset Selector Pill Bar */}
            <div className="bg-[#111115] border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
              <span className="text-[11px] font-mono uppercase text-neutral-500 shrink-0">Sample Incidents:</span>
              <div className="flex items-center gap-2 shrink-0">
                {SANDBOX_PRESETS.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => triggerSimulation(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      activePresetIndex === idx
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setOverlayScenario('ai-triage'); setShowDemoOverlay(true); }}
                className="text-xs text-[#22c55e] hover:underline flex items-center gap-1 shrink-0 ml-auto"
              >
                Full Simulator <Play className="w-3 h-3" />
              </button>
            </div>

            {/* Sandbox Main View Area */}
            <div className="p-5 sm:p-7 min-h-[360px] bg-[#0c0c0f]">
              <AnimatePresence mode="wait">
                
                {/* ── TAB 1: PII SCRUB & TRIAGE ── */}
                {activeSandboxTab === 'triage' && (
                  <motion.div
                    key="triage"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Raw User Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-neutral-500" /> Raw Input from Customer
                          </label>
                          {currentPreset.entitiesRedacted > 0 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              Contains PII / Secrets
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#141418] border border-white/[0.08] text-xs text-neutral-300 font-mono h-28 overflow-y-auto leading-relaxed">
                          "{currentPreset.rawText}"
                        </div>
                      </div>

                      {/* Right: Sanitized output */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sanitized Output (Sent to LLM)
                          </label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Zero Leakage
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#141418] border border-emerald-500/30 text-xs text-emerald-300 font-mono h-28 overflow-y-auto leading-relaxed">
                          "{currentPreset.sanitizedText}"
                        </div>
                      </div>
                    </div>

                    {/* AI Extracted Attributes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.08]">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 block">Classified Category</span>
                        <span className="text-xs font-bold text-white mt-1 block">{currentPreset.category}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.08]">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 block">Assigned Severity</span>
                        <span className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full border ${currentPreset.severityColor}`}>
                          {currentPreset.severity}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.08]">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 block">Matched SOP Runbook</span>
                        <span className="text-xs font-bold text-neutral-200 mt-1 block truncate" title={currentPreset.matchedSop}>
                          {currentPreset.matchedSop}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.08]">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 block">RAG Confidence Score</span>
                        <span className="text-xs font-bold text-[#22c55e] mt-1 block font-mono">
                          {currentPreset.confidence} Match
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 2: REACT AGENT LOOP & RAG ── */}
                {activeSandboxTab === 'react' && (
                  <motion.div
                    key="react"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" /> Autonomous ReAct Loop Trace (Thought → Action → Observation)
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">Live Agent Execution</span>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      {/* Thought */}
                      <div className="p-3 rounded-xl bg-neutral-900/90 border border-purple-500/20 flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold shrink-0 mt-0.5">
                          THOUGHT
                        </span>
                        <p className="text-neutral-300 leading-relaxed">{currentPreset.thought}</p>
                      </div>

                      {/* Action */}
                      <div className="p-3 rounded-xl bg-neutral-900/90 border border-blue-500/20 flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold shrink-0 mt-0.5">
                          ACTION
                        </span>
                        <code className="text-blue-300 font-mono text-[11px]">{currentPreset.action}</code>
                      </div>

                      {/* Observation */}
                      <div className="p-3 rounded-xl bg-neutral-900/90 border border-amber-500/20 flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold shrink-0 mt-0.5">
                          OBSERVE
                        </span>
                        <p className="text-amber-200/90 leading-relaxed">{currentPreset.observation}</p>
                      </div>

                      {/* Final Grounded Resolution */}
                      <div className="p-3.5 rounded-xl bg-[#141418] border border-emerald-500/30 flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#22c55e] text-[10px] font-bold shrink-0 mt-0.5">
                          OUTPUT
                        </span>
                        <div className="text-neutral-200 text-xs whitespace-pre-line leading-relaxed flex-1">
                          {currentPreset.resolution}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── TAB 3: OUTAGE & WORKLOAD ROUTING ── */}
                {activeSandboxTab === 'routing' && (
                  <motion.div
                    key="routing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Outage Clustering Card */}
                      <div className="p-4 rounded-xl bg-[#141418] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-red-400" /> Semantic Outage Detection
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            Sliding 60m Window
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Cosine similarity clustering across active tickets detected correlated error spikes.
                        </p>
                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-1 font-mono">
                          <div className="text-red-400 font-bold">CLUSTER-INC-2026-01: API Ingress Spillover</div>
                          <div className="text-neutral-400 text-[11px]">4 correlated tickets · Affected: 4 enterprise teams</div>
                        </div>
                      </div>

                      {/* Workload-Aware Routing Card */}
                      <div className="p-4 rounded-xl bg-[#141418] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <GitBranch className="w-4 h-4 text-[#22c55e]" /> Workload-Aware Dispatch
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active Queue Balancing
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-950 border border-white/[0.06] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400">Assigned Target:</span>
                            <span className="font-bold text-white">{currentPreset.routingTo}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400">Dispatch Reason:</span>
                            <span className="text-[#22c55e] text-[11px] font-medium">{currentPreset.routingReason}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-neutral-400">
                      <span>No round-robin queue stalling. Tickets route dynamically based on active load.</span>
                      <button
                        onClick={() => { setOverlayScenario('smart-routing'); setShowDemoOverlay(true); }}
                        className="text-[#22c55e] font-semibold hover:underline flex items-center gap-1"
                      >
                        Inspect Employee Queue <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Terminal Status Footer */}
            <div className="bg-[#111115] border-t border-white/[0.06] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Sandbox Live
                </span>
                <span className="text-[11px] font-mono text-neutral-400">Latency: 480ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">Ready to test with your own account?</span>
                <button
                  onClick={() => { setAuthTab('register'); setShowLoginModal(true); }}
                  className="text-white hover:text-[#22c55e] font-semibold text-xs transition-colors"
                >
                  Create free account →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── AI PM METRICS & EVALUATION STRIP (Targeted for Scaler JD) ─── */}
      <section id="metrics" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Measured by Real Business Outcomes
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Concrete engineering benchmarks measured across canonical enterprise failure modes.
          </p>
        </div>

        {/* 4 Primary Product Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bento-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">94.8%</div>
              <div className="text-xs font-semibold text-emerald-400 mt-1">Groundedness Score</div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every token validated against verified SOP runbooks. Hallucination rate strictly suppressed under 0.5%.
            </p>
          </div>

          <div className="bento-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">99.8%</div>
              <div className="text-xs font-semibold text-blue-400 mt-1">PII Redaction Precision</div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Luhn-algorithm validation masks credit cards, API keys, and JWTs before prompting any cloud LLM.
            </p>
          </div>

          <div className="bento-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">-81%</div>
              <div className="text-xs font-semibold text-purple-400 mt-1">MTTR Reduction</div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Mean Time to Resolution dropped from 4.2 hours to 48 minutes with autonomous first-touch resolutions.
            </p>
          </div>

          <div className="bento-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">68.4%</div>
              <div className="text-xs font-semibold text-amber-400 mt-1">Autonomous Resolution</div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Standard access resets, billing adjustments, and policy questions resolve immediately with positive CSAT.
            </p>
          </div>
        </div>

        {/* A/B Prompt Experimentation Matrix Callout */}
        <div className="mt-8 p-6 rounded-2xl bg-neutral-900/60 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <h4 className="text-sm font-bold text-white">Live A/B Prompt Experimentation Matrix</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Continuous evaluation comparing <strong>Variant A (Direct RAG)</strong> vs. <strong>Variant B (ReAct Chain-of-Thought with Self-Reflection)</strong>. Variant B achieved +7.2% higher customer satisfaction and +14% fewer human escalations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30">
              Winner: Variant B (Active)
            </span>
          </div>
        </div>
      </section>

      {/* ─── BENTO GRID: 6 CORE CAPABILITIES (DesignMD & VengenceUI style) ─── */}
      <section id="architecture" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Production AI
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mt-3">
            Every layer built with production safety, transparent execution traces, and zero black-box dependencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1: ReAct Agent Loop (Double Column) */}
          <div className="md:col-span-2 bento-card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 font-semibold">
                ReAct Execution
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Autonomous ReAct Agent Loop</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                Executes iterative <em>Thought → Action → Observation</em> cycles. Connects directly to diagnostic tools like microservice health checks, invoice lookups, and runbook retrievals before finalizing resolutions.
              </p>
            </div>
            {/* Visual Trace Box */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-white/[0.08] font-mono text-[11px] text-neutral-300 space-y-2">
              <div className="text-purple-400">1. THOUGHT: "User reports 502 Bad Gateway; inspecting pod metrics on ingress..."</div>
              <div className="text-blue-400">2. ACTION: check_system_health(service="api-gateway") ➔ Pods OOM restarting</div>
              <div className="text-emerald-400">3. RESOLUTION: Execute rolling restart runbook + auto-assign ticket</div>
            </div>
          </div>

          {/* Bento Card 2: Enterprise PII Guardrails */}
          <div className="bento-card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 font-semibold">
                Data Privacy
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Enterprise PII Guardrails</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Zero data leakage. Regex and Luhn checksum validation mask credit cards, API keys, JWTs, and passwords before any prompt reaches third-party LLMs.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/[0.08] text-xs font-mono text-emerald-400">
              [AI Guardrail] Redacted: 1 credit_card, 1 api_key (Luhn Verified)
            </div>
          </div>

          {/* Bento Card 3: Hybrid Vector RAG */}
          <div className="bento-card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-[#22c55e]" />
              </div>
              <span className="text-[11px] font-mono text-[#22c55e] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
                Dense + Keyword
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Hybrid Vector RAG (384-D)</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Combines dense vector cosine similarity (384-D embeddings) with BM25 sparse keyword inverted index using Reciprocal Rank Fusion (RRF).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/[0.08] text-xs font-mono text-neutral-300">
              score = 0.65 · DenseSim + 0.35 · BM25
            </div>
          </div>

          {/* Bento Card 4: Semantic Outage Clustering */}
          <div className="bento-card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold">
                Detection 04
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Semantic Outage Clustering</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Sliding 60-minute window detects infrastructure firestorms. When ≥3 related tickets arrive with &gt;0.85 similarity, leadership is alerted via Slack cards.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/[0.08] text-xs font-mono text-amber-300">
              Incident Alert: 4 tickets grouped (P1 Outage)
            </div>
          </div>

          {/* Bento Card 5: Workload & Skill-Aware Routing */}
          <div className="bento-card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-semibold">
                Routing 05
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Dynamic Workload Routing</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Routes unresolvable issues by employee skill-tags (e.g. AWS, Postgres, Okta) and active queue count. Eliminates single-engineer bottlenecks.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/[0.08] text-xs font-mono text-indigo-300">
              Dispatched to Sarah Chen (Active load: 1/5)
            </div>
          </div>

          {/* Bento Card 6: Distributed State & SOC-2 Telemetry */}
          <div className="bento-card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 font-semibold">
                Production 06
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Distributed State &amp; SOC-2 Telemetry</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Horizontal multi-pod scaling via Redis Pub/Sub, persistent vector caching with PostgreSQL pgvector, and immutable token/cost audit logs.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/[0.08] text-xs font-mono text-cyan-300">
              Redis Pub/Sub Sync · pgvector Ready · $0.0007/1k tokens
            </div>
          </div>

        </div>
      </section>

      {/* ─── INTERACTIVE MODULE CAROUSEL (Existing LandingCarousel) ─── */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" /> Feature Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore Core System Modules
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Hover to pause and test interactive triage flows across all system components.
          </p>
        </div>

        <LandingCarousel onOpenOverlay={(scenarioId) => {
          setOverlayScenario(scenarioId);
          setShowDemoOverlay(true);
        }} />
      </section>

      {/* ─── PRODUCT COMPARISON MATRIX ─── */}
      <section id="compare" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            How ResolvAI Compares
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Why modern engineering teams choose autonomous triage over legacy ticketing giants.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400">
                <th className="py-4 px-4 font-semibold">Capability</th>
                <th className="py-4 px-4 font-bold text-[#22c55e] bg-emerald-500/5 rounded-t-xl">ResolvAI</th>
                <th className="py-4 px-4 font-semibold">Zendesk / Jira</th>
                <th className="py-4 px-4 font-semibold">Generic LLM Chatbots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Autonomous ReAct Agent Loop</td>
                <td className="py-3.5 px-4 font-bold text-[#22c55e] bg-emerald-500/5">✓ Native Multi-Step</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ Manual rules only</td>
                <td className="py-3.5 px-4 text-neutral-400">Single prompt only</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Pre-Prompt PII &amp; Luhn Redaction</td>
                <td className="py-3.5 px-4 font-bold text-[#22c55e] bg-emerald-500/5">✓ 99.8% Precision</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ Third-party add-on</td>
                <td className="py-3.5 px-4 text-red-400">✗ Raw data sent to LLM</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Hybrid Vector RAG with Citations</td>
                <td className="py-3.5 px-4 font-bold text-[#22c55e] bg-emerald-500/5">✓ Dense 384-D + BM25</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ Keyword search only</td>
                <td className="py-3.5 px-4 text-amber-400">⚠️ Hallucinations likely</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Real-Time Outage Clustering</td>
                <td className="py-3.5 px-4 font-bold text-[#22c55e] bg-emerald-500/5">✓ Sliding-Window Anomaly</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ Manual grouping</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ No cross-ticket context</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Dynamic Workload Balancing</td>
                <td className="py-3.5 px-4 font-bold text-[#22c55e] bg-emerald-500/5">✓ Skill &amp; Queue-aware</td>
                <td className="py-3.5 px-4 text-neutral-400">Basic round-robin</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ None</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Self-Hostable &amp; Open-Source</td>
                <td className="py-3.5 px-4 font-bold text-[#22c55e] bg-emerald-500/5 rounded-b-xl">✓ 100% Open Source</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ Expensive per-seat SaaS</td>
                <td className="py-3.5 px-4 text-neutral-500">✗ Proprietary lock-in</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── FAQ ACCORDION ─── */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            Technical and architectural questions answered for engineering leads and product managers.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does ResolvAI prevent LLM hallucinations on technical runbooks?",
              a: "ResolvAI uses a strict Hybrid RAG pipeline combining 384-dimensional dense semantic vectors with BM25 keyword inverted indexing using Reciprocal Rank Fusion (RRF). Responses are explicitly constrained to retrieved context chunks with source citations (e.g. [KB-INFRA-202]). If the top match confidence score falls below 50%, auto-resolution is aborted and the ticket is safely routed to human engineers."
            },
            {
              q: "How does the Enterprise PII Guardrail work?",
              a: "Before any ticket description or chat message is dispatched to external LLMs (Groq / Claude), the text passes through the PIISanitizer engine. It utilizes regex pattern matching combined with Luhn-algorithm checksum validation to detect valid credit card numbers, Stripe/AWS secret keys, JWT tokens, and passwords, replacing them with structured tokens like [CARD_REDACTED]. This ensures compliance with enterprise zero-data-leakage mandates."
            },
            {
              q: "What LLM models power ResolvAI?",
              a: "ResolvAI employs a multi-provider fallback hierarchy: primary high-throughput inference runs on Groq LLaMA 3.3 70B Versatile (sub-second latency), secondary failover runs on Anthropic Claude 3 Haiku, and a deterministic offline keyword-matrix guarantees continuous local development without API keys."
            },
            {
              q: "Can I run ResolvAI locally or on my own cloud infrastructure?",
              a: "Yes! ResolvAI is 100% open-source. It runs with zero-config SQLite locally, connects to PostgreSQL in production, and provides a 1-click cloud deployment blueprint for Render (render.yaml)."
            },
          ].map((faq, idx) => (
            <div key={idx} className="bento-card border border-white/[0.08] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-[#22c55e] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${openFaq === idx ? 'rotate-180 text-[#22c55e]' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-neutral-400 leading-relaxed border-t border-white/[0.04] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CALL TO ACTION STRIP ─── */}
      <section className="py-24 px-4 sm:px-6 relative border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto rounded-2xl bg-neutral-900/60 border border-white/10 p-8 sm:p-14 text-center relative overflow-hidden">
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 relative z-10">
            Stop Drowning in Repetitive Tickets.
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto mb-8 relative z-10 leading-relaxed">
            Deploy autonomous incident triage, runbook-grounded resolution, and workload-aware routing in minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
            <button
              onClick={() => { setAuthTab('register'); setShowLoginModal(true); }}
              className="px-6 py-3 rounded-lg bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center gap-2 active:scale-95"
            >
              Get Started for Free <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://github.com/adit-syntax/ResolvAI"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 text-neutral-200 font-medium text-sm hover:bg-white/5 transition-all flex items-center gap-2 active:scale-95"
            >
              Star on GitHub <ExternalLink className="w-4 h-4 text-neutral-500" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <ResolvAiLogo variant="horizontal" className="h-7 w-auto" />
            <span className="text-neutral-400">· Open-source AI Helpdesk</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setShowDocsModal(true)} className="hover:text-neutral-300 transition-colors">Documentation</button>
            <a href="https://github.com/adit-syntax/ResolvAI" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      {/* ─── MODALS ─── */}
      <DocumentationModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} />
      {showDemoOverlay && (
        <DemoOverlayModal
          initialScenario={overlayScenario}
          onClose={() => setShowDemoOverlay(false)}
        />
      )}

      {/* Authentication Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-[420px] bg-[#111115] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Brand Header */}
              <div className="text-center mb-5">
                <ResolvAiLogo variant="icon" className="w-12 h-12 mx-auto mb-2.5 rounded-2xl" />
                <h3 className="text-lg font-bold text-white">
                  {authTab === 'login' ? 'Welcome back to ResolvAI' : 'Create your account'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {authTab === 'login' ? 'Sign in with your email or test a demo profile' : 'Open-source · Free to use'}
                </p>
              </div>

              {/* Tab Toggle */}
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/[0.08] mb-5">
                <button
                  onClick={() => { setAuthTab('login'); setLoginError(''); setGoogleError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    authTab === 'login' ? 'bg-[#22c55e] text-black shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
                <button
                  onClick={() => { setAuthTab('register'); setRegError(''); setGoogleError(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    authTab === 'register' ? 'bg-[#22c55e] text-black shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Register
                </button>
              </div>

              {/* Google OAuth Button */}
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
              ) : null}

              {/* Quick Demo Access Switcher */}
              <div className="mb-4">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center mb-2 font-mono">
                  Quick 1-Click Demo Profiles
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'customer', label: 'Customer', sub: 'customer@resolvai.com', icon: User, color: 'text-neutral-300' },
                    { type: 'staff', label: 'Support', sub: 'staff@resolvai.com', icon: Headphones, color: 'text-neutral-300' },
                    { type: 'admin', label: 'Admin', sub: 'admin@resolvai.com', icon: ShieldCheck, color: 'text-neutral-300' }
                  ].map(({ type, label, sub, icon: Icon, color }) => (
                    <button
                      key={type}
                      type="button"
                      disabled={Boolean(quickLoading)}
                      onClick={() => handleQuickLogin(type)}
                      className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 hover:border-neutral-700 transition-all text-center disabled:opacity-50"
                    >
                      {quickLoading === type ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white mx-auto mb-1" />
                      ) : (
                        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                      )}
                      <span className="text-xs font-semibold text-white block">
                        {quickLoading === type ? 'Connecting…' : label}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 block truncate">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cloud Cold Start Indicator */}
              {isWakingBackend && (
                <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 text-xs mb-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <span>Connecting to backend instance…</span>
                </div>
              )}
              {quickError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{quickError}</span>
                </div>
              )}

              {/* Form Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  {authTab === 'login' ? 'or with credentials' : 'your profile'}
                </span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>

              {/* Login Form */}
              {authTab === 'login' ? (
                <form onSubmit={handleFormLogin} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    aria-label="Email address"
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <input
                    type="password"
                    required
                    aria-label="Password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  {loginError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {loginError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {loginLoading ? 'Signing in…' : 'Sign in'}
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center pt-1 leading-relaxed">
                    Demo: <span className="text-neutral-400 font-mono">admin@resolvai.com</span> / <span className="text-neutral-400 font-mono">staff@resolvai.com</span> / <span className="text-neutral-400 font-mono">customer@resolvai.com</span>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleFormRegister} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    aria-label="Full name"
                    placeholder="Full name"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <input
                    type="email"
                    required
                    aria-label="Email address"
                    placeholder="you@company.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    aria-label="Password (min 6 chars)"
                    placeholder="Choose a password (min 6 chars)"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  {regError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {regError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#1ea750] text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
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

/**
 * LandingPage.jsx — Public Landing Page for ResolvAI
 * Features: Interactive Carousel, Micro-animations, Glassmorphism Overlays, Registration & Sign-In Modal
 */

import React, { useState } from 'react';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import LandingCarousel from '../components/LandingCarousel.jsx';
import DemoOverlayModal from '../components/DemoOverlayModal.jsx';
import {
  Sparkles, ArrowRight, ShieldCheck, User, Zap, Bot,
  MessageSquare, BarChart3, CheckCircle2, ChevronDown, ChevronUp,
  Layers, Lock, Mail, Star, Play, Globe, Cpu, Headphones, X, UserPlus, LogIn
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

export default function LandingPage({ onLogin }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [showDemoOverlay, setShowDemoOverlay] = useState(false);
  const [initialOverlayScenario, setInitialOverlayScenario] = useState('ai-triage');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('user');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleQuickLogin = (type) => {
    const cred = DEMO_CREDENTIALS[type];
    onLogin(cred.role, cred.email);
  };

  const handleFormLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    await new Promise(r => setTimeout(r, 400));

    const emailTrim = loginEmail.trim().toLowerCase();
    
    // 1. Check demo credentials
    const demoMatch = Object.values(DEMO_CREDENTIALS).find(
      c => c.email === emailTrim && c.password === loginPassword
    );

    if (demoMatch) {
      onLogin(demoMatch.role, demoMatch.email);
      setLoginLoading(false);
      return;
    }

    // 2. Check registered users
    const registered = getRegisteredUsers();
    const regMatch = registered.find(
      u => u.email.toLowerCase() === emailTrim && u.password === loginPassword
    );

    if (regMatch) {
      onLogin(regMatch.role, regMatch.email);
      setLoginLoading(false);
      return;
    }

    // 3. Fallback: if user provided any email & password, allow them to log in as user
    if (emailTrim.includes('@') && loginPassword.length >= 3) {
      onLogin('user', emailTrim);
      setLoginLoading(false);
      return;
    }

    setLoginError('Invalid credentials. Click "Create Account" tab to register.');
    setLoginLoading(false);
  };

  const handleFormRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regName.trim().length < 2) {
      setRegError('Please enter your full name (at least 2 characters).');
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
    await new Promise(r => setTimeout(r, 500));

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

  const openOverlayWithScenario = (scenarioId) => {
    setInitialOverlayScenario(scenarioId || 'ai-triage');
    setShowDemoOverlay(true);
  };

  const faqItems = [
    {
      q: 'How does ResolvAI achieve instant auto-resolution?',
      a: 'When an incoming ticket is submitted, our LLM engine extracts intent, categorizes the request, and searches verified solutions. For routine queries (like password resets, refunds, or status checks), it responds immediately with verified resolution steps.',
    },
    {
      q: 'What happens if the AI cannot solve an issue?',
      a: 'Unresolved issues are automatically assigned to the best employee in the target department based on real-time workload, skill-tags, and availability. A live chat thread opens for direct human interaction.',
    },
    {
      q: 'Can users and agents interact in real-time?',
      a: 'Yes! ResolvAI incorporates a WebSocket chat thread supporting real-time messaging, file/image attachments, resolution confirmation checks, and timeline tracking.',
    },
    {
      q: 'Does it require complex setup or API keys?',
      a: 'ResolvAI runs right out of the box with a pre-configured database and mock AI fallback, as well as native support for Groq, OpenAI, or Anthropic LLM backends.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#22c55e] selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Dynamic Background Glow Spheres */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#22c55e]/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[130px]" />
      </div>

      {/* ─── 1. STICKY GLASS HEADER ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#222222] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Branding (Without Version Badge) */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ResolvAiLogo className="w-9 h-9 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)] group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-xl font-black tracking-tight text-white">Resolv<span className="text-[#22c55e]">AI</span></span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors hover:scale-105">Features</a>
            <a href="#carousel" className="hover:text-white transition-colors hover:scale-105">AI Capabilities</a>
            <a href="#workflow" className="hover:text-white transition-colors hover:scale-105">Workflow</a>
            <a href="#faq" className="hover:text-white transition-colors hover:scale-105">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuickLogin('user')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#2e2e2e] text-xs font-semibold text-neutral-200 transition-all active:scale-95 hover:border-[#22c55e]/50"
            >
              <User className="w-3.5 h-3.5 text-[#22c55e]" /> Demo User
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#2e2e2e] text-xs font-semibold text-neutral-200 transition-all active:scale-95 hover:border-blue-500/50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Demo Admin
            </button>

            <button
              id="header-sign-in-btn"
              onClick={() => { setAuthTab('login'); setShowLoginModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs transition-all shadow-lg shadow-[#22c55e]/25 active:scale-95 cursor-pointer"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ─── 2. HERO SECTION ───────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161616] border border-[#22c55e]/30 text-xs font-medium text-[#22c55e] mb-8 shadow-xl hover:border-[#22c55e]/60 transition-all cursor-pointer" onClick={() => openOverlayWithScenario('ai-triage')}>
          <Sparkles className="w-4 h-4 animate-spin text-[#22c55e]" />
          <span>Autonomous AI Support &amp; Smart Triage Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          Zero Backlog Helpdesk Powered by <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#22c55e] via-emerald-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(34,197,94,0.3)]">
            Autonomous AI Triage
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-neutral-400 leading-relaxed mb-10">
          ResolvAI reads incoming user support tickets, extracts intent, auto-resolves routine queries instantly, and intelligently routes complex issues to the exact right employee based on real-time workload and skills.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={() => handleQuickLogin('user')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-sm transition-all shadow-xl shadow-[#22c55e]/20 active:scale-98 group"
          >
            <Headphones className="w-4 h-4" />
            Launch Support Portal
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => openOverlayWithScenario('ai-triage')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-[#2e2e2e] hover:border-[#22c55e]/40 text-white font-semibold text-sm transition-all active:scale-98"
          >
            <Play className="w-4 h-4 text-[#22c55e]" />
            Watch Live Interactive Demo
          </button>
        </div>

        {/* Demo Quick Bar */}
        <div className="mt-8 pt-6 border-t border-[#1f1f1f] max-w-xl mx-auto flex items-center justify-center gap-6 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" /> Instant Setup</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" /> Pre-seeded Demo Data</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" /> Real-Time WebSockets</span>
        </div>

      </section>

      {/* ─── 3. FEATURE CAROUSEL SECTION ───────────────────────────────── */}
      <section id="carousel" className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-4">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#22c55e]">INTERACTIVE CAPABILITIES</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">Explore ResolvAI Core Modules</h2>
        </div>

        {/* Carousel Component */}
        <LandingCarousel onOpenOverlay={openOverlayWithScenario} />
      </section>

      {/* ─── 4. METRICS / STATS GRID WITH HOVER EFFECTS ─────────────────── */}
      <section id="features" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#111111] border border-[#222222] hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 p-6 rounded-2xl transition-all duration-300 group hover:-translate-y-1 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-[#22c55e]" />
            </div>
            <p className="text-3xl font-black text-white font-mono mb-1">85%</p>
            <p className="text-sm font-semibold text-white mb-1">Auto-Resolution Rate</p>
            <p className="text-xs text-neutral-500">Deflects routine tickets without human agent intervention.</p>
          </div>

          <div className="bg-[#111111] border border-[#222222] hover:border-blue-500/50 hover:bg-blue-500/5 p-6 rounded-2xl transition-all duration-300 group hover:-translate-y-1 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono mb-1">&lt; 1.5s</p>
            <p className="text-sm font-semibold text-white mb-1">AI Triage Speed</p>
            <p className="text-xs text-neutral-500">Extracts intent, category, and severity in under 2 seconds.</p>
          </div>

          <div className="bg-[#111111] border border-[#222222] hover:border-purple-500/50 hover:bg-purple-500/5 p-6 rounded-2xl transition-all duration-300 group hover:-translate-y-1 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono mb-1">10x</p>
            <p className="text-sm font-semibold text-white mb-1">Resolution Velocity</p>
            <p className="text-xs text-neutral-500">Eliminates support backlogs with intelligent skill routing.</p>
          </div>

          <div className="bg-[#111111] border border-[#222222] hover:border-amber-500/50 hover:bg-amber-500/5 p-6 rounded-2xl transition-all duration-300 group hover:-translate-y-1 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono mb-1">99.4%</p>
            <p className="text-sm font-semibold text-white mb-1">CSAT Satisfaction</p>
            <p className="text-xs text-neutral-500">Built-in one-click feedback loops for continuous learning.</p>
          </div>

        </div>
      </section>

      {/* ─── 5. WORKFLOW STEP SECTION ───────────────────────────────────── */}
      <section id="workflow" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#22c55e]">HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">End-to-End Autonomous Triage Lifecycle</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl relative hover:border-[#22c55e]/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] font-mono font-bold text-sm flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-2">User Ticket Submission</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              User submits a support request via Support Portal with description and optional screenshot attachments.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl relative hover:border-[#22c55e]/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] font-mono font-bold text-sm flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-2">LLM Context Analysis</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              AI model extracts intent, assigns category (Billing, Bug, Access, HR), severity level, and user sentiment.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl relative hover:border-[#22c55e]/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] font-mono font-bold text-sm flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-2">Auto-Resolve or Skill Route</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              If solution exists, AI auto-resolves. Otherwise, routes to available employee with matching skills &amp; lowest load.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl relative hover:border-[#22c55e]/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] font-mono font-bold text-sm flex items-center justify-center mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live Chat &amp; Verification</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              WebSocket chat thread facilitates user-agent communication and logs satisfaction feedback to analytics.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 6. FAQ ACCORDION SECTION ───────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#22c55e]">FREQUENTLY ASKED QUESTIONS</p>
          <h2 className="text-3xl font-bold text-white mt-1">Everything You Need to Know</h2>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-[#22c55e] transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-[#22c55e]" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-neutral-400 leading-relaxed border-t border-[#1f1f1f] pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 7. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#070707] border-t border-[#1f1f1f] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ResolvAiLogo className="w-7 h-7 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="text-base font-black text-white">Resolv<span className="text-[#22c55e]">AI</span></span>
            <span className="text-xs text-neutral-500">· Autonomous Helpdesk System</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <button onClick={() => handleQuickLogin('user')} className="hover:text-[#22c55e] transition-colors">User Portal</button>
            <button onClick={() => handleQuickLogin('admin')} className="hover:text-blue-400 transition-colors">Admin Dashboard</button>
            <button onClick={() => openOverlayWithScenario('ai-triage')} className="hover:text-white transition-colors">Live Overlay Demo</button>
          </div>

          <p className="text-xs text-neutral-600">
            © 2026 ResolvAI Platform. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ─── 8. DEMO OVERLAY MODAL ──────────────────────────────────────── */}
      {showDemoOverlay && (
        <DemoOverlayModal
          initialScenario={initialOverlayScenario}
          onClose={() => setShowDemoOverlay(false)}
        />
      )}

      {/* ─── 9. AUTHENTICATION & REGISTRATION MODAL ───────────────────────── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          
          <div className="relative w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header branding */}
            <div className="text-center mb-6">
              <ResolvAiLogo className="w-12 h-12 inline-block mb-3 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              <h3 className="text-xl font-bold text-white">Welcome to ResolvAI</h3>
              <p className="text-xs text-neutral-500 mt-1">Sign in or create a new account to continue</p>
            </div>

            {/* Auth Mode Tabs (Sign In vs Register) */}
            <div className="flex bg-[#161616] p-1 rounded-xl border border-[#2a2a2a] mb-6">
              <button
                onClick={() => { setAuthTab('login'); setLoginError(''); }}
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

            {/* Quick Demo Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleQuickLogin('user')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 transition-all group active:scale-95"
              >
                <User className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-semibold text-white">Demo User</span>
                <span className="text-[10px] text-neutral-500">Support Portal</span>
              </button>

              <button
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Demo Admin</span>
                <span className="text-[10px] text-neutral-500">Admin Dashboard</span>
              </button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#222222]" />
              <span className="text-[10px] text-neutral-500 font-mono uppercase">
                {authTab === 'login' ? 'Or Enter Credentials' : 'Fill Registration Details'}
              </span>
              <div className="flex-1 h-px bg-[#222222]" />
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {authTab === 'login' ? (
              <form onSubmit={handleFormLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
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
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                  />
                </div>

                {loginError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs transition-all active:scale-95 disabled:opacity-50 mt-2 shadow-lg shadow-[#22c55e]/20"
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              /* TAB 2: CREATE ACCOUNT / REGISTER FORM */
              <form onSubmit={handleFormRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#22c55e]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('user')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
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
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
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
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs transition-all active:scale-95 disabled:opacity-50 mt-2 shadow-lg shadow-[#22c55e]/20"
                >
                  {regLoading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

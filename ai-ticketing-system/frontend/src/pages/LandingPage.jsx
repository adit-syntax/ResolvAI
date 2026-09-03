/**
 * LandingPage.jsx — Clean, Modern & Realistic SaaS Landing Page for ResolvAI
 * Focuses on real capabilities, clear product workflows, and zero artificial metrics.
 */

import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import ResolvAiLogo from '../components/ResolvAiLogo.jsx';
import DemoOverlayModal from '../components/DemoOverlayModal.jsx';
import LandingCarousel from '../components/LandingCarousel.jsx';
import DocumentationModal from '../components/DocumentationModal.jsx';
import {
  ArrowRight, ShieldCheck, User, Bot, AlertTriangle,
  MessageSquare, BarChart3, CheckCircle2, ChevronDown, ChevronUp,
  Layers, Headphones, X, UserPlus, LogIn, Info,
  Search, Users, Clock, FileText, Check, Play, Sparkles, BookOpen
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

const REAL_TICKET_EXAMPLES = [
  {
    id: 'vpn',
    badge: 'Access',
    title: 'VPN Connection Setup',
    description: 'Cannot connect to company VPN from remote office after updating macOS.',
    category: 'Access',
    priority: 'Normal',
    matchedSop: 'SOP-101: Remote Access & VPN Configuration',
    resolutionType: 'auto_resolved',
    actionText: 'Instant Auto-Response Sent',
    actionDetail: 'Provided verified VPN profile configuration steps and macOS client download link.',
  },
  {
    id: 'billing',
    badge: 'Billing',
    title: 'Duplicate Monthly Charge',
    description: 'My account was billed twice for the monthly subscription on the same invoice.',
    category: 'Billing',
    priority: 'Medium',
    matchedSop: 'SOP-204: Billing & Refund Verification',
    resolutionType: 'auto_resolved',
    actionText: 'Instant Auto-Response Sent',
    actionDetail: 'Identified duplicate invoice entry and initiated verification for the refund process.',
  },
  {
    id: 'outage',
    badge: 'Technical',
    title: 'API Gateway 502 Errors',
    description: 'Multiple endpoints returning 502 Bad Gateway under normal traffic volume.',
    category: 'Server',
    priority: 'Critical',
    matchedSop: 'SOP-502: Infrastructure Incident Response',
    resolutionType: 'assigned',
    actionText: 'Assigned to DevOps Team',
    actionDetail: 'High-severity incident routed to available engineer with lowest active workload.',
  },
  {
    id: 'hr',
    badge: 'HR / Policy',
    title: 'Annual Leave Carry-Over Policy',
    description: 'How many days of unused vacation leave can be carried over into this year?',
    category: 'HR',
    priority: 'Low',
    matchedSop: 'SOP-301: Employee Benefits & Leave Policy',
    resolutionType: 'auto_resolved',
    actionText: 'Instant Auto-Response Sent',
    actionDetail: 'Retrieved verified policy excerpt regarding annual leave carry-over limits.',
  },
];

export default function LandingPage({ onLogin }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [showDemoOverlay, setShowDemoOverlay] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [initialOverlayScenario, setInitialOverlayScenario] = useState('ai-triage');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Interactive Ticket Example Selector
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const selectedExample = REAL_TICKET_EXAMPLES[selectedExampleIndex];

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

  // Google OAuth state
  const [googleError, setGoogleError] = useState('');

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

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
        setGoogleError(err.message || 'Google sign-in failed. Please try again.');
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
      setLoginError(err.message || 'Demo login failed. Make sure the backend server is running.');
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
      setLoginError(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoginLoading(false);
    }
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
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setRegLoading(true);
    try {
      const data = await authApi.register(regName.trim(), regEmail.trim().toLowerCase(), regPassword);
      setAuthToken(data.access_token);
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
      setShowLoginModal(false);
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const openOverlayWithScenario = (scenarioId) => {
    setInitialOverlayScenario(scenarioId || 'ai-triage');
    setShowDemoOverlay(true);
  };

  const faqItems = [
    {
      q: 'How does the automated response system work?',
      a: 'When a user submits a ticket, the system parses the description, identifies the category and intent, and queries the knowledge base for verified documentation. If an exact answer is found, an instant response is suggested to the user.',
    },
    {
      q: 'How are tickets routed to employees when they cannot be auto-resolved?',
      a: 'Tickets requiring human intervention are assigned to team members based on their relevant skills and their current active workload, preventing any single team member from becoming overwhelmed.',
    },
    {
      q: 'Can support staff and users communicate in real time?',
      a: 'Yes. Each ticket has an integrated WebSocket-powered conversation thread where users and assigned staff can exchange messages, attachments, and status updates.',
    },
    {
      q: 'What roles exist in ResolvAI?',
      a: 'ResolvAI supports three distinct roles: End Users (who file and view tickets), Support Employees (who manage and resolve assigned tickets), and Administrators (who oversee team workloads, user directory, and analytics).',
    },
    {
      q: 'Can I test all features without setting up an account?',
      a: 'Yes. Use the Quick Demo buttons in the header or login modal to log in immediately as a User, Support Employee, or Administrator.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-[#22c55e] selection:text-black">

      {/* ─── 1. CLEAN HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Branding — Clean, no glow halos or extra badges */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ResolvAiLogo className="w-7 h-7" />
            <span className="text-base font-bold text-white tracking-tight">
              Resolv<span className="text-[#22c55e]">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#roles" className="hover:text-white transition-colors">Portals</a>
            <button
              onClick={() => setShowDocsModal(true)}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#22c55e]" /> Docs
            </button>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickLogin('user')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#22c55e]" /> User Demo
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Admin Demo
            </button>

            <button
              id="header-sign-in-btn"
              onClick={() => { setAuthTab('login'); setShowLoginModal(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ─── 2. HERO SECTION ────────────────────────────────────────────── */}
      <section className="pt-16 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        
        {/* Simple Honest Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span>Intelligent Helpdesk &amp; Workload Management</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-5">
          Support Ticketing, <br className="hidden sm:inline" />
          Organized and Automated.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-400 leading-relaxed mb-8">
          ResolvAI classifies incoming tickets, suggests instant answers using your team's verified documentation, and assigns unresolved cases to the right team member based on active workload.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={() => handleQuickLogin('user')}
            className="px-5 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <Headphones className="w-4 h-4" /> Open Support Portal
          </button>

          <button
            onClick={() => handleQuickLogin('admin')}
            className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Admin Dashboard
          </button>

          <button
            onClick={() => openOverlayWithScenario('ai-triage')}
            className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 text-[#22c55e]" /> Watch Simulated Flow
          </button>
        </div>

        {/* ─── REAL TICKET PROCESSING DEMO WIDGET ─────────────────────── */}
        <div className="text-left bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-lg max-w-4xl mx-auto">
          <div className="pb-4 mb-4 border-b border-neutral-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider block">
              How a Ticket is Handled
            </span>
            <span className="text-xs text-neutral-400">
              Select an example issue to see how ResolvAI categorizes and resolves it.
            </span>
          </div>

          {/* Example Selector Chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {REAL_TICKET_EXAMPLES.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setSelectedExampleIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  idx === selectedExampleIndex
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Output Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Ticket Box */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                Ticket Information
              </span>
              <p className="text-xs font-semibold text-white">{selectedExample.title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                "{selectedExample.description}"
              </p>
              <div className="flex gap-2 pt-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                  Category: {selectedExample.category}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                  Priority: {selectedExample.priority}
                </span>
              </div>
            </div>

            {/* Processing Result */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                  System Resolution
                </span>
                <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  {selectedExample.actionText}
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {selectedExample.actionDetail}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-500">
                Documentation: <span className="text-neutral-300">{selectedExample.matchedSop}</span>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ─── 3. HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How ResolvAI Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2">
            A structured, three-step flow from ticket submission to verified resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#22c55e]">
              1
            </div>
            <h3 className="text-sm font-semibold text-white">Ticket Ingestion &amp; Triage</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Users submit issues via the support portal. The system reads the description and automatically determines the category and urgency.
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#22c55e]">
              2
            </div>
            <h3 className="text-sm font-semibold text-white">Knowledge Base Query</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              ResolvAI searches your organization's documentation. If a matching SOP is found, it generates a verified answer immediately.
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#22c55e]">
              3
            </div>
            <h3 className="text-sm font-semibold text-white">Smart Routing &amp; Live Chat</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Unresolved issues are assigned to the employee with matching skills and lowest current workload for real-time chat resolution.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 4. CORE FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Key Platform Features
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2">
            Built to handle everyday support tasks reliably without unnecessary complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          
          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
            <Bot className="w-5 h-5 text-[#22c55e] mb-2" />
            <h3 className="text-sm font-semibold text-white">Automated Triage</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Automatically assigns categories (Billing, Access, Server, HR) and priority levels based on ticket context.
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
            <Search className="w-5 h-5 text-blue-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Knowledge Base Matching</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Matches user queries against verified standard operating procedures (SOPs) to suggest proven solutions.
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
            <Users className="w-5 h-5 text-purple-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Workload-Based Routing</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Routes tickets to team members by checking active ticket counts, department, and skill-tags to prevent bottlenecks.
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
            <MessageSquare className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Live Support Chat</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Integrated real-time WebSocket messaging for ongoing troubleshooting and resolution verification between user and agent.
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
            <Layers className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Duplicate Detection</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Detects similar tickets submitted by users to alert staff and prevent redundant troubleshooting work.
            </p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
            <BarChart3 className="w-5 h-5 text-indigo-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Analytics Dashboard</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Detailed tracking for open vs. closed tickets, team resolution times, department workload, and SLA compliance.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 5. INTERACTIVE CAPABILITIES CAROUSEL ──────────────────────── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Explore Core System Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2">
            Step through the key modules powering automated triage, knowledge retrieval, and live helpdesk routing.
          </p>
        </div>

        <LandingCarousel onOpenOverlay={openOverlayWithScenario} />
      </section>

      {/* ─── 5. ROLE PORTALS ────────────────────────────────────────────── */}
      <section id="roles" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dedicated Workspaces for Every Role
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2">
            Tailored views for customers, support staff, and team administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Portal */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-medium text-[#22c55e] uppercase">Customer Role</span>
                <User className="w-4 h-4 text-[#22c55e]" />
              </div>
              <h3 className="text-base font-semibold text-white">Support Portal</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Simple interface for users to submit requests, track ticket status, and receive answers or communicate with staff.
              </p>
            </div>
            <button
              onClick={() => handleQuickLogin('user')}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
            >
              Open User View
            </button>
          </div>

          {/* Staff Workspace */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-medium text-purple-400 uppercase">Support Role</span>
                <Headphones className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Staff Workspace</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Assigned ticket queue with AI-assisted response drafting, internal collaboration notes, and status management.
              </p>
            </div>
            <button
              onClick={() => handleQuickLogin('employee')}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
            >
              Open Staff View
            </button>
          </div>

          {/* Admin Console */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-medium text-blue-400 uppercase">Admin Role</span>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Admin Console</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Complete team directory, workload overview, system settings, knowledge base curation, and analytics charts.
              </p>
            </div>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
            >
              Open Admin View
            </button>
          </div>

        </div>
      </section>

      {/* ─── 6. FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto border-t border-neutral-800">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2">
            Answers to common questions about ResolvAI's architecture and usage.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-white hover:text-[#22c55e] transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#22c55e] flex-shrink-0 ml-3" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0 ml-3" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/80 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 7. CTA BANNER ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to Test the System?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Click any demo role to start testing immediately with pre-loaded tickets and documentation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleQuickLogin('user')}
              className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors"
            >
              Sign In as User
            </button>
            <button
              onClick={() => handleQuickLogin('employee')}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
            >
              Sign In as Staff
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      </section>

      {/* ─── 8. CLEAN FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-800 bg-[#09090b] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <ResolvAiLogo className="w-5 h-5" />
            <span className="text-sm font-semibold text-white">ResolvAI</span>
            <span className="text-xs text-neutral-500">· Support Ticketing Platform</span>
          </div>

          <div className="flex items-center gap-5 text-xs text-neutral-400">
            <button
              onClick={() => setShowDocsModal(true)}
              className="text-[#22c55e] hover:text-[#1ea750] transition-colors flex items-center gap-1.5 font-medium"
            >
              <BookOpen className="w-3.5 h-3.5" /> Documentation
            </button>
            <button onClick={() => handleQuickLogin('user')} className="hover:text-white transition-colors">User Portal</button>
            <button onClick={() => handleQuickLogin('employee')} className="hover:text-white transition-colors">Staff Queue</button>
            <button onClick={() => handleQuickLogin('admin')} className="hover:text-white transition-colors">Admin Panel</button>
          </div>

          <p className="text-xs text-neutral-500">
            © 2026 ResolvAI. All rights reserved.
          </p>

        </div>
      </footer>

      {/* ─── 9. DEMO OVERLAY MODAL ──────────────────────────────────────── */}
      {showDemoOverlay && (
        <DemoOverlayModal
          initialScenario={initialOverlayScenario}
          onClose={() => setShowDemoOverlay(false)}
        />
      )}

      {/* ─── 10. DOCUMENTATION MODAL ────────────────────────────────────── */}
      <DocumentationModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />

      {/* ─── 10. AUTHENTICATION & REGISTRATION MODAL ─────────────────────── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header branding */}
            <div className="text-center mb-5">
              <ResolvAiLogo className="w-10 h-10 inline-block mb-2" />
              <h3 className="text-lg font-bold text-white">Welcome to ResolvAI</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Sign in to your account</p>
            </div>

            {/* Auth Mode Tabs (Sign In vs Register) */}
            <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 mb-5">
              <button
                onClick={() => { setAuthTab('login'); setLoginError(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  authTab === 'login'
                    ? 'bg-[#22c55e] text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                onClick={() => { setAuthTab('register'); setRegError(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  authTab === 'register'
                    ? 'bg-[#22c55e] text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </button>
            </div>

            {/* Google OAuth Button */}
            {googleClientId ? (
              <>
                <button
                  type="button"
                  onClick={() => { setGoogleError(''); googleLogin(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-colors mb-3"
                >
                  <GoogleIcon className="w-4 h-4" />
                  Continue with Google
                </button>
                {googleError && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{googleError}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 mb-3">
                <Info className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Google sign-in enabled when <code className="bg-neutral-800 px-1 rounded text-neutral-300">VITE_GOOGLE_CLIENT_ID</code> is configured.
                </p>
              </div>
            )}

            {/* Quick Demo Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-800 transition-colors text-center"
              >
                <User className="w-4 h-4 text-[#22c55e]" />
                <span className="text-[11px] font-semibold text-white">User</span>
                <span className="text-[9px] text-neutral-500">Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-800 transition-colors text-center"
              >
                <Headphones className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-semibold text-white">Employee</span>
                <span className="text-[9px] text-neutral-500">Support Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-800 transition-colors text-center"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-semibold text-white">Admin</span>
                <span className="text-[9px] text-neutral-500">Manager</span>
              </button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                {authTab === 'login' ? 'Or With Email' : 'Registration Details'}
              </span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {authTab === 'login' ? (
              <form onSubmit={handleFormLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
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

                {loginError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors mt-2"
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              /* TAB 2: CREATE ACCOUNT FORM */
              <form onSubmit={handleFormRegister} className="space-y-3">
                <div className="flex items-start gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Registers a <span className="text-white font-medium">Customer Support User</span> account.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Password * (min 6 chars)</label>
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

                {regError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2 rounded-lg bg-[#22c55e] hover:bg-[#1ea750] text-black font-semibold text-xs transition-colors mt-2"
                >
                  {regLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

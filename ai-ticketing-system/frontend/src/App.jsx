/**
 * App.jsx — Root component with routing, layout, and role-based auth.
 * Roles: 'user' → Support Portal | 'admin' → Admin Dashboard
 */

import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import {
  Headphones, ListTodo, Users, BarChart3, LayoutDashboard,
  Menu, CircleDot, LogOut, User, ShieldCheck, FileText, Settings,
  X, UserCheck, Shield, BookOpen, Loader2, AlertCircle
} from 'lucide-react';
import { authApi, getAuthToken, setAuthToken, clearAuthToken, decodeJwtPayload } from './api.js';

// Core UI components
import ResolvAiLogo from './components/ResolvAiLogo.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import IncidentAlertBanner from './components/IncidentAlertBanner.jsx';

// Lazy-loaded route pages for on-demand bundle delivery
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const UserPortal = lazy(() => import('./pages/UserPortal.jsx'));
const TicketList = lazy(() => import('./pages/TicketList.jsx'));
const TicketDetail = lazy(() => import('./pages/TicketDetail.jsx'));
const EmployeeDirectory = lazy(() => import('./pages/EmployeeDirectory.jsx'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase.jsx'));

function PageFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      <span className="text-xs text-neutral-400 font-mono">Loading module…</span>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-xs text-neutral-400 max-w-md mb-6 font-mono">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Back to Home
            </a>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Navigation Items (role-gated) ────────────────────────

const userNavItems = [
  { path: '/', icon: Headphones, label: 'Support Portal' },
  { path: '/my-tickets', icon: FileText, label: 'My Tickets' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics & SLAs' },
];

const employeeNavItems = [
  { path: '/employee-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { path: '/tickets', icon: ListTodo, label: 'All Tickets' },
  { path: '/knowledge', icon: BookOpen, label: 'Knowledge Base & RAG' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics Dashboard' },
];

const adminNavItems = [
  { path: '/tickets', icon: ListTodo, label: 'Ticket Management' },
  { path: '/employees', icon: Users, label: 'Employee Directory' },
  { path: '/employee-dashboard', icon: LayoutDashboard, label: 'Staff Workspace' },
  { path: '/knowledge', icon: BookOpen, label: 'Knowledge Base & RAG' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics Dashboard' },
];

// ─── NavItem ──────────────────────────────────────────────

function NavItem({ path, icon: Icon, label, onClose }) {
  return (
    <NavLink
      to={path === '/' ? { pathname: '/', state: { reset: true } } : path}
      end={path === '/'}
      onClick={onClose}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-colors duration-150
        ${isActive
          ? 'bg-white/[.08] text-white'
          : 'text-neutral-400 hover:text-white hover:bg-white/[.04]'
        }
      `}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
      {label}
    </NavLink>
  );
}

// ─── Sidebar ─────────────────────────────────────────────

function Sidebar({ isOpen, onClose, role, email, onLogout, onOpenSettings }) {
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';
  const dashboardPath = isAdmin ? '/tickets' : isEmployee ? '/employee-dashboard' : '/';
  
  let navItems = userNavItems;
  let sectionLabel = 'User';
  let badgeColor = 'bg-[#22c55e]/10 border-[#22c55e]/20';
  let iconColor = 'text-[#22c55e]';
  let label = 'User';
  let Icon = User;

  if (isAdmin) {
    navItems = adminNavItems;
    sectionLabel = 'Admin';
    badgeColor = 'bg-blue-500/10 border-blue-500/20';
    iconColor = 'text-blue-400';
    label = 'Administrator';
    Icon = ShieldCheck;
  } else if (isEmployee) {
    navItems = employeeNavItems;
    sectionLabel = 'Employee';
    badgeColor = 'bg-purple-500/10 border-purple-500/20';
    iconColor = 'text-purple-400';
    label = 'Support Staff';
    Icon = Headphones;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50
        w-64 bg-[#0f0f0f] border-r border-[#2a2a2a]
        flex flex-col transition-transform duration-300
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo & Brand (Clickable Dashboard Link) */}
        <div className="px-5 py-4 border-b border-[#2a2a2a]">
          <Link
            to={dashboardPath}
            onClick={onClose}
            className="flex items-center gap-3 group select-none cursor-pointer"
            title={`Go to ${isAdmin ? 'Admin' : isEmployee ? 'Staff' : 'User'} Dashboard`}
          >
            <ResolvAiLogo
              variant="icon"
              className="w-9 h-9 flex-shrink-0 rounded-xl group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-[15px] font-bold text-white leading-tight tracking-tight group-hover:text-[#22c55e] transition-colors">
                Resolv<span className="text-[#22c55e] group-hover:text-white transition-colors">AI</span>
              </h1>
              <p className="text-[11px] text-neutral-400 font-medium leading-tight">
                Smart AI Helpdesk
              </p>
            </div>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-[#1a1a1a]">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badgeColor}`}>
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${iconColor}`}>
                {label}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">
              {sectionLabel}
            </p>
            <div className="space-y-0.5">
              {navItems.map(item => <NavItem key={item.path} {...item} onClose={onClose} />)}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#2a2a2a] space-y-2">
          <button
            onClick={() => { onOpenSettings(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-purple-400 hover:bg-purple-500/10 transition-all font-medium border border-white/5"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            Integrations &amp; AI
          </button>

          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Main Layout ─────────────────────────────────────────

function Layout({ children, role, email, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        email={email}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Mobile header with clickable logo */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0f0f0f] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <Link
            to={role === 'admin' ? '/tickets' : role === 'employee' ? '/employee-dashboard' : '/'}
            className="flex items-center gap-2 group select-none cursor-pointer"
            title="Go to Dashboard"
          >
            <ResolvAiLogo variant="icon" className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform" />
            <span className="text-sm font-bold text-white group-hover:text-[#22c55e] transition-colors">
              Resolv<span className="text-[#22c55e] group-hover:text-white transition-colors">AI</span>
            </span>
          </Link>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <IncidentAlertBanner />
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Settings & Integrations Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// ─── Auth helpers (JWT-based) ─────────────────────────────

function loadAuth() {
  // Read saved JWT from localStorage and decode the payload for role/email
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.role) {
    clearAuthToken();
    return null;
  }
  return {
    role: payload.role,
    email: payload.email || localStorage.getItem('userEmail') || '',
    name: payload.name || '',
  };
}


function PublicAnalyticsPage({ onLogin }) {
  const [loggingIn, setLoggingIn] = useState(false);

  const handleAdminSignIn = async () => {
    setLoggingIn(true);
    try {
      const data = await authApi.login('admin@resolvai.com', 'admin123');
      onLogin({ role: data.role, email: data.email, name: data.name }, data.access_token);
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Top Banner for unauthenticated visitors */}
      <header className="sticky top-0 z-40 bg-[#141416]/95 backdrop-blur border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ResolvAiLogo variant="icon" className="w-7 h-7" />
            <span className="text-sm font-bold tracking-tight">ResolvAI</span>
          </Link>
          <span className="text-neutral-600 hidden sm:inline">/</span>
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">Executive Analytics &amp; AI Quality Hub (Demo Mode)</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs text-neutral-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
          <button
            onClick={handleAdminSignIn}
            disabled={loggingIn}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>Sign in as Admin (1-Click)</span>
          </button>
        </div>
      </header>

      <main className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Analytics />
      </main>
    </div>
  );
}


// ─── App ─────────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState(() => loadAuth());
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleLogin = (userProfile, token) => {
    // userProfile = { role, email, name } from the backend response
    if (token) setAuthToken(token);
    // Also cache email for quick access elsewhere
    if (userProfile.email) localStorage.setItem('userEmail', userProfile.email);
    setAuth({ role: userProfile.role, email: userProfile.email, name: userProfile.name || '' });
  };

  const handleLogout = () => {
    clearAuthToken();
    localStorage.removeItem('userEmail');
    setAuth(null);
  };

  const handleUpdateEmail = (newEmail) => {
    if (auth) setAuth({ ...auth, email: newEmail });
  };

  const appContent = (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageFallback />}>
          {!auth ? (
            <Routes>
              <Route path="/analytics" element={<PublicAnalyticsPage onLogin={handleLogin} />} />
              <Route path="*" element={<LandingPage onLogin={handleLogin} />} />
            </Routes>
          ) : (
            <Layout role={auth.role} email={auth.email} onLogout={handleLogout}>
              <Routes>
                {auth.role === 'admin' ? (
                  /* ── Admin routes ── */
                  <>
                    <Route path="/tickets" element={<TicketList />} />
                    <Route path="/tickets/:id" element={<TicketDetail role={auth.role} userEmail={auth.email} />} />
                    <Route path="/employees" element={<EmployeeDirectory />} />
                    <Route path="/employee-dashboard" element={<EmployeeDashboard userEmail={auth.email} currentUser={auth} />} />
                    <Route path="/knowledge" element={<KnowledgeBase user={auth} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<Navigate to="/tickets" replace />} />
                  </>
                ) : auth.role === 'employee' ? (
                  /* ── Employee routes ── */
                  <>
                    <Route path="/employee-dashboard" element={<EmployeeDashboard userEmail={auth.email} currentUser={auth} />} />
                    <Route path="/tickets" element={<TicketList />} />
                    <Route path="/tickets/:id" element={<TicketDetail role={auth.role} userEmail={auth.email} />} />
                    <Route path="/knowledge" element={<KnowledgeBase user={auth} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<Navigate to="/employee-dashboard" replace />} />
                  </>
                ) : (
                  /* ── User routes ── */
                  <>
                    <Route path="/" element={<UserPortal userEmail={auth.email} onLogout={handleLogout} onUpdateEmail={handleUpdateEmail} />} />
                    <Route path="/my-tickets" element={<UserPortal userEmail={auth.email} onLogout={handleLogout} onUpdateEmail={handleUpdateEmail} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </Layout>
          )}
        </Suspense>
      </Router>
    </ErrorBoundary>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appContent}
      </GoogleOAuthProvider>
    );
  }

  return appContent;
}

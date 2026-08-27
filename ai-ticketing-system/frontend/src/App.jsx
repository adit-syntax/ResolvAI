/**
 * App.jsx — Root component with routing, layout, and role-based auth.
 * Roles: 'user' → Support Portal | 'admin' → Admin Dashboard
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  Headphones, ListTodo, Users, BarChart3,
  Menu, CircleDot, LogOut, User, ShieldCheck, FileText, Settings
} from 'lucide-react';

// Components & Pages
import ResolvAiLogo from './components/ResolvAiLogo.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UserPortal from './pages/UserPortal.jsx';
import TicketList from './pages/TicketList.jsx';
import TicketDetail from './pages/TicketDetail.jsx';
import EmployeeDirectory from './pages/EmployeeDirectory.jsx';
import Analytics from './pages/Analytics.jsx';

// ─── Navigation Items (role-gated) ────────────────────────

const userNavItems = [
  { path: '/', icon: Headphones, label: 'Support Portal' },
  { path: '/my-tickets', icon: FileText, label: 'My Tickets' },
];

const adminNavItems = [
  { path: '/tickets', icon: ListTodo, label: 'Ticket Management' },
  { path: '/employees', icon: Users, label: 'Employee Directory' },
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

// ─── Sidebar ─────────────────────────────────────────────

function Sidebar({ isOpen, onClose, role, email, onLogout, onOpenSettings }) {
  const isAdmin = role === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const sectionLabel = isAdmin ? 'Admin' : 'User';

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
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2.5">
            <ResolvAiLogo className="w-8 h-8 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
            <div>
              <h1 className="text-[15px] font-bold text-white leading-tight tracking-tight">ResolvAI</h1>
              <p className="text-[11px] text-[#22c55e] font-medium leading-tight">Smart AI Helpdesk</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-[#1a1a1a]">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isAdmin ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-[#22c55e]/10 border border-[#22c55e]/20'}`}>
            {isAdmin
              ? <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              : <User className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" />
            }
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isAdmin ? 'text-blue-400' : 'text-[#22c55e]'}`}>
                {isAdmin ? 'Administrator' : 'User'}
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
            ⚙️ Integrations & AI
          </button>

          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-xs text-neutral-500">System Online</span>
          </div>

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

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0f0f0f] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <Settings className="w-4 h-4" /> ⚙️ Settings
        </button>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Settings & Integrations Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// ─── Auth helpers ─────────────────────────────────────────

const AUTH_KEY = 'demoAuth';

function loadAuth() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(role, email) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ role, email }));
  localStorage.setItem('userEmail', email);
}

function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('userEmail');
}

// ─── App ─────────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState(() => loadAuth());

  const handleLogin = (role, email) => {
    saveAuth(role, email);
    setAuth({ role, email });
  };

  const handleLogout = () => {
    clearAuth();
    setAuth(null);
  };

  // Not logged in → show Landing Page
  if (!auth) {
    return (
      <Router>
        <LandingPage onLogin={handleLogin} />
      </Router>
    );
  }

  const { role, email } = auth;
  const isAdmin = role === 'admin';

  return (
    <Router>
      <Layout role={role} email={email} onLogout={handleLogout}>
        <Routes>
          {isAdmin ? (
            /* ── Admin routes ── */
            <>
              <Route path="/tickets" element={<TicketList />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/employees" element={<EmployeeDirectory />} />
              <Route path="/analytics" element={<Analytics />} />
              {/* Catch-all → redirect admin to ticket management */}
              <Route path="*" element={<Navigate to="/tickets" replace />} />
            </>
          ) : (
            /* ── User routes ── */
            <>
              <Route path="/" element={<UserPortal userEmail={email} />} />
              <Route path="/my-tickets" element={<UserPortal userEmail={email} />} />
              {/* Catch-all → redirect user to portal */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
}

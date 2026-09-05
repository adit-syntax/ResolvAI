/**
 * EmployeeDashboard.jsx — Dedicated Employee Workspace & Dashboard
 * Displays:
 *  - Real-time assigned live tickets (New, Assigned, In Progress, Pending Info) with SLA status & quick actions
 *  - Past resolved tickets history with duration stats and feedback
 *  - Personal performance analytics (workload capacity, SLA rate, resolution turnaround, category/severity breakdowns)
 *  - Live employee availability switcher (Available 🟢, Busy 🟡, On Leave 🔴)
 *  - Department peer collaboration queue
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase, CheckCircle2, Clock, AlertTriangle, AlertCircle, Sparkles,
  RefreshCw, Search, Filter, MessageSquare, ArrowUpRight, User, ShieldCheck,
  BarChart3, Zap, Send, SlidersHorizontal, ChevronRight, Check, X,
  TrendingUp, Activity, Inbox, ChevronDown, CheckCircle, Flame, HeartHandshake,
  Tag, Compass, Calendar
} from 'lucide-react';
import { employeeApi, ticketApi } from '../api.js';

// ─── Severity colors ────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  Critical: {
    badge: 'text-red-400 bg-red-500/10 border-red-500/30',
    dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    label: 'Critical',
  },
  High: {
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    label: 'High',
  },
  Medium: {
    badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    dot: 'bg-blue-400',
    label: 'Medium',
  },
  Low: {
    badge: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30',
    dot: 'bg-neutral-400',
    label: 'Low',
  },
};

// ─── Status badges ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  New: { label: 'NEW', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Assigned: { label: 'ASSIGNED', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  'In Progress': { label: 'IN PROGRESS', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Pending Info': { label: 'PENDING INFO', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  Resolved: { label: 'RESOLVED', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  Closed: { label: 'CLOSED', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
};

// ─── SLA status pill ────────────────────────────────────────────────────────
function SlaBadge({ slaStatus, dueAt }) {
  if (slaStatus === 'breached') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        SLA Breached
      </span>
    );
  }
  if (slaStatus === 'at_risk') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <Clock className="w-3 h-3" />
        SLA &lt; 1h Left
      </span>
    );
  }
  if (slaStatus === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-500/15 border border-green-500/30 text-green-400">
        <Check className="w-3 h-3" />
        SLA Met
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
      <Clock className="w-3 h-3 text-blue-400" />
      SLA On Track
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function EmployeeDashboard({ userEmail, currentUser }) {
  const navigate = useNavigate();

  const role = currentUser?.role || (userEmail?.toLowerCase().includes('admin') ? 'admin' : 'employee');
  const userName = currentUser?.name || (role === 'admin' ? 'Administrator' : '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'past' | 'analytics' | 'dept'
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Availability dropdown state
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [showAvailabilityMenu, setShowAvailabilityMenu] = useState(false);

  // Quick reply modal state
  const [replyModalTicket, setReplyModalTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySuccess, setReplySuccess] = useState('');

  // Fetch dashboard data
  const loadDashboard = useCallback(async (isSilent = false, empId = null) => {
    if (!isSilent) setRefreshing(true);
    setError('');
    try {
      const data = await employeeApi.getDashboard(empId);
      setDashboardData(data);
      if (empId) setSelectedEmployeeId(empId);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError(err.message || 'Unable to load workspace data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSwitchEmployee = (empId) => {
    setSelectedEmployeeId(empId);
    loadDashboard(false, empId);
  };

  useEffect(() => {
    loadDashboard();
    // Poll every 30 seconds for live updates
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Handle availability update
  const handleUpdateAvailability = async (newStatus) => {
    setAvailabilityUpdating(true);
    setShowAvailabilityMenu(false);
    try {
      await employeeApi.updateMyAvailability(newStatus);
      if (dashboardData?.employee) {
        setDashboardData(prev => ({
          ...prev,
          employee: { ...prev.employee, availability: newStatus },
          metrics: { ...prev.metrics, availability: newStatus },
        }));
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  // Quick status update on a ticket
  const handleQuickStatusUpdate = async (ticketId, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      await ticketApi.updateStatus(ticketId, {
        status: newStatus,
        actor: dashboardData?.employee?.name || userEmail || 'Support Agent',
      });
      // Refresh silently
      loadDashboard(true);
    } catch (err) {
      alert(`Could not update ticket status: ${err.message}`);
    }
  };

  // Quick reply submission
  const handleSendQuickReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyModalTicket) return;
    setReplySending(true);
    setReplySuccess('');
    try {
      await ticketApi.addReply(replyModalTicket.id, {
        content: replyText.trim(),
        author_email: userEmail || dashboardData?.employee?.email || 'agent@company.com',
        author_name: dashboardData?.employee?.name || 'Support Staff',
        is_employee_reply: true,
      });
      setReplySuccess('Reply sent successfully!');
      setReplyText('');
      setTimeout(() => {
        setReplyModalTicket(null);
        setReplySuccess('');
        loadDashboard(true);
      }, 1200);
    } catch (err) {
      alert(`Failed to send reply: ${err.message}`);
    } finally {
      setReplySending(false);
    }
  };

  const employee = dashboardData?.employee;
  const allEmployees = dashboardData?.all_employees || [];
  const metrics = dashboardData?.metrics || {};
  const liveTickets = dashboardData?.live_tickets || [];
  const pastTickets = dashboardData?.past_tickets || [];
  const deptQueue = dashboardData?.department_queue || [];

  // Filter live tickets
  const filteredLiveTickets = useMemo(() => {
    return liveTickets.filter(t => {
      const matchSearch =
        !searchQuery ||
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.id).includes(searchQuery);

      const matchSeverity = !severityFilter || t.severity === severityFilter;
      const matchStatus = !statusFilter || t.status === statusFilter;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [liveTickets, searchQuery, severityFilter, statusFilter]);

  // Filter past tickets
  const filteredPastTickets = useMemo(() => {
    return pastTickets.filter(t => {
      const matchSearch =
        !searchQuery ||
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.id).includes(searchQuery);

      const matchSeverity = !severityFilter || t.severity === severityFilter;
      return matchSearch && matchSeverity;
    });
  }, [pastTickets, searchQuery, severityFilter]);

  // Count breached & at-risk
  const urgentCount = useMemo(() => {
    return liveTickets.filter(t => t.sla_status === 'breached' || t.sla_status === 'at_risk').length;
  }, [liveTickets]);

  const capacityPct = Math.min(
    100,
    Math.round(((metrics.active_tickets || 0) / (metrics.max_capacity || 8)) * 100)
  );

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 text-[#22c55e] animate-spin" />
        <p className="text-sm text-neutral-400 font-medium">Loading your employee workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-16 animate-fadeIn">
      {/* ─── Hero / Header Workspace Banner ────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#181818] via-[#121212] to-[#0d0d0d] border border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Glow backdrop accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            {role === 'admin' ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    Welcome back, {userName || 'Administrator'}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> System Administrator
                    </span>
                  </h1>
                  <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span className="text-blue-300/90 font-medium">Staff Workspace Oversight</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-600" />
                    <span className="text-neutral-500">{userEmail}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-base shadow-inner">
                  {employee?.name ? employee.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    Welcome back, {employee?.name || 'Support Specialist'}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                      {employee?.role || 'Staff Agent'}
                    </span>
                  </h1>
                  <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span>{employee?.department || 'Support'} Department</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-600" />
                    <span className="text-neutral-500">{employee?.email || userEmail}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Actions: Availability Switcher & Refresh */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* Availability Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAvailabilityMenu(!showAvailabilityMenu)}
                disabled={availabilityUpdating}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold
                  border transition-all shadow-sm
                  ${employee?.availability === 'Available'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : employee?.availability === 'Busy'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  }
                `}
              >
                <span className={`w-2 h-2 rounded-full ${
                  employee?.availability === 'Available'
                    ? 'bg-emerald-400 animate-pulse'
                    : employee?.availability === 'Busy'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                }`} />
                <span>{employee?.availability || 'Available'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
              </button>

              {showAvailabilityMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1a1a1a] border border-[#333] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    Set Workload Status
                  </p>
                  <button
                    onClick={() => handleUpdateAvailability('Available')}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-white hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Available (Accepting)
                  </button>
                  <button
                    onClick={() => handleUpdateAvailability('Busy')}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-white hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Busy (In Deep Work)
                  </button>
                  <button
                    onClick={() => handleUpdateAvailability('On Leave')}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-white hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    On Leave (Auto-Route Away)
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadDashboard(false)}
              disabled={refreshing}
              title="Refresh tickets"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[.05] hover:bg-white/[.10] border border-white/10 text-neutral-300 text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#22c55e]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Admin Oversight Switcher Bar */}
        {role === 'admin' && (
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] -mx-6 md:-mx-8 -mb-6 md:-mb-8 px-6 md:px-8 py-3.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Inspecting Staff Workspace:
              </span>
              {allEmployees.length > 0 ? (
                <select
                  value={selectedEmployeeId || employee?.id || ''}
                  onChange={(e) => handleSwitchEmployee(Number(e.target.value))}
                  className="bg-[#1a1a1a] border border-neutral-700 hover:border-blue-500/60 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                >
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role} ({emp.department})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-neutral-300 font-medium">
                  {employee?.name} ({employee?.department})
                </span>
              )}
            </div>
            <div className="text-[11px] text-blue-300/80 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Showing live tickets &amp; SLA performance for <strong>{employee?.name || 'staff'}</strong></span>
            </div>
          </div>
        )}

        {/* SLA Urgency Notice */}
        {urgentCount > 0 && (
          <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
            <Flame className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
            <div className="flex-1">
              <span className="font-semibold">{urgentCount} ticket{urgentCount > 1 ? 's' : ''} require immediate attention</span>
              <span className="text-red-300/80 ml-1">due to imminent or breached SLA deadlines.</span>
            </div>
            <button
              onClick={() => {
                setActiveTab('live');
                setStatusFilter('');
                setSeverityFilter('');
              }}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-[11px] font-semibold transition-colors"
            >
              Review Now
            </button>
          </div>
        )}
      </div>

      {/* ─── 4 Metric KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Assigned Live Tickets */}
        <div className="relative p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Live Active Tickets</p>
              <h3 className="text-2xl font-bold text-white mt-1.5 flex items-baseline gap-2">
                {metrics.active_tickets ?? liveTickets.length}
                <span className="text-xs font-normal text-neutral-500">
                  / {metrics.max_capacity || 8} max
                </span>
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          {/* Capacity Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
              <span>Workload Capacity</span>
              <span>{capacityPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPct > 80 ? 'bg-red-500' : capacityPct > 50 ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Past Resolved Tickets */}
        <div className="relative p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Past Resolved Tickets</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">
                {metrics.resolved_tickets ?? pastTickets.length}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{metrics.resolution_rate || 100}% resolution rate</span>
          </div>
        </div>

        {/* Card 3: SLA Performance Compliance */}
        <div className="relative p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">SLA Compliance Rate</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1.5">
                {metrics.sla_compliance_rate || 100}%
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>{metrics.sla_breakdown?.breached || 0} breached tickets</span>
          </div>
        </div>

        {/* Card 4: Avg Turnaround Time */}
        <div className="relative p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-400">Avg Resolution Speed</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1.5">
                {metrics.avg_resolution_time_hours || 2.5}h
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
            <span>Benchmark target: &lt; 4.0h</span>
          </div>
        </div>
      </div>

      {/* ─── Tabs Navigation & Search Toolbar ──────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        {/* Workspace View Tabs */}
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-[#262626] overflow-x-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[.04]'
              }
            `}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Assigned Tickets
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'live' ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {liveTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${activeTab === 'past'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[.04]'
              }
            `}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Past Resolved Tickets
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'past' ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {pastTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[.04]'
              }
            `}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Personal Analytics
          </button>

          <button
            onClick={() => setActiveTab('dept')}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
              ${activeTab === 'dept'
                ? 'bg-[#22c55e] text-black font-bold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[.04]'
              }
            `}
          >
            <Compass className="w-3.5 h-3.5" />
            Dept Queue ({deptQueue.length})
          </button>
        </div>

        {/* Filter controls (shown on ticket tabs) */}
        {(activeTab === 'live' || activeTab === 'past') && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assigned..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter (Live only) */}
            {activeTab === 'live' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
              >
                <option value="">All Active Statuses</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Info">Pending Info</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* ─── TAB 1: LIVE ASSIGNED TICKETS ─────────────────────────────── */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {filteredLiveTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[#141414] border border-[#262626] text-center">
              <Inbox className="w-12 h-12 text-neutral-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No live tickets match your filter</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                You are all caught up! When tickets are routed to your department matching your skills, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredLiveTickets.map((ticket) => {
                const sevCfg = SEVERITY_CONFIG[ticket.severity] || SEVERITY_CONFIG.Medium;
                const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.New;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="cursor-pointer p-4 md:p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-blue-500/40 hover:bg-white/[.02] transition-all group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-neutral-500">#{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${sevCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                          {ticket.severity}
                        </span>
                        {ticket.category && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {ticket.category}
                          </span>
                        )}
                        <SlaBadge slaStatus={ticket.sla_status} dueAt={ticket.sla_due_at} />
                      </div>

                      <h4 className="text-sm md:text-base font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {ticket.title}
                      </h4>

                      <p className="text-xs text-neutral-400 line-clamp-1">
                        {ticket.ai_summary || ticket.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-neutral-500 pt-1">
                        <span className="flex items-center gap-1 text-neutral-400">
                          <User className="w-3 h-3" />
                          {ticket.user_email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Status Dropdown */}
                      <select
                        value={ticket.status}
                        onChange={(e) => handleQuickStatusUpdate(ticket.id, e.target.value, e)}
                        className="bg-[#1f1f1f] hover:bg-[#282828] border border-[#333] rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="In Progress">Set: In Progress</option>
                        <option value="Pending Info">Set: Pending Info</option>
                        <option value="Resolved">Set: Resolved ✓</option>
                      </select>

                      {/* Quick Reply Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyModalTicket(ticket);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Reply
                      </button>

                      {/* Open Full Detail Link */}
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="p-1.5 rounded-xl bg-white/[.05] hover:bg-white/[.10] text-neutral-400 hover:text-white transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: PAST RESOLVED TICKETS ─────────────────────────────── */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {filteredPastTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[#141414] border border-[#262626] text-center">
              <CheckCircle2 className="w-12 h-12 text-neutral-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No resolved tickets found</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Tickets you mark as Resolved or Closed will be archived in this historical log.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredPastTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="cursor-pointer p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-emerald-500/30 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-neutral-500">#{ticket.id}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        RESOLVED
                      </span>
                      {ticket.category && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-300">
                          {ticket.category}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors truncate">
                      {ticket.title}
                    </h4>

                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {ticket.ai_summary || ticket.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                      <span>User: {ticket.user_email}</span>
                      <span>•</span>
                      <span>Resolved: {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : 'Completed'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tickets/${ticket.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors"
                    >
                      View Record
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: PERSONAL ANALYTICS & PERFORMANCE ──────────────────── */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Category Distribution */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Tickets by Category
              </h3>
              <span className="text-xs text-neutral-500">Total: {metrics.total_assigned || 0}</span>
            </div>

            <div className="space-y-3 pt-2">
              {metrics.category_breakdown && Object.keys(metrics.category_breakdown).length > 0 ? (
                Object.entries(metrics.category_breakdown).map(([cat, count]) => {
                  const total = metrics.total_assigned || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-neutral-300">{cat}</span>
                        <span className="text-neutral-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-neutral-500 py-4">No category data yet.</p>
              )}
            </div>
          </div>

          {/* Severity & SLA Breakdown */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              SLA Health &amp; Priority Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[11px] text-red-300 font-medium">Critical Tickets</p>
                <p className="text-xl font-bold text-red-400 mt-1">
                  {metrics.severity_breakdown?.Critical || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[11px] text-amber-300 font-medium">High Severity</p>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {metrics.severity_breakdown?.High || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-[11px] text-blue-300 font-medium">SLA On Track</p>
                <p className="text-xl font-bold text-blue-400 mt-1">
                  {metrics.sla_breakdown?.on_track || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[11px] text-emerald-300 font-medium">Resolved on Time</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {metrics.resolved_tickets || 0}
                </p>
              </div>
            </div>

            {/* Performance Summary Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-white/[.03] border border-white/10 space-y-1">
              <p className="text-xs font-semibold text-white">Efficiency Summary</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                You are maintaining a <span className="text-emerald-400 font-semibold">{metrics.sla_compliance_rate || 100}%</span> SLA compliance rate with an average resolution turnaround of <span className="text-white font-semibold">{metrics.avg_resolution_time_hours || 2.5} hours</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: DEPARTMENT QUEUE (COLLABORATION) ──────────────────── */}
      {activeTab === 'dept' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {employee?.department || 'Department'} Peer Queue
              </h4>
              <p className="text-[11px] text-neutral-400">
                Open tickets assigned to teammates or queue. You can review and submit suggestions.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              {deptQueue.length} Active Tickets
            </span>
          </div>

          {deptQueue.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#141414] border border-[#262626] text-center text-xs text-neutral-400">
              No other open tickets currently in the {employee?.department || 'department'} queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {deptQueue.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="cursor-pointer p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500">#{t.id}</span>
                      <span className="text-xs font-semibold text-white truncate">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        {t.assignee_name || 'Unassigned'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-1">{t.description}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tickets/${t.id}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
                  >
                    Assist / View
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Quick Reply Modal ────────────────────────────────────────── */}
      {replyModalTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#181818] border border-[#333] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Quick Reply to Customer</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ticket #{replyModalTicket.id}: {replyModalTicket.title}
                </p>
              </div>
              <button
                onClick={() => setReplyModalTicket(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendQuickReply} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Message to {replyModalTicket.user_email}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your response or update..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full bg-[#101010] border border-[#333] rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {replySuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {replySuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyModalTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replySending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {replySending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

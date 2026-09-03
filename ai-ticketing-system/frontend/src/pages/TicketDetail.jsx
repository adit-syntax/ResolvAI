/**
 * TicketDetail Page — Module 5: Ticket lifecycle management
 * Shows AI analysis, timeline, flow diagram, and structured conversation.
 * Layout: Flow Graph → Original Issue → AI Summary → Agent Response (left column)
 *         Details + AI Analysis cards + Status + Actions (right sidebar)
 *
 * Permission model:
 *   admin                → full reply form (official response to user)
 *   assigned employee    → full reply form (only for their own ticket)
 *   other employees      → suggestion/comment form (internal, not sent to user)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Clock, User, MessageSquare, Send,
  AlertTriangle, CheckCircle2, Loader2, ArrowUpCircle, RefreshCw,
  FileText, Bot, Lightbulb, Lock, ShieldCheck, Cpu, Terminal, Shield, Layers
} from 'lucide-react';
import { ticketApi, knowledgeApi } from '../api.js';
import TicketFlowGraph from '../components/TicketFlowGraph.jsx';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending Info', 'Resolved', 'Closed'];

export default function TicketDetail({ role = 'employee', userEmail = '' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [agentTrace, setAgentTrace] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyForm, setReplyForm] = useState('');
  const [suggestionForm, setSuggestionForm] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);

  const pollRef = useRef(null);
  const CLOSED_STATUSES = ['Resolved', 'Closed'];

  const fetchData = useCallback(async (silent = false) => {
    try {
      const [t, tl, n, s, tr, dup] = await Promise.all([
        ticketApi.get(id),
        ticketApi.getTimeline(id),
        ticketApi.getNotes(id),
        ticketApi.getSuggestions(id),
        knowledgeApi.getAgentTrace(id).catch(() => null),
        knowledgeApi.getDuplicates(id).catch(() => []),
      ]);
      setTicket(t);
      setTimeline(tl);
      setNotes(n);
      setSuggestions(s);
      if (tr) setAgentTrace(tr);
      if (dup) setDuplicates(dup);
      if (!silent) setStatusUpdate(t.status);
      if (CLOSED_STATUSES.includes(t.status)) {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData(false);
    pollRef.current = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  // ─── Permission helpers ──────────────────────────────────────────────
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';

  // Compute after ticket is loaded
  const assigneeEmail = ticket?.assignee_email?.toLowerCase() || '';
  const actorEmail = (userEmail || '').toLowerCase();
  const isAssignedEmployee = isEmployee && actorEmail !== '' && actorEmail === assigneeEmail;

  // canReply = admin OR assigned employee
  const canReply = isAdmin || isAssignedEmployee;
  // canSuggest = employee who is NOT the assigned one
  const canSuggest = isEmployee && !isAssignedEmployee;
  // canUpdateStatus = admin only
  const canUpdateStatus = isAdmin;
  // canEscalate = admin only
  const canEscalate = isAdmin;

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleStatusUpdate = async () => {
    if (statusUpdate === ticket.status) return;
    try {
      await ticketApi.updateStatus(id, { status: statusUpdate, actor: isAdmin ? 'Admin' : userEmail });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleEscalate = async () => {
    if (!confirm('Escalate this ticket to another agent?')) return;
    try {
      const res = await ticketApi.escalate(id);
      alert(`Escalated to ${res.new_assignee}`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyForm.trim()) return;
    setReplySubmitting(true);
    try {
      await ticketApi.addReply(id, {
        author_email: userEmail || 'admin@company.com',
        author_name: isAdmin ? 'Admin' : 'Support Agent',
        content: replyForm,
        is_employee_reply: true,
        actor_email: userEmail || 'admin@company.com',
        actor_role: role,
      });
      setReplyForm('');
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setReplySubmitting(false); }
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!suggestionForm.trim()) return;
    setSuggestionSubmitting(true);
    try {
      await ticketApi.addSuggestion(id, {
        content: suggestionForm,
        author_name: userEmail.split('@')[0] || 'Employee',
        author_email: userEmail,
      });
      setSuggestionForm('');
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSuggestionSubmitting(false); }
  };

  const handleGenerateAIReply = async () => {
    setAiDraftLoading(true);
    try {
      const res = await ticketApi.generateAIReply(id);
      if (res && res.draft) setReplyForm(res.draft);
    } catch (err) {
      alert(err.message || 'Failed to generate AI draft');
    } finally {
      setAiDraftLoading(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────

  const getSeverityClass = (s) => {
    const m = { 'Critical': 'badge-critical', 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
    return `badge ${m[s] || 'badge-medium'}`;
  };

  const getStatusClass = (s) => {
    const m = { 'New': 'badge-status-open', 'Assigned': 'badge-status-progress', 'In Progress': 'badge-status-progress',
      'Pending Info': 'badge-status-progress', 'Resolved': 'badge-status-resolved', 'Closed': 'badge-status-closed' };
    return `badge ${m[s] || 'badge-status-open'}`;
  };

  function DetailSLABadge({ slaStatus }) {
    if (!slaStatus || slaStatus === 'resolved') {
      return (
        <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
          ✓ SLA Met
        </span>
      );
    }
    if (slaStatus === 'breached') {
      return (
        <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 font-mono animate-pulse flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> SLA Breached
        </span>
      );
    }
    if (slaStatus === 'at_risk') {
      return (
        <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" /> SLA &lt; 1h Remaining
        </span>
      );
    }
    return (
      <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-blue-400" /> SLA On Track
      </span>
    );
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—';

  const getTimelineIcon = (type) => {
    const icons = {
      'created': '🆕', 'ai_analysis': '🤖', 'auto_resolved': '✅', 'routed': '🔀',
      'assigned': '👤', 'status_change': '🔄', 'note': '📝', 'reply': '💬', 'reply_feedback': '👍',
      'escalation': '🚨', 'reopened': '🔓', 'resolved': '✅', 'reassigned': '🔀',
      'suggestion': '💡',
    };
    return icons[type] || '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-gray-400 text-lg">Ticket not found</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  const severityColor = {
    Critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    High:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
    Medium:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Low:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }[ticket.severity] || 'text-gray-400 bg-white/5 border-white/10';

  const isClosed = CLOSED_STATUSES.includes(ticket.status);

  return (
    <div className="animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/tickets')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-sm text-gray-500 font-mono">#{ticket.id}</span>
            <span className={getSeverityClass(ticket.severity)}>{ticket.severity}</span>
            <span className={getStatusClass(ticket.status)}>{ticket.status}</span>
            <DetailSLABadge slaStatus={ticket.sla_status} />
            {ticket.auto_resolved && (
              <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AI Resolved</span>
            )}
            {ticket.escalated && (
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Escalated</span>
            )}
            {/* Role badge */}
            {isAdmin && (
              <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
            {isAssignedEmployee && (
              <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center gap-1">
                <User className="w-3 h-3" /> Assigned Agent
              </span>
            )}
            {canSuggest && (
              <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Observer
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{ticket.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════════════════════════════════════════════════════
            LEFT COLUMN  (2/3)
        ════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1️⃣  Live Ticket Workflow */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🔀</span> Live Ticket Workflow
              <span className="ml-auto text-xs text-gray-600 font-normal">Pan · Zoom · Live Updates</span>
            </h3>
            <TicketFlowGraph ticket={ticket} />
          </div>

          {/* 2️⃣  Original Issue + AI Summary */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Original Issue
            </h3>
            <p className="text-gray-300 whitespace-pre-wrap bg-surface-900/30 p-4 rounded-xl border border-white/5 font-mono text-sm leading-relaxed">
              {ticket.description}
            </p>

            {ticket.ai_summary && (
              <>
                <div className="border-t border-white/5 mt-5 pt-5" />
                <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4" /> AI Summary
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{ticket.ai_summary}</p>

                {ticket.auto_resolved && ticket.auto_response && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> AI Auto-Response Sent to User
                    </p>
                    <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                      {ticket.auto_response}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 🤖 Autonomous AI Agent Reasoning & Tool Trace */}
            {agentTrace && (
              <div className="border-t border-white/5 mt-5 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" /> Autonomous Agent Diagnostic Trace (ReAct Loop)
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {agentTrace.reasoning_steps} Diagnostic Step(s)
                  </span>
                </div>

                {/* Steps Accordion / Cards */}
                <div className="space-y-3 bg-surface-900/50 p-4 rounded-xl border border-purple-500/20">
                  {agentTrace.trace?.map((step, idx) => (
                    <div key={idx} className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-300 font-mono">
                          Step {step.step}: {step.title || (step.step === 1 ? 'Knowledge Base & SOP Retrieval' : step.step === 2 ? 'Diagnostic & Account Verification' : 'Resolution Plan Synthesis & Grounding')}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          Action: {step.action}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 italic font-mono">
                        💭 "{step.thought}"
                      </p>
                      {step.observation && (
                        <div className="text-[11px] text-emerald-400 font-mono bg-neutral-900/80 p-2.5 rounded border border-neutral-800">
                          <span className="text-neutral-500 block mb-1">🔍 Tool Observation Output:</span>
                          <pre className="whitespace-pre-wrap">{JSON.stringify(step.observation, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* PII & Grounded Source Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-neutral-800/80 text-neutral-400">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Shield className="w-3.5 h-3.5" /> {agentTrace.pii_sanitization?.summary}
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> Grounded In: {agentTrace.grounded_source}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3️⃣  Agent Response / Suggestion Panel */}
          <div id="agent-response" className="glass-card overflow-hidden border-primary-500/20 shadow-lg shadow-primary-500/5">
            <div className="bg-surface-900/40 p-6 border-b border-white/5">

              {/* ── Admin / Assigned Employee: Official Reply Form ── */}
              {canReply && !isClosed && (
                <>
                  <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Official Reply
                    <span className="ml-auto text-[10px] font-normal text-gray-500 normal-case">
                      Sent to user · {isAdmin ? 'Admin' : 'Assigned Agent'}
                    </span>
                  </h3>
                  <form onSubmit={handleReplySubmit} className="mb-4">
                    <textarea
                      rows={4}
                      required
                      placeholder={`Write a reply to ${ticket.user_email}...`}
                      value={replyForm}
                      onChange={(e) => setReplyForm(e.target.value)}
                      className="input-field mb-3 resize-none bg-surface-800/80 focus:border-primary-500"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleGenerateAIReply}
                        disabled={aiDraftLoading}
                        className="px-3.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {aiDraftLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        {aiDraftLoading ? 'Drafting with AI...' : '✨ Generate AI Reply'}
                      </button>
                      <button
                        type="submit"
                        disabled={replySubmitting}
                        className="btn-primary text-sm py-2 px-6 flex items-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-60"
                      >
                        {replySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Reply to User
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ── Fellow Employee: Internal Suggestion Form ── */}
              {canSuggest && !isClosed && (
                <>
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Add Suggestion / Comment
                  </h3>
                  <p className="text-[11px] text-gray-500 mb-4 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Internal only — visible to admin &amp; employees, not sent to the user
                  </p>
                  <form onSubmit={handleSuggestionSubmit} className="mb-4">
                    <textarea
                      rows={3}
                      required
                      placeholder="Share a suggestion, workaround, or internal note..."
                      value={suggestionForm}
                      onChange={(e) => setSuggestionForm(e.target.value)}
                      className="input-field mb-3 resize-none bg-amber-500/5 focus:border-amber-500/50 border-amber-500/20"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={suggestionSubmitting}
                        className="px-5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {suggestionSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                        Post Suggestion
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ── Closed ticket notice ── */}
              {isClosed && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/3 rounded-xl p-4 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  This ticket is {ticket.status.toLowerCase()} — no further replies or suggestions can be added.
                </div>
              )}

              {/* ── Conversation History (official replies) ── */}
              {ticket.replies && ticket.replies.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#2a2a2a] mt-4 chat-scroll">
                  <h4 className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider mb-4">
                    Conversation History
                  </h4>
                  {ticket.replies.map((reply) => (
                    <div key={reply.id} className={`flex gap-2.5 ${!reply.is_employee_reply ? 'justify-end' : 'justify-start'}`}>
                      {reply.is_employee_reply && (
                        <div className="chat-avatar chat-avatar-agent">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className={reply.is_employee_reply ? 'chat-bubble-agent' : 'chat-bubble-user'}>
                        <div className="flex items-center justify-between gap-4 mb-2 border-b border-[#2a2a2a] pb-2">
                          <span className={`text-sm font-semibold ${reply.is_employee_reply ? 'text-purple-400' : 'text-neutral-300'}`}>
                            {reply.author_name}
                          </span>
                          <span className="text-xs text-neutral-500">{formatDate(reply.created_at)}</span>
                        </div>
                        <p className="text-sm text-neutral-200 whitespace-pre-wrap">{reply.content}</p>
                        {reply.is_employee_reply && reply.feedback_helpful !== null && (
                          <div className="mt-3 pt-2 text-[10px] flex items-center justify-end">
                            {reply.feedback_helpful
                              ? <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> User Satisfied</span>
                              : <span className="text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> User Escalated</span>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Suggestions Section (visible to admin & employees only) ── */}
            {(isAdmin || isEmployee) && suggestions.length > 0 && (
              <div className="p-6 bg-amber-500/3 border-t border-amber-500/15">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Team Suggestions
                  <span className="ml-auto text-[10px] font-normal text-gray-600 normal-case flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Internal Only
                  </span>
                </h4>
                <div className="space-y-3">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3" />
                          {s.author}
                          {s.author_email && (
                            <span className="text-[10px] text-gray-500 font-normal">{s.author_email}</span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-600">{formatDate(s.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{s.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If admin/employee but no suggestions yet, show empty hint */}
            {(isAdmin || isEmployee) && suggestions.length === 0 && (
              <div className="px-6 py-3 bg-amber-500/3 border-t border-amber-500/10">
                <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3 text-amber-600" />
                  No team suggestions yet. Fellow employees can post internal comments here.
                </p>
              </div>
            )}
          </div>

          {/* 4️⃣  Activity Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 border-b border-white/5 pb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Activity Timeline
            </h3>

            {timeline.length === 0 ? (
              <p className="text-[#A1A1A1] text-sm text-center py-6">No timeline events</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event, idx) => {
                  const type = event.event_type || '';

                  const simplify = (desc = '') => {
                    if (!desc) return desc;
                    if (desc.toLowerCase().includes('created')) return 'Ticket Created';
                    if (desc.toLowerCase().includes('ai analysis') || desc.toLowerCase().includes('analyzed')) return 'AI Analysis Completed';
                    if (desc.toLowerCase().includes('auto-resolved') || desc.toLowerCase().includes('auto resolved')) return 'AI Auto Resolved';
                    if (desc.toLowerCase().includes('routed') || desc.toLowerCase().includes('routing')) return 'Ticket Routed';
                    if (desc.toLowerCase().includes('employee reply') || desc.toLowerCase().includes('agent replied') || (type === 'reply' && event.actor !== ticket.user_email)) return 'Agent Replied';
                    if (desc.toLowerCase().includes('user reply') || (type === 'reply' && event.actor === ticket.user_email)) return 'User Replied';
                    if (desc.toLowerCase().includes('assigned')) return 'Ticket Assigned';
                    if (desc.toLowerCase().includes('escalat')) return 'Ticket Escalated';
                    if (desc.toLowerCase().includes('resolved')) return 'Ticket Resolved';
                    if (desc.toLowerCase().includes('closed')) return 'Ticket Closed';
                    if (desc.toLowerCase().includes('feedback') || desc.toLowerCase().includes('helpful')) return 'Feedback Submitted';
                    if (desc.toLowerCase().includes('status')) return 'Status Updated';
                    if (desc.toLowerCase().includes('reopened')) return 'Ticket Reopened';
                    if (type === 'suggestion' || desc.toLowerCase().includes('suggestion')) return '💡 Team Suggestion Added';
                    return desc.length > 48 ? desc.slice(0, 48) + '…' : desc;
                  };

                  const timeOnly = (d) => d
                    ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                    : '—';

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-4"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="w-16 flex-shrink-0 pt-0.5">
                        <span className="text-xs font-mono text-[#A1A1A1]">
                          {timeOnly(event.created_at)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-0.5">
                          {simplify(event.description)}
                        </p>
                        {event.actor && (
                          <p className="text-[11px] text-[#A1A1A1] truncate">{event.actor}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT SIDEBAR  (1/3)
        ════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Details Card */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3">
              {[
                ['Reported by', ticket.user_email],
                ['Department',  ticket.department],
                ['Assigned to', ticket.assignee_name],
                ['Created',     formatDate(ticket.created_at)],
                ['Assigned at', formatDate(ticket.assigned_at)],
                ['Resolved at', formatDate(ticket.resolved_at)],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm text-white font-medium">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Cards */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Analysis
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Category',        value: ticket.category },
                { label: 'Severity',        value: ticket.severity },
                { label: 'Sentiment',       value: ticket.sentiment },
                { label: 'Confidence',      value: `${Math.round((ticket.confidence_score || 0) * 100)}%` },
                { label: 'Resolution Path', value: ticket.recommended_resolution_path },
                { label: 'Est. Time',       value: ticket.estimated_resolution_time },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-900/40 p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-xs font-semibold text-white truncate">{value || '—'}</p>
                </div>
              ))}
            </div>
            <div className={`mt-3 px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 ${severityColor}`}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {ticket.severity} Priority
            </div>
          </div>

          {/* 🔗 Semantic Duplicates & Incident Clustering */}
          {duplicates && duplicates.length > 0 && (
            <div className="glass-card p-6 border-amber-500/20 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" /> Semantic Duplicates ({duplicates.length})
                </h3>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Cosine Match
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                The Vector AI Engine detected related tickets submitted with similar symptoms:
              </p>
              <div className="space-y-2">
                {duplicates.slice(0, 3).map((dup) => (
                  <button
                    key={dup.ticket_id}
                    onClick={() => navigate(`/tickets/${dup.ticket_id}`)}
                    className="w-full text-left p-2.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-colors group block"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-primary-400 font-bold group-hover:underline">#{dup.ticket_id}</span>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {Math.round(dup.similarity_score * 100)}% Similar
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white truncate">{dup.title}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 truncate">{dup.user_email}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Update — admin only */}
          {canUpdateStatus && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Update Status</h3>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="input-field text-sm py-2.5 mb-3"
                id="status-update-select"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleStatusUpdate} className="btn-primary w-full text-sm py-2">
                Update Status
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Actions</h3>
            <div className="space-y-3">
              {canEscalate && (
                <button onClick={handleEscalate} className="btn-danger w-full text-sm py-2 flex items-center justify-center gap-2">
                  <ArrowUpCircle className="w-4 h-4" /> Escalate Ticket
                </button>
              )}
              <button onClick={fetchData} className="btn-secondary w-full text-sm py-2 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh Data
              </button>
            </div>
          </div>

          {/* Permission Info Card */}
          <div className="glass-card p-5 border border-white/5">
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Your Permissions
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className={`flex items-center gap-2 ${canReply ? 'text-emerald-400' : 'text-gray-600'}`}>
                {canReply ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Send official reply to user
              </div>
              <div className={`flex items-center gap-2 ${canSuggest || canReply ? 'text-emerald-400' : 'text-gray-600'}`}>
                {(canSuggest || canReply) ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Post internal suggestion
              </div>
              <div className={`flex items-center gap-2 ${canUpdateStatus ? 'text-emerald-400' : 'text-gray-600'}`}>
                {canUpdateStatus ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Update ticket status
              </div>
              <div className={`flex items-center gap-2 ${canEscalate ? 'text-emerald-400' : 'text-gray-600'}`}>
                {canEscalate ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                Escalate ticket
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

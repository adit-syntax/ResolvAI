/**
 * DemoOverlayModal.jsx — Glassmorphism Modal Overlay simulating live AI Ticket Processing
 */

import React, { useState, useEffect } from 'react';
import {
  X, Cpu, CheckCircle2, Bot, ArrowRight, ShieldCheck,
  Zap, Clock, User, AlertTriangle, Play, RefreshCw, ThumbsUp, Activity
} from 'lucide-react';

const DEMO_SCENARIOS = [
  {
    id: 'ai-triage',
    title: 'Password Reset Request',
    category: 'Access',
    severity: 'Low',
    sentiment: 'Polite',
    userMsg: 'I cannot log in to my account after changing my password yesterday. Can someone help reset it?',
    aiSummary: 'User requires password reset instructions following recent password change.',
    action: 'Auto-Resolved',
    response: 'To reset your password, visit the login page and click "Forgot Password". Enter your email and follow the secure link sent to your inbox.',
  },
  {
    id: 'auto-resolution',
    title: 'Payment Discrepancy',
    category: 'Billing',
    severity: 'Medium',
    sentiment: 'Frustrated',
    userMsg: 'I was charged twice for my monthly subscription! Order #4920 shows duplicate $49 charges.',
    aiSummary: 'Duplicate transaction detected on subscription order #4920.',
    action: 'Auto-Resolved',
    response: 'We detected a duplicate charge of $49.00 for order #4920. A full refund of $49.00 has been initiated and will reflect in 3-5 business days.',
  },
  {
    id: 'smart-routing',
    title: 'Production Server Downtime',
    category: 'Server',
    severity: 'Critical',
    sentiment: 'Frustrated',
    userMsg: 'URGENT! Production server app-02 is returning HTTP 500 errors across all user endpoints.',
    aiSummary: 'Critical production outage on server app-02 returning 500 Internal Server Errors.',
    action: 'Assigned to DevOps (Alex River)',
    response: 'High severity issue detected. Automatically assigned to Alex River (DevOps Lead - 1 active ticket). Escalation notification sent.',
  },
  {
    id: 'live-chat',
    title: 'Leave Policy Query',
    category: 'HR',
    severity: 'Low',
    sentiment: 'Neutral',
    userMsg: 'How many days of carry-over leave am I allowed for the 2026 calendar year?',
    aiSummary: 'Inquiry regarding 2026 company leave carry-over policy.',
    action: 'Auto-Resolved',
    response: 'According to HR policy Section 4.2, employees are entitled to carry over up to 5 unused annual leave days into 2026.',
  },
  {
    id: 'executive-analytics',
    title: 'Database Query Latency',
    category: 'DB',
    severity: 'High',
    sentiment: 'Neutral',
    userMsg: 'Main analytics reporting query is timing out after 30s during peak hours.',
    aiSummary: 'Database timeout on analytics reporting query during high concurrency.',
    action: 'Assigned to Database Team (Sarah Chen)',
    response: 'Assigned to Sarah Chen (Senior DBA). Recommended action: Add index on created_at column.',
  },
];

export default function DemoOverlayModal({ initialScenario = 'ai-triage', onClose }) {
  const [selectedId, setSelectedId] = useState(initialScenario);
  const [step, setStep] = useState(1);
  const [simulating, setSimulating] = useState(false);

  const scenario = DEMO_SCENARIOS.find(s => s.id === selectedId) || DEMO_SCENARIOS[0];

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const runSimulation = () => {
    setSimulating(true);
    setStep(1);
    setTimeout(() => setStep(2), 600);
    setTimeout(() => setStep(3), 1300);
    setTimeout(() => {
      setStep(4);
      setSimulating(false);
    }, 2000);
  };

  useEffect(() => {
    runSimulation();
  }, [selectedId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-[#111111] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Autonomous Triage Trace</h3>
              <p className="text-[11px] text-neutral-400 font-mono">Deterministic classification &amp; policy routing preview</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Selector Tabs */}
        <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] border-b border-[#222222] overflow-x-auto">
          {DEMO_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => setSelectedId(sc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors font-medium whitespace-nowrap ${
                selectedId === sc.id
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                  : 'bg-[#171717] border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: User Submission */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 1 ? 'bg-[#161616] border-[#2a2a2a]' : 'opacity-40 border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 flex items-center gap-1.5">
                <User className="w-3 h-3 text-blue-400" /> Step 1 · Incoming User Issue
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">10:42 AM</span>
            </div>
            <p className="text-sm text-white font-medium bg-[#0d0d0d] p-3 rounded-lg border border-[#222222]">
              "{scenario.userMsg}"
            </p>
          </div>

          {/* Step 2: Triage & Extraction */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 2 ? 'bg-[#161616] border-emerald-500/30' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1.5 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Step 2 · Triage &amp; Metadata Extraction
              </span>
              {step >= 2 && (
                <span className="text-[10px] text-emerald-400 font-mono font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verified
                </span>
              )}
            </div>

            {step >= 2 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#0f0f0f] p-2.5 rounded-lg border border-[#262626]">
                  <span className="text-[10px] text-neutral-500 block">Category</span>
                  <span className="font-semibold text-white">{scenario.category}</span>
                </div>
                <div className="bg-[#0f0f0f] p-2.5 rounded-lg border border-[#262626]">
                  <span className="text-[10px] text-neutral-500 block">Severity</span>
                  <span className={`font-semibold ${scenario.severity === 'Critical' ? 'text-red-400' : scenario.severity === 'High' ? 'text-orange-400' : 'text-amber-400'}`}>
                    {scenario.severity}
                  </span>
                </div>
                <div className="bg-[#0f0f0f] p-2.5 rounded-lg border border-[#262626]">
                  <span className="text-[10px] text-neutral-500 block">Sentiment</span>
                  <span className="font-semibold text-purple-400">{scenario.sentiment}</span>
                </div>
                <div className="bg-[#0f0f0f] p-2.5 rounded-lg border border-[#262626]">
                  <span className="text-[10px] text-neutral-500 block">Action Path</span>
                  <span className="font-semibold text-emerald-400 truncate block">{scenario.action}</span>
                </div>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-xs text-neutral-600 font-mono">Analyzing payload...</div>
            )}
          </div>

          {/* Step 3: Resolution / Routing */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 3 ? 'bg-[#161616] border-[#2a2a2a]' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Step 3 · Policy Action &amp; Routing Output
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">Completed</span>
            </div>

            {step >= 3 ? (
              <div className="bg-[#0d0d0d] p-3 rounded-lg border border-[#222222] space-y-2">
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Deterministic Response / Assignment:</p>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans">{scenario.response}</p>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-xs text-neutral-600 font-mono">Executing action...</div>
            )}
          </div>

          {/* Step 4: Completion */}
          {step >= 4 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Ticket pipeline execution succeeded (200 OK)
              </span>
              <button
                onClick={runSimulation}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors text-xs font-mono"
              >
                <RefreshCw className="w-3 h-3" /> Re-run Trace
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141414] border-t border-[#222222] flex items-center justify-between">
          <p className="text-xs text-neutral-400 font-mono">Telemetry Status: Active · Benchmark Latency: 1.2s</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs transition-colors"
          >
            Close Simulation
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * DemoOverlayModal.jsx — Glassmorphism Modal Overlay simulating live AI Ticket Processing
 */

import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, CheckCircle2, Bot, ArrowRight, ShieldCheck,
  Zap, Clock, User, AlertTriangle, Play, RefreshCw, ThumbsUp
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
    confidence: '98.5%',
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
    confidence: '95.2%',
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
    confidence: '99.1%',
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
    confidence: '96.0%',
    action: 'Auto-Resolved',
    response: 'According to HR policy Section 4.2, employees are entitled to carry over up to 5 unused annual leave days into 2026.',
  },
  {
    id: 'executive-analytics',
    title: 'Database Query Latency',
    category: 'DB',
    severity: 'High',
    sentiment: 'Neutral',
    userMsg: 'Main PostgreSQL analytics query is timing out after 30s during peak hours.',
    aiSummary: 'Database timeout on analytics reporting query during high concurrency.',
    confidence: '97.4%',
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
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#22c55e]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live AI Triage Simulation</h3>
              <p className="text-[11px] text-neutral-400">Interactive preview of ResolvAI autonomous processing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedId === sc.id
                  ? 'bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e]'
                  : 'bg-[#171717] border border-[#2a2a2a] text-neutral-400 hover:text-white'
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

          {/* Step 2: AI Analysis */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 2 ? 'bg-[#22c55e]/5 border-[#22c55e]/30 shadow-lg shadow-[#22c55e]/5' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#22c55e] flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3 h-3 animate-spin" /> Step 2 · Autonomous AI Extraction
              </span>
              {step >= 2 && (
                <span className="text-[10px] text-[#22c55e] font-mono font-semibold bg-[#22c55e]/10 px-2 py-0.5 rounded-full border border-[#22c55e]/20">
                  Confidence: {scenario.confidence}
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
                  <span className="font-semibold text-[#22c55e] truncate block">{scenario.action}</span>
                </div>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-xs text-neutral-600">Analyzing text context...</div>
            )}
          </div>

          {/* Step 3: Resolution / Routing */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 3 ? 'bg-[#161616] border-[#2a2a2a]' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Bot className="w-3 h-3 text-[#22c55e]" /> Step 3 · Executed Action &amp; Output
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">Completed</span>
            </div>

            {step >= 3 ? (
              <div className="bg-[#0d0d0d] p-3 rounded-lg border border-[#222222] space-y-2">
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">AI Generated Answer / Assignment:</p>
                <p className="text-xs text-neutral-200 leading-relaxed">{scenario.response}</p>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-xs text-neutral-600">Executing action...</div>
            )}
          </div>

          {/* Step 4: Completion */}
          {step >= 4 && (
            <div className="p-4 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-between text-xs text-[#22c55e] font-semibold animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Triage completed successfully in 1.2 seconds!
              </span>
              <button
                onClick={runSimulation}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] transition-all text-xs"
              >
                <RefreshCw className="w-3 h-3" /> Re-run Demo
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141414] border-t border-[#222222] flex items-center justify-between">
          <p className="text-xs text-neutral-500">ResolvAI Triage Simulator · Zero manual overhead</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            Close Interactive Overlay
          </button>
        </div>

      </div>
    </div>
  );
}

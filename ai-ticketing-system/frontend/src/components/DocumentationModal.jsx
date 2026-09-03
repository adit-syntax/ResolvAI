/**
 * DocumentationModal.jsx — In-Depth Project Documentation Modal
 * Clean, searchable, multi-section documentation viewer for ResolvAI
 */

import React, { useState } from 'react';
import {
  X, BookOpen, Layers, ShieldCheck, Users, Bot, MessageSquare,
  BarChart3, Terminal, CheckCircle2, Search, ExternalLink, Code2,
  FileText, Cpu, Database
} from 'lucide-react';
import ResolvAiLogo from './ResolvAiLogo.jsx';

const DOC_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview & Architecture',
    icon: Layers,
    content: (
      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <h4 className="text-sm font-bold text-white">System Architecture</h4>
        <p>
          ResolvAI is an intelligent, full-stack ticketing platform designed to automate routine inquiries, balance team workloads, and facilitate real-time support collaboration.
        </p>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 font-mono text-[11px]">
          <div className="text-neutral-400 font-semibold mb-1">Architecture Components:</div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e] font-bold">•</span>
            <span><strong className="text-white">Backend:</strong> Python FastAPI REST API with asynchronous request handling and background SLA monitoring loops.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <span><strong className="text-white">Database:</strong> SQLAlchemy ORM configured with local SQLite for development and PostgreSQL support for production.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <span><strong className="text-white">Real-Time Messaging:</strong> Full-duplex WebSocket bus for synchronized customer-agent communication.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong className="text-white">Frontend:</strong> React 18 SPA built with Vite, TailwindCSS, and client-side JWT authorization.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span><strong className="text-white">Knowledge Engine:</strong> Vector embedding index with hybrid BM25 search for matching standard operating procedures (SOPs).</span>
          </div>
        </div>

        <h4 className="text-sm font-bold text-white pt-2">Ticket Lifecycle Flow</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-[#22c55e] font-bold mb-1">1. Submission</div>
            <div className="text-neutral-400">User submits issue with title, description, and attachments.</div>
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-blue-400 font-bold mb-1">2. Triage</div>
            <div className="text-neutral-400">AI determines category, priority, and searches Knowledge Base.</div>
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-purple-400 font-bold mb-1">3. Action</div>
            <div className="text-neutral-400">Instant auto-response sent OR routed to available staff.</div>
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-amber-400 font-bold mb-1">4. Resolution</div>
            <div className="text-neutral-400">User confirms resolution via one-click satisfaction prompt.</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'roles',
    title: 'User Roles & Permissions',
    icon: Users,
    content: (
      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <h4 className="text-sm font-bold text-white">Role-Based Access Control (RBAC)</h4>
        <p>
          ResolvAI implements role separation via JWT tokens, providing scoped dashboards and permissions:
        </p>

        <div className="space-y-3">
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                End User
              </span>
              <span className="font-semibold text-white">Support Portal View</span>
            </div>
            <p className="text-neutral-400 text-xs">
              Can submit new tickets, view ticket history, participate in real-time chat with assigned agents, and mark tickets as resolved.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Support Employee
              </span>
              <span className="font-semibold text-white">Staff Workspace</span>
            </div>
            <p className="text-neutral-400 text-xs">
              Can view tickets assigned to their queue, draft AI-assisted responses, post internal notes, adjust ticket status (In Progress, Pending Info, Resolved), and initiate ticket re-routing.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Administrator
              </span>
              <span className="font-semibold text-white">Admin Management Console</span>
            </div>
            <p className="text-neutral-400 text-xs">
              Has global access across all tickets, employee directories, active workload reallocation, knowledge base curation, SLA escalation sweeps, and analytics metrics.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'triage-rag',
    title: 'AI Triage & Knowledge Base',
    icon: Bot,
    content: (
      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <h4 className="text-sm font-bold text-white">Automated Triage &amp; Knowledge Matching</h4>
        <p>
          When a ticket arrives, it executes a modular diagnostic pipeline:
        </p>

        <div className="space-y-3 font-mono text-[11px]">
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
            <div className="text-emerald-400 font-bold mb-1">1. Category &amp; Urgency Detection</div>
            <div className="text-neutral-400">
              Evaluates natural language context to classify tickets into categories: <strong>Access</strong>, <strong>Billing</strong>, <strong>Server</strong>, <strong>HR</strong>, or <strong>General</strong>, assigning priority (Low, Medium, High, Critical).
            </div>
          </div>

          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
            <div className="text-blue-400 font-bold mb-1">2. Hybrid Knowledge Base Query (RAG)</div>
            <div className="text-neutral-400">
              Performs vector similarity matching combined with BM25 keyword search over registered standard operating procedures (SOPs). If a match is verified, an automatic response is proposed or sent.
            </div>
          </div>

          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
            <div className="text-purple-400 font-bold mb-1">3. Zero-Trust PII Redaction</div>
            <div className="text-neutral-400">
              Detects and redacts sensitive entities (credit cards, passwords, tokens, SSNs) prior to processing or logging, ensuring data privacy standards.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'routing',
    title: 'Workload Routing Engine',
    icon: Cpu,
    content: (
      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <h4 className="text-sm font-bold text-white">Dynamic Workload Balancing</h4>
        <p>
          Unlike static round-robin dispatching, ResolvAI balances incoming tickets across team members dynamically:
        </p>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5 text-neutral-400">
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e] font-bold">1.</span>
            <span><strong>Department &amp; Skill Matching:</strong> Filters active staff by matching ticket category with employee skill-tags (e.g. DevOps, Billing, Identity).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e] font-bold">2.</span>
            <span><strong>Active Queue Count:</strong> Calculates current open tickets for each eligible employee.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e] font-bold">3.</span>
            <span><strong>Availability Check:</strong> Verifies employee status (Available vs Away) to prevent assigning tickets to off-duty staff.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e] font-bold">4.</span>
            <span><strong>Lowest Workload Assignment:</strong> Assigns the ticket to the employee with the lowest active load to ensure balanced distribution.</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'api',
    title: 'API Endpoints Reference',
    icon: Code2,
    content: (
      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <h4 className="text-sm font-bold text-white">Core REST API Endpoints</h4>
        <p className="text-neutral-400">
          All endpoints are organized modularly under FastAPI routers:
        </p>

        <div className="space-y-2 font-mono text-[11px]">
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
            <span><strong className="text-[#22c55e]">POST</strong> /api/auth/login</span>
            <span className="text-neutral-500">User &amp; Staff JWT Auth</span>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
            <span><strong className="text-blue-400">GET</strong> /api/tickets</span>
            <span className="text-neutral-500">List and filter tickets</span>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
            <span><strong className="text-[#22c55e]">POST</strong> /api/tickets</span>
            <span className="text-neutral-500">Create ticket with triage</span>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
            <span><strong className="text-amber-400">PATCH</strong> /api/tickets/{'{id}'}/status</span>
            <span className="text-neutral-500">Status transition</span>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
            <span><strong className="text-purple-400">WS</strong> /api/tickets/{'{id}'}/ws</span>
            <span className="text-neutral-500">Live ticket chat bus</span>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
            <span><strong className="text-blue-400">GET</strong> /api/analytics/overview</span>
            <span className="text-neutral-500">Team health &amp; metrics</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function DocumentationModal({ isOpen, onClose }) {
  const [activeSectionId, setActiveSectionId] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const activeSection = DOC_SECTIONS.find(s => s.id === activeSectionId) || DOC_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <ResolvAiLogo className="w-6 h-6" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                ResolvAI Documentation
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  v1.0
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">System architecture, roles, triage logic, and API reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column Sidebar + Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Navigation */}
          <div className="md:col-span-4 border-r border-neutral-800 bg-neutral-950/30 p-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-3 py-1.5 block">
              Documentation Topics
            </span>
            {DOC_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeSectionId;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#22c55e]' : 'text-neutral-500'}`} />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 p-6 overflow-y-auto max-h-[65vh]">
            {activeSection.content}
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-500">
          <span>ResolvAI System Reference</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  );
}

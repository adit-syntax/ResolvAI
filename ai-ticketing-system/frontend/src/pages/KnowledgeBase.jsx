import React, { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, Shield, Search, Plus, Filter, CheckCircle2,
  ExternalLink, Layers, ArrowRight, RefreshCw, AlertTriangle, FileText,
  Lock, Key, CreditCard, Terminal, Cpu, Database, Server, Headphones,
  Tag, Info, HelpCircle
} from 'lucide-react';
import { knowledgeApi } from '../api';

export default function KnowledgeBase({ user }) {
  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'rag_playground' | 'pii_sandbox' | 'incidents'
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // RAG Playground State
  const [ragQuery, setRagQuery] = useState('How do I troubleshoot 502 Bad Gateway errors on the API Gateway?');
  const [ragResults, setRagResults] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);

  // PII Sandbox State
  const [piiInput, setPiiInput] = useState(
    "My database connection password is 'SecretDevPass99!' and my Stripe API key is gsk_9918239019283019283019283. Please investigate transaction for card 4111111111111111."
  );
  const [piiOutput, setPiiOutput] = useState(null);
  const [piiLoading, setPiiLoading] = useState(false);

  // Incidents State
  const [incidents, setIncidents] = useState([]);

  // Create Article Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Access');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [artData, incData] = await Promise.all([
        knowledgeApi.getArticles(),
        knowledgeApi.getLiveIncidents(),
      ]);
      setArticles(artData || []);
      setIncidents(incData || []);
    } catch (err) {
      console.error('Failed to load knowledge data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRAG = async (queryText = ragQuery) => {
    if (!queryText.trim()) return;
    setRagLoading(true);
    try {
      const data = await knowledgeApi.queryRAG(queryText, 3);
      setRagResults(data);
    } catch (err) {
      console.error('RAG query failed', err);
    } finally {
      setRagLoading(false);
    }
  };

  const handleSanitizePII = async () => {
    if (!piiInput.trim()) return;
    setPiiLoading(true);
    try {
      const data = await knowledgeApi.sanitizePII(piiInput);
      setPiiOutput(data);
    } catch (err) {
      console.error('PII test failed', err);
    } finally {
      setPiiLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    try {
      const tagsArray = newTags.split(',').map((t) => t.trim()).filter(Boolean);
      await knowledgeApi.createArticle({
        title: newTitle,
        category: newCategory,
        content: newContent,
        tags: tagsArray,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create article');
    } finally {
      setCreating(false);
    }
  };

  const categories = ['All', 'Access', 'Server', 'DB', 'Billing', 'HR', 'Bug'];

  const filteredArticles = articles.filter((art) => {
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      art.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-emerald-950/20 to-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Native GenAI Hub
              </span>
              <span className="text-xs text-neutral-500">• Hybrid Dense + BM25 Vector Space</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Knowledge Base &amp; RAG Engine
            </h1>
            <p className="text-neutral-400 text-sm mt-1 max-w-2xl">
              Retrieval-Augmented Generation (RAG) vector index, autonomous diagnostic tools, and real-time PII safety guardrails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role !== 'user' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#22c55e]/20 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Standard SOP
              </button>
            )}
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 transition-colors"
              title="Refresh Index"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'articles'
                ? 'bg-neutral-800 text-white shadow-inner border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#22c55e]" /> Verified SOPs ({articles.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('rag_playground');
              if (!ragResults) handleRunRAG();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'rag_playground'
                ? 'bg-neutral-800 text-white shadow-inner border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> RAG Semantic Playground
          </button>

          <button
            onClick={() => {
              setActiveTab('pii_sandbox');
              if (!piiOutput) handleSanitizePII();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'pii_sandbox'
                ? 'bg-neutral-800 text-white shadow-inner border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" /> Enterprise PII Guardrails
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'incidents'
                ? 'bg-neutral-800 text-white shadow-inner border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Outage Clustering ({incidents.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ARTICLES DIRECTORY ────────────────────────────────────────── */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search runbooks, SOPs, tags..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#22c55e]/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                      : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {art.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-400 border border-neutral-700/50">
                      {art.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-[#22c55e] transition-colors line-clamp-2 mb-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-4 leading-relaxed font-normal whitespace-pre-line">
                    {art.content}
                  </p>
                </div>

                {art.tags && art.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-neutral-800/60">
                    {art.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-[10px] text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: RAG SEMANTIC PLAYGROUND ───────────────────────────────────── */}
      {activeTab === 'rag_playground' && (
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Ask Any Support Query (Hybrid RAG Vector Search)
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunRAG()}
                placeholder="Type any question (e.g. 'How many PTO days can I roll over?')"
                className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={() => handleRunRAG()}
                disabled={ragLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50"
              >
                {ragLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Retrieve &amp; Generate
              </button>
            </div>

            {/* Quick Demo Prompts */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-neutral-400">
              <span className="text-neutral-500">Try Prompt:</span>
              <button
                onClick={() => { setRagQuery("How do I troubleshoot 502 Bad Gateway on API gateway pods?"); handleRunRAG("How do I troubleshoot 502 Bad Gateway on API gateway pods?"); }}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-purple-500/40 text-neutral-300 transition-colors"
              >
                🚀 502 API Outage Runbook
              </button>
              <button
                onClick={() => { setRagQuery("How do I optimize slow queries and lock contention in Postgres?"); handleRunRAG("How do I optimize slow queries and lock contention in Postgres?"); }}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-purple-500/40 text-neutral-300 transition-colors"
              >
                🗄️ Database Latency SOP
              </button>
              <button
                onClick={() => { setRagQuery("What is the annual paid vacation policy and rollover limit?"); handleRunRAG("What is the annual paid vacation policy and rollover limit?"); }}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-purple-500/40 text-neutral-300 transition-colors"
              >
                🌴 HR Vacation &amp; Sick Policy
              </button>
            </div>
          </div>

          {/* RAG Results Display */}
          {ragResults && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Grounded AI Answer */}
              <div className="lg:col-span-2 bg-neutral-900/80 border border-purple-500/20 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">Grounded AI Auto-Resolution</h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    Confidence: {Math.round((ragResults.confidence_score || 0) * 100)}%
                  </span>
                </div>

                <div className="text-sm text-neutral-200 leading-relaxed font-mono whitespace-pre-line bg-neutral-950 p-4 rounded-xl border border-neutral-800/80">
                  {ragResults.answer}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Grounded in enterprise documentation
                  </span>
                  <span>Auto-resolve eligible: <strong className={ragResults.can_auto_resolve ? "text-emerald-400" : "text-amber-400"}>{ragResults.can_auto_resolve ? "Yes" : "Requires Staff"}</strong></span>
                </div>
              </div>

              {/* Retrieved Context Chunks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Retrieved Context Chunks ({ragResults.sources?.length || 0})
                </h4>

                {ragResults.sources?.map((doc, idx) => (
                  <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-purple-400">{doc.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {Math.round(doc.similarity * 100)}% Match
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">{doc.title}</p>
                    <p className="text-[11px] text-neutral-400 italic">"{doc.excerpt}"</p>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ENTERPRISE PII GUARDRAILS SANDBOX ─────────────────────────── */}
      {activeTab === 'pii_sandbox' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" /> Enterprise PII &amp; Secrets Guardrail Sandbox
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Automatically sanitizes API keys, database passwords, Luhn-validated credit cards, and SSNs before prompting external LLMs.
                </p>
              </div>
              <button
                onClick={handleSanitizePII}
                disabled={piiLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
              >
                {piiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Run Sanitizer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Raw Prompt */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-neutral-500" /> Raw Input (Contains Sensitive PII/Keys)
                </label>
                <textarea
                  rows={6}
                  value={piiInput}
                  onChange={(e) => setPiiInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Output Sanitized Prompt */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sanitized Output (Sent to LLM)
                </label>
                <div className="w-full h-[142px] p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-emerald-300 font-mono overflow-y-auto whitespace-pre-line">
                  {piiOutput ? piiOutput.sanitized_text : 'Click "Run Sanitizer" to inspect redaction...'}
                </div>
              </div>
            </div>

            {/* Audit Summary */}
            {piiOutput && (
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">PII Audit Summary</h5>
                    <p className="text-xs text-blue-200 mt-0.5">{piiOutput.audit_summary}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {piiOutput.redacted_entities?.length || 0} Entities Redacted
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: OUTAGE CLUSTERING & INCIDENT SPIKES ──────────────────────── */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Live Incident &amp; Outage Clustering
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Semantic AI Engine clusters tickets with cosine similarity &gt; 0.50 within sliding time windows to detect active infrastructure outages.
            </p>

            {incidents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-white">No Active Outage Clusters</h4>
                <p className="text-xs text-neutral-500 mt-1">All active tickets have isolated root causes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((inc) => (
                  <div key={inc.cluster_id} className="bg-neutral-950 border border-red-500/30 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          {inc.cluster_id}
                        </span>
                        <h4 className="text-sm font-bold text-white">{inc.title}</h4>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 w-fit">
                        {inc.severity} Severity
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                      💡 <strong>Recommended Action:</strong> {inc.recommended_action}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                      <span>Grouped Tickets: <strong className="text-white">{inc.ticket_count}</strong></span>
                      <span>Affected Users: <strong className="text-white">{inc.affected_users_count}</strong></span>
                      <span>Status: <strong className="text-emerald-400">{inc.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CREATE ARTICLE MODAL ────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#22c55e]" /> Ingest New Knowledge SOP into Vector Index
            </h3>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 mb-1 block">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Redis Cache Eviction & Cold-Start Troubleshooting"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 mb-1 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#22c55e]/50"
                  >
                    <option value="Access">Access</option>
                    <option value="Server">Server</option>
                    <option value="DB">DB</option>
                    <option value="Billing">Billing</option>
                    <option value="HR">HR</option>
                    <option value="Bug">Bug</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 mb-1 block">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="redis, cache, memory, ops"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#22c55e]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-400 mb-1 block">Content / Troubleshooting Runbook</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Step-by-step diagnostic and resolution procedures..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#22c55e]/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-xs transition-all shadow-lg shadow-[#22c55e]/20 disabled:opacity-50"
                >
                  {creating ? 'Ingesting into Vector Space...' : 'Ingest & Index SOP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

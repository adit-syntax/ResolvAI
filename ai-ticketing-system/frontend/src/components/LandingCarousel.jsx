/**
 * LandingCarousel.jsx — Interactive Carousel with Auto-play, Micro-animations & Card Hovering
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, Zap, ShieldCheck, MessageSquare, BarChart3,
  ChevronLeft, ChevronRight, Play, ExternalLink, CheckCircle2, ArrowRight
} from 'lucide-react';

const CAROUSEL_SLIDES = [
  {
    id: 'ai-triage',
    badge: '01 · AI Triage',
    title: 'Automated Ticket Triage & Categorization',
    subtitle: 'Zero manual categorization required',
    description: 'When a ticket is submitted, ResolvAI analyzes the description to detect intent, assign categories (Billing, Access, Server, HR), and determine priority level.',
    icon: Sparkles,
    gradient: 'from-emerald-500/10 to-green-500/5',
    accentColor: 'text-[#22c55e]',
    borderColor: 'border-[#22c55e]/30',
    hoverBorder: 'hover:border-[#22c55e]/60',
    stats: [
      { label: 'Intent Detection', val: 'NLP Context' },
      { label: 'Categorization', val: 'Automated' },
      { label: 'Severity Scoring', val: 'Context-Aware' },
    ],
    features: [
      'Natural language issue recognition',
      'Automated priority and severity classification',
      'Instant intent extraction from ticket description',
    ],
  },
  {
    id: 'auto-resolution',
    badge: '02 · Knowledge Base',
    title: 'Knowledge Base SOP Matching',
    subtitle: 'Resolve repetitive inquiries with verified documentation',
    description: 'ResolvAI queries your organization’s internal knowledge base and verified SOPs to suggest accurate answers for frequent inquiries.',
    icon: Bot,
    gradient: 'from-blue-500/10 to-cyan-500/5',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/60',
    stats: [
      { label: 'Solution Source', val: 'Verified SOPs' },
      { label: 'Suggested Answers', val: 'Instant' },
      { label: 'Resolution Feedback', val: 'One-Click' },
    ],
    features: [
      'Search against internal documentation runbooks',
      'Auto-response suggestions for common issues',
      'User satisfaction confirmation loop',
    ],
  },
  {
    id: 'smart-routing',
    badge: '03 · Workload Routing',
    title: 'Skill & Workload-Based Assignment',
    subtitle: 'Optimal agent assignment without queue bottlenecks',
    description: 'Unresolved issues are automatically assigned to team members based on department, relevant skill-tags, and active ticket workload.',
    icon: Zap,
    gradient: 'from-purple-500/10 to-indigo-500/5',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-500/60',
    stats: [
      { label: 'Workload Balancing', val: 'Active Queue Check' },
      { label: 'Specialist Matching', val: 'Skill Tags' },
      { label: 'Re-assignment', val: 'Manual & Auto' },
    ],
    features: [
      'Active workload monitoring per team member',
      'Skill-tag matching for specialized technical issues',
      'Flexible reassignment and escalation controls',
    ],
  },
  {
    id: 'live-chat',
    badge: '04 · Real-Time Chat',
    title: 'Live Interactive Support Messaging',
    subtitle: 'Direct communication between users and staff',
    description: 'Integrated WebSocket communication thread enables real-time messaging, status updates, screenshot attachments, and resolution confirmations.',
    icon: MessageSquare,
    gradient: 'from-amber-500/10 to-orange-500/5',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/60',
    stats: [
      { label: 'Communication', val: 'Live WebSocket' },
      { label: 'File Sharing', val: 'Image Attachments' },
      { label: 'Timeline History', val: 'Full Audit Trail' },
    ],
    features: [
      'Live synchronized chat thread on every ticket',
      'Resolution satisfaction confirmation buttons',
      'Timestamped action timeline and internal notes',
    ],
  },
  {
    id: 'executive-analytics',
    badge: '05 · Analytics',
    title: 'Team Analytics & SLA Oversight',
    subtitle: 'Visibility into workload, resolution times, and team health',
    description: 'Track department ticket volume, resolution statuses, employee workload distribution, and SLA compliance with visual charts.',
    icon: BarChart3,
    gradient: 'from-emerald-500/10 to-teal-500/5',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
    stats: [
      { label: 'Status Tracking', val: 'Real-Time' },
      { label: 'SLA Monitoring', val: 'Automated' },
      { label: 'Department Trends', val: 'Visual Charts' },
    ],
    features: [
      'Open vs. resolved ticket volume breakdown',
      'Employee workload and ticket assignment metrics',
      'Category distribution and resolution analytics',
    ],
  },
];

export default function LandingCarousel({ onOpenOverlay }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);

  // Auto-play interval
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % CAROUSEL_SLIDES.length);
      }, 5000);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const slide = CAROUSEL_SLIDES[currentIndex];
  const Icon = slide.icon;

  return (
    <div
      className="relative w-full max-w-5xl mx-auto my-12"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background glow behind carousel */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#22c55e]/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50 transition-all duration-700 pointer-events-none" />

      {/* Main Glass Carousel Box */}
      <div className={`relative bg-[#111111]/90 border ${slide.borderColor} ${slide.hoverBorder} backdrop-blur-xl rounded-2xl p-6 md:p-10 shadow-2xl transition-all duration-500 overflow-hidden group`}>
        
        {/* Top bar with Badge & Prev/Next Controls */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 ${slide.accentColor}`}>
              {slide.badge}
            </span>
            <span className="text-xs text-neutral-500 flex items-center gap-1.5 ml-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              {isAutoPlaying ? 'Autoplay active' : 'Paused on hover'}
            </span>
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-[#252525] transition-all active:scale-95"
              title="Previous feature"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-[#252525] transition-all active:scale-95"
              title="Next feature"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left info column */}
          <div className="lg:col-span-7 space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${slide.gradient} border ${slide.borderColor} flex items-center justify-center shadow-lg`}>
                <Icon className={`w-6 h-6 ${slide.accentColor}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{slide.title}</h3>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">{slide.subtitle}</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              {slide.description}
            </p>

            {/* Feature List */}
            <div className="space-y-2 pt-2">
              {slide.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className={`w-4 h-4 ${slide.accentColor} flex-shrink-0`} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* CTA inside slide */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenOverlay(slide.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border ${slide.borderColor} text-white font-semibold text-xs transition-all active:scale-95 shadow-md`}
              >
                <ExternalLink className="w-4 h-4" />
                Interactive Preview Overlay
              </button>
            </div>
          </div>

          {/* Right Stats & Visual Card */}
          <div className="lg:col-span-5">
            <div className={`bg-[#0a0a0a]/80 border ${slide.borderColor} rounded-xl p-5 space-y-4 hover:scale-[1.02] transition-transform duration-300 shadow-xl`}>
              <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${slide.accentColor}`} /> Key Capability Metrics
                </span>
                <span className="text-[10px] text-neutral-600 font-mono">LIVE BENCHMARK</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-3">
                {slide.stats.map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222222]">
                    <span className="text-xs text-neutral-400">{st.label}</span>
                    <span className={`text-sm font-bold font-mono ${slide.accentColor}`}>{st.val}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => onOpenOverlay(slide.id)}
                  className="w-full py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] text-[#22c55e] text-xs font-semibold border border-[#22c55e]/20 hover:border-[#22c55e]/50 transition-all flex items-center justify-center gap-1.5"
                >
                  Simulate Triage Flow <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-[#1f1f1f]">
          {CAROUSEL_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-[#22c55e]'
                  : 'w-2 bg-neutral-700 hover:bg-neutral-500'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

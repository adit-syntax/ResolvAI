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
    badge: '01 · AI Core',
    title: 'Autonomous AI Triage & Analysis',
    subtitle: 'Zero manual categorization required',
    description: 'When a ticket is submitted, ResolvAI instantly analyzes text context, assigns category, flags critical severity, and determines user sentiment within milliseconds.',
    icon: Sparkles,
    gradient: 'from-emerald-500/20 to-green-500/5',
    accentColor: 'text-[#22c55e]',
    borderColor: 'border-[#22c55e]/30',
    hoverBorder: 'hover:border-[#22c55e]/60',
    stats: [
      { label: 'Triage Time', val: '< 1.5s' },
      { label: 'Category Accuracy', val: '99.2%' },
      { label: 'Auto-Tagging', val: 'Instant' },
    ],
    features: [
      'Natural Language Intent Recognition',
      'Sentiment Analysis (Frustrated, Neutral, Polite)',
      'Smart Urgency & Severity Scoring',
    ],
  },
  {
    id: 'auto-resolution',
    badge: '02 · Auto-Resolve',
    title: 'Instant Auto-Resolution Engine',
    subtitle: 'Resolve repetitive tickets without human intervention',
    description: 'ResolvAI matches incoming queries against known knowledge bases and past solutions, delivering complete, verified answers instantly.',
    icon: Bot,
    gradient: 'from-blue-500/20 to-cyan-500/5',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/60',
    stats: [
      { label: 'Deflection Rate', val: '65%' },
      { label: 'Response Time', val: '0 Seconds' },
      { label: 'User Rating', val: '4.9/5' },
    ],
    features: [
      'Self-Healing FAQ & Solution Database',
      'One-Click User Feedback Verification',
      'Automatic Ticket Closure on Confirmation',
    ],
  },
  {
    id: 'smart-routing',
    badge: '03 · Intelligent Routing',
    title: 'Skill & Workload-Based Routing',
    subtitle: 'Zero ticket backlog, optimal agent assignment',
    description: 'Unresolved tickets are automatically matched to the exact employee in the right department based on current workload, skills, and availability.',
    icon: Zap,
    gradient: 'from-purple-500/20 to-indigo-500/5',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-500/60',
    stats: [
      { label: 'Workload Balance', val: '100% Balanced' },
      { label: 'First Contact SLA', val: '< 5 Mins' },
      { label: 'Re-routing Rate', val: '< 2%' },
    ],
    features: [
      'Live Employee Skill-Tag Matching',
      'Capacity & Availability Tracking',
      'Automatic Escalation Alerts',
    ],
  },
  {
    id: 'live-chat',
    badge: '04 · Live Helpdesk',
    title: 'Real-Time Interactive Support Chat',
    subtitle: 'Seamless user-to-agent communication',
    description: 'Built-in WebSocket chat thread enables real-time updates, satisfaction checks, screenshot preview attachments, and direct resolution feedback.',
    icon: MessageSquare,
    gradient: 'from-amber-500/20 to-orange-500/5',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/60',
    stats: [
      { label: 'Message Speed', val: 'Real-Time' },
      { label: 'Attachment Support', val: 'Images & PDF' },
      { label: 'Live Poll', val: '8s Sync' },
    ],
    features: [
      'WebSocket Powered Messaging',
      'Resolution Satisfaction Check',
      'Full Conversation Timeline Log',
    ],
  },
  {
    id: 'executive-analytics',
    badge: '05 · Insights',
    title: 'Executive Analytics & SLA Dashboard',
    subtitle: 'Complete visibility into team health & bottlenecks',
    description: 'Track department ticket volume, resolution trends, average handling time, and AI deflection performance with interactive visual charts.',
    icon: BarChart3,
    gradient: 'from-emerald-500/20 to-teal-500/5',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
    stats: [
      { label: 'Live Metrics', val: '100% Realtime' },
      { label: 'SLA Tracking', val: 'Automated' },
      { label: 'Exportable Data', val: 'JSON & CSV' },
    ],
    features: [
      'Department Workload Breakdown',
      'Top 5 Issue Category Trends',
      'Employee Performance Metrics',
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

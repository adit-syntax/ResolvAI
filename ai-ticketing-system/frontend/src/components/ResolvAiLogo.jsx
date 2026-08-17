import React from 'react';

export default function ResolvAiLogo({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="24" fill="#0f0f0f"/>
      <rect x="4" y="4" width="92" height="92" rx="22" stroke="#22c55e" strokeOpacity="0.4" strokeWidth="4"/>
      <path d="M30 70V30H48C56 30 62 35 62 42C62 49 56 53 48 53H30M48 53L64 70" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="74" cy="28" r="6.5" fill="#22c55e"/>
    </svg>
  );
}

import React from 'react';

export default function StatCard({ icon: Icon, title, value, description, className = '' }) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl ${className}`}>
      {Icon && <Icon className="w-6 h-6 text-[#22c55e]" />}
      <div>
        <div className="text-sm text-neutral-400">{title}</div>
        <div className="text-xl font-bold text-white">{value}</div>
        {description && <div className="text-xs text-neutral-500">{description}</div>}
      </div>
    </div>
  );
}

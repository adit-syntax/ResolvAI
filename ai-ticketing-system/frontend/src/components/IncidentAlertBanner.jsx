import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, Layers, ExternalLink, ChevronRight, X } from 'lucide-react';
import { knowledgeApi } from '../api';

export default function IncidentAlertBanner({ onSelectIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await knowledgeApi.getLiveIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.error("Failed to fetch live incident clusters", err);
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || incidents.length === 0) return null;

  const topIncident = incidents[0];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-950/80 via-red-900/40 to-neutral-900 border-b border-red-500/30 px-4 py-3 text-white shadow-lg animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left Side: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/30 text-red-300 border border-red-500/40">
                Outage Detected
              </span>
              <h4 className="text-sm font-semibold text-white">
                {topIncident.title}
              </h4>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Semantic AI Engine grouped <span className="font-semibold text-red-200">{topIncident.ticket_count} similar tickets</span> affecting {topIncident.affected_users_count} users.
            </p>
          </div>
        </div>

        {/* Right Side: Metrics & Dismiss */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <Users className="w-3.5 h-3.5 text-neutral-300" />
            <span>{topIncident.affected_users_count} users impacted</span>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-2"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * SettingsModal Component — Dynamic Integrations Manager
 * Allows Web UI users/admins to set & manage Groq API Key and Slack Webhook URL directly in browser.
 */

import React, { useState, useEffect } from 'react';
import {
  X, Settings, Sparkles, Bell, CheckCircle2, AlertCircle,
  Eye, EyeOff, ExternalLink, Send, Loader2, Key, ShieldCheck
} from 'lucide-react';
import { settingsApi } from '../api.js';

import { ticketApi } from '../api.js';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'slack' | 'demo'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Form states
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [slackUrl, setSlackUrl] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');

  // Configured states from server
  const [serverState, setServerState] = useState({
    groq_api_key: '',
    is_groq_configured: false,
    slack_webhook_url: '',
    is_slack_configured: false,
    groq_model: 'llama-3.3-70b-versatile',
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const data = await settingsApi.get();
      setServerState(data);
      setSlackUrl(data.slack_webhook_url || '');
      setGroqModel(data.groq_model || 'llama-3.3-70b-versatile');
      setGroqKey('');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Are you sure you want to reset all ticket data back to the default demo scenario tickets?')) return;
    setResettingDemo(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await ticketApi.resetSeedData();
      setStatusMsg({ type: 'success', text: `🎉 ${res.message}! Reloaded ${res.ticket_count} fresh test tickets.` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to reset demo data.' });
    } finally {
      setResettingDemo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const payload = {
        slack_webhook_url: slackUrl,
        groq_model: groqModel,
      };
      if (groqKey.trim()) {
        payload.groq_api_key = groqKey.trim();
      }

      await settingsApi.update(payload);
      setStatusMsg({ type: 'success', text: 'Settings updated successfully!' });
      await loadSettings();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSlack = async () => {
    if (!slackUrl || !slackUrl.startsWith('http')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid Slack Webhook URL starting with https://' });
      return;
    }
    setTestingSlack(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await settingsApi.testSlack(slackUrl);
      setStatusMsg({ type: 'success', text: '🎉 Slack test card sent! Check your Slack channel.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send test message to Slack.' });
    } finally {
      setTestingSlack(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-xl p-0 overflow-hidden shadow-2xl border-white/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-surface-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Settings & Integrations</h2>
              <p className="text-xs text-gray-400">Configure AI Engine, Webhooks, & Alert channels directly from UI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-surface-900/30 px-5 pt-3 gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> 🤖 AI Engine (Groq)
          </button>
          <button
            onClick={() => setActiveTab('slack')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'slack'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bell className="w-4 h-4" /> 🔔 Slack Alerts
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'demo'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> 🔄 Demo Data
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Toast / Status Notification */}
              {statusMsg.text && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/25 text-red-400'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* ── Tab 1: AI Engine (Groq) ────────────────────────── */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider block mb-1">
                        Current AI Provider
                      </span>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {serverState.is_groq_configured ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active: Groq LLaMA 3.3 (100% Free Tier)
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-400" /> Offline Mode: Intelligent Rule Engine
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold ${
                        serverState.is_groq_configured
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {serverState.is_groq_configured ? 'API Connected' : 'Offline Engine'}
                    </span>
                  </div>

                  {/* Groq API Key Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-300">
                        Groq Cloud API Key
                      </label>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                      >
                        Get Free Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showGroqKey ? 'text' : 'password'}
                        placeholder={
                          serverState.is_groq_configured
                            ? `Configured (${serverState.groq_api_key}) — Paste new key to update`
                            : 'gsk_...'
                        }
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        className="input-field pr-10 text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGroqKey(!showGroqKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Groq API provides ultra-fast, free LLaMA 3.3 70B inference (up to 14,400 requests/day).
                    </p>
                  </div>

                  {/* Model Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Target LLM Model
                    </label>
                    <select
                      value={groqModel}
                      onChange={(e) => setGroqModel(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Slack Alerts ────────────────────────────── */}
              {activeTab === 'slack' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block mb-1">
                        Slack Integration Status
                      </span>
                      <p className="text-sm font-bold text-white">
                        {serverState.is_slack_configured ? '✅ Webhook Configured' : '⚠️ No Webhook Connected'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold ${
                        serverState.is_slack_configured
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {serverState.is_slack_configured ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Webhook Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-300">
                        Slack Incoming Webhook URL
                      </label>
                      <a
                        href="https://api.slack.com/messaging/webhooks"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Slack Webhook Guide <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/services/T00/B00/XXXXX"
                      value={slackUrl}
                      onChange={(e) => setSlackUrl(e.target.value)}
                      className="input-field text-sm font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Alert cards will be dispatched to this Slack channel whenever urgent tickets are submitted or auto-escalated.
                    </p>
                  </div>

                  {/* Test Slack Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestSlack}
                      disabled={testingSlack || !slackUrl}
                      className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
                    >
                      {testingSlack ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {testingSlack ? 'Sending Test...' : '🧪 Test Slack Connection'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Demo Data Reset ────────────────────────── */}
              {activeTab === 'demo' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-400" /> Reset Demo Scenario Dataset
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Restores the initial set of 10 test tickets (covering password resets, server outages, database slowness, billing inquiries, and HR leave requests) and resets employee ticket workloads.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetDemoData}
                      disabled={resettingDemo}
                      className="px-5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/35 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {resettingDemo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {resettingDemo ? 'Resetting Demo Tickets...' : '🔄 Restore Fresh Demo Tickets'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm py-2 px-6 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

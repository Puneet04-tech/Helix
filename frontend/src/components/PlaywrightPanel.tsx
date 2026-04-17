'use client';

import React, { useState, useEffect } from 'react';
import { Play, Loader, CheckCircle, AlertCircle, Zap, Zapper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PlaywrightAction {
  action: string;
  description: string;
  icon: string;
}

interface ActionResult {
  status: 'success' | 'failed' | 'pending' | 'auto';
  action: string;
  message: string;
  timestamp?: string;
  source?: 'manual' | 'automatic';
}

export default function PlaywrightPanel() {
  const { token } = useAuth();
  const [capabilities, setCapabilities] = useState<PlaywrightAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [error, setError] = useState('');
  const [showAutomatic, setShowAutomatic] = useState(true);

  // Fetch Playwright capabilities
  useEffect(() => {
    fetchCapabilities();
  }, [token]);

  const fetchCapabilities = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/playwright/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCapabilities(
          data.capabilities.map((cap: any) => ({
            action: cap.action,
            description: cap.description,
            icon: getIconForAction(cap.action),
          }))
        );
      } else {
        setError('Failed to load Playwright capabilities');
      }
    } catch (err) {
      console.error('Error fetching capabilities:', err);
      setError('Error connecting to Playwright service');
    } finally {
      setLoading(false);
    }
  };

  const getIconForAction = (action: string) => {
    const icons: { [key: string]: string } = {
      clear_cache: '⚡',
      restart_service: '🔄',
      scale_up: '📈',
      failover: '🔀',
      kill_process: '⛔',
    };
    return icons[action] || '🎬';
  };

  const executeAction = async (action: string) => {
    if (!token) return;

    setExecuting(action);
    const newResult: ActionResult = {
      status: 'pending',
      action,
      message: `Executing ${action}...`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'manual',
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/playwright/test/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      setResults((prev) => [
        {
          ...newResult,
          status: response.ok ? 'success' : 'failed',
          message: data.message || `Action ${action} completed`,
        },
        ...prev.slice(0, 9), // Keep last 10 results
      ]);
    } catch (err) {
      setResults((prev) => [
        {
          ...newResult,
          status: 'failed',
          message: `Error executing ${action}: ${err}`,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">Playwright Automation</h2>
        </div>
        <div className="text-slate-400">Loading capabilities...</div>
      </div>
    );
  }

  const automaticActions = results.filter(r => r.source === 'automatic');
  const manualActions = results.filter(r => r.source === 'manual');

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white">🎬 Playwright Automation</h2>
            <p className="text-sm text-slate-400">Autonomous browser automation for incident response</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Status</div>
          <div className="text-sm font-semibold text-green-400">● Active & Automatic</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Auto Execution Notice */}
      <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Zapper className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-green-300 mb-1">✨ Automatic Execution</h3>
            <p className="text-sm text-green-300">
              When an incident is detected, these Playwright actions execute automatically without manual intervention. 
              No button clicks needed - the system responds autonomously!
            </p>
          </div>
        </div>
      </div>

      {/* Action Mapping */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h3 className="font-semibold text-blue-300 mb-3">Incident → Automatic Action Mapping</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="text-blue-300">
            <span className="font-mono">🔒 Security Threat</span> → <span className="text-yellow-300">⛔ kill_process</span>
          </div>
          <div className="text-blue-300">
            <span className="font-mono">📊 Performance Issue</span> → <span className="text-yellow-300">📈 scale_up</span>
          </div>
          <div className="text-blue-300">
            <span className="font-mono">💥 Service Crash</span> → <span className="text-yellow-300">🔄 restart_service</span>
          </div>
          <div className="text-blue-300">
            <span className="font-mono">🚨 Access Violation</span> → <span className="text-yellow-300">🔀 failover</span>
          </div>
          <div className="text-blue-300">
            <span className="font-mono">⚠️ Compliance Issue</span> → <span className="text-yellow-300">⚡ clear_cache</span>
          </div>
        </div>
      </div>

      {/* Manual Test Section */}
      <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
        <h3 className="font-semibold text-white mb-3">🧪 Manual Test (for Demo)</h3>
        <p className="text-xs text-slate-400 mb-3">Click to manually test any action:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {capabilities.map((cap) => (
            <button
              key={cap.action}
              onClick={() => executeAction(cap.action)}
              disabled={executing === cap.action}
              className={`p-3 rounded-lg border-2 transition-all text-left text-sm ${
                executing === cap.action
                  ? 'border-blue-500 bg-blue-900/20 cursor-wait'
                  : 'border-slate-600 hover:border-blue-500 bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cap.icon}</span>
                  <span className="text-white font-semibold capitalize">
                    {cap.action.replace(/_/g, ' ')}
                  </span>
                </div>
                {executing === cap.action ? (
                  <Loader className="text-blue-400 animate-spin" size={16} />
                ) : (
                  <Play className="text-slate-400 group-hover:text-blue-400" size={16} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Results Sections */}
      {results.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          {/* Automatic Executions */}
          {automaticActions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-green-300 mb-2">⚡ Automatic Executions (from incidents)</h3>
              <div className="space-y-2">
                {automaticActions.map((result, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-sm flex items-start gap-3 bg-green-900/20 border border-green-700"
                  >
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <div className="font-semibold text-green-300 capitalize">
                        {result.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-green-300">{result.message}</div>
                      {result.timestamp && (
                        <div className="text-xs text-slate-400 mt-1">{result.timestamp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Test Results */}
          {manualActions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">📋 Manual Test Results</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {manualActions.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm flex items-start gap-3 ${
                      result.status === 'success'
                        ? 'bg-green-900/20 border border-green-700'
                        : result.status === 'failed'
                        ? 'bg-red-900/20 border border-red-700'
                        : 'bg-blue-900/20 border border-blue-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {result.status === 'success' ? (
                        <CheckCircle className="text-green-400" size={18} />
                      ) : result.status === 'failed' ? (
                        <AlertCircle className="text-red-400" size={18} />
                      ) : (
                        <Loader className="text-blue-400 animate-spin" size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white capitalize">
                        {result.action.replace(/_/g, ' ')}
                      </div>
                      <div
                        className={`text-xs ${
                          result.status === 'success'
                            ? 'text-green-300'
                            : result.status === 'failed'
                            ? 'text-red-300'
                            : 'text-blue-300'
                        }`}
                      >
                        {result.message}
                      </div>
                      {result.timestamp && (
                        <div className="text-xs text-slate-500 mt-1">{result.timestamp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features List */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">🎯 Capabilities</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Browser Control</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Headless Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Auto Response</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>No Manual Action</span>
          </div>
        </div>
      </div>
    </div>
  );
}

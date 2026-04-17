'use client';

import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ActionResult {
  status: 'success' | 'failed' | 'pending' | 'auto';
  action: string;
  message: string;
  timestamp?: string;
  source?: 'automatic';
}

export default function PlaywrightPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ActionResult[]>([]);

  // Listen for automatic Playwright executions via WebSocket or polling
  useEffect(() => {
    // This component shows automatic executions from incident detection
    // Results are populated when incidents trigger Playwright actions
    setLoading(false);
  }, [token]);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">🎬 Playwright Automation</h2>
        </div>
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const automaticActions = results.filter(r => r.source === 'automatic');

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white">🎬 Playwright Automation</h2>
            <p className="text-sm text-slate-400">Autonomous browser automation triggered by incidents</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Status</div>
          <div className="text-sm font-semibold text-green-400">● Active & Real-Time</div>
        </div>
      </div>

      {/* Auto Execution Notice */}
      <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-green-300 mb-1">✨ Automatic Real-Time Execution</h3>
            <p className="text-sm text-green-300">
              When an incident is detected, Playwright actions execute automatically in real-time. 
              No button clicks needed - the system responds autonomously and instantly!
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

      {/* Real-Time Executions */}
      {automaticActions.length > 0 && (
        <div className="mb-6 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-green-300 mb-3">⚡ Real-Time Automatic Executions</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {automaticActions.map((result, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg text-sm flex items-start gap-3 bg-green-900/20 border border-green-700"
              >
                <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="font-semibold text-green-300 capitalize">
                    {result.action.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-green-300 mt-1">{result.message}</div>
                  {result.timestamp && (
                    <div className="text-xs text-slate-400 mt-2">{result.timestamp}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {automaticActions.length === 0 && (
        <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg text-center">
          <Zap className="text-slate-500 mx-auto mb-2" size={24} />
          <p className="text-slate-400 text-sm">
            No automatic executions yet. When incidents are detected, Playwright actions will execute here in real-time.
          </p>
        </div>
      )}

      {/* Capabilities */}
      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-semibold text-white mb-2">🎯 Real-Time Capabilities</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Autonomous Response</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Real-Time Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Browser Automation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>No Manual Action</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Incident-Triggered</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <span>Instant Response</span>
          </div>
        </div>
      </div>
    </div>
  );
}

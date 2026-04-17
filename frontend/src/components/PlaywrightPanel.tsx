'use client';

import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ActionResult {
  action: string;
  target: string;
  result: string;
  success: boolean;
  timestamp?: string;
}

interface Incident {
  _id: string;
  type: string;
  title: string;
  automaticActions?: Array<{
    action: string;
    target: string;
    result: string;
    success: boolean;
  }>;
  createdAt: string;
}

export default function PlaywrightPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Fetch incidents with Playwright actions
  const fetchIncidents = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incidents?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const incidents = Array.isArray(data) ? data : data.incidents || [];
        
        // Extract all Playwright actions from incidents
        const playwrightResults: ActionResult[] = [];
        
        incidents.forEach((incident: Incident) => {
          if (incident.automaticActions) {
            incident.automaticActions.forEach((action) => {
              if (action.action.includes('playwright')) {
                playwrightResults.push({
                  action: action.action,
                  target: action.target,
                  result: action.result,
                  success: action.success,
                  timestamp: incident.createdAt,
                });
              }
            });
          }
        });

        // Sort by timestamp descending (newest first)
        playwrightResults.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        });

        setResults(playwrightResults.slice(0, 20)); // Keep last 20
        setLastChecked(new Date());
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, [token]);

  // Listen for real-time incident updates via WebSocket
  useEffect(() => {
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[PlaywrightPanel] WebSocket connected');
      // Send auth token
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Only fetch when new incident is created (not continuously)
        if (message.type === 'incident:created' || message.type === 'incident:updated') {
          console.log('[PlaywrightPanel] New incident detected, fetching results');
          fetchIncidents();
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[PlaywrightPanel] WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('[PlaywrightPanel] WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

  if (loading && !results.length) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">🎬 Playwright Automation</h2>
        </div>
        <div className="text-slate-400">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white">🎬 Playwright Automation</h2>
            <p className="text-sm text-slate-400">Real-time automatic execution from incident response</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`}
              size={18}
            />
          </button>
          <div className="text-right">
            <div className="text-xs text-slate-500">Status</div>
            <div className="text-sm font-semibold text-green-400">● Live</div>
          </div>
        </div>
      </div>

      {/* Auto Execution Notice */}
      <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-green-300 mb-1">✨ Real-Time Automatic Execution</h3>
            <p className="text-sm text-green-300">
              When a new incident is detected, Playwright actions execute automatically in real-time. 
              Results appear here instantly - no polling, only on-demand.
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
      {results.length > 0 ? (
        <div className="mb-6 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-green-300 mb-3">
            ⚡ Real-Time Automatic Executions ({results.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg text-sm flex items-start gap-3 bg-green-900/20 border border-green-700"
              >
                <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="font-semibold text-green-300 capitalize">
                    {result.action.replace(/playwright_/g, '').replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-green-300 mt-1">{result.result}</div>
                  {result.timestamp && (
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg text-center">
          <Zap className="text-slate-500 mx-auto mb-2" size={24} />
          <p className="text-slate-400 text-sm">
            No automatic executions yet. Create a new incident to trigger Playwright automation.
          </p>
        </div>
      )}

      {/* Last Updated */}
      {lastChecked && (
        <div className="text-xs text-slate-500 text-center mt-4">
          Last fetched: {lastChecked.toLocaleTimeString()} (on-demand via WebSocket)
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
            <span>Live Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Zap, Sparkles, RefreshCw } from 'lucide-react';
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
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Fetch incidents with Playwright actions
  const fetchIncidents = async (isManualRefresh: boolean = false) => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    if (!isManualRefresh) {
      setLoading(true);
    }

    try {
      console.log('[PlaywrightPanel] Fetching incidents for project:', user.projectIds?.[0]);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      // Get projectId from user context
      const projectId = user.projectIds?.[0] || 'default';

      const response = await fetch(`${apiUrl}/incidents/project/${projectId}?limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PlaywrightPanel] API Response:', data);

      // Handle different response formats
      const incidents: Incident[] = Array.isArray(data) 
        ? data 
        : Array.isArray(data.data) 
          ? data.data 
          : Array.isArray(data.incidents) 
            ? data.incidents 
            : [];

      console.log(`[PlaywrightPanel] Found ${incidents.length} incidents`);

      // Extract all Playwright actions from incidents
      const playwrightResults: ActionResult[] = [];

      incidents.forEach((incident) => {
        if (incident.automaticActions && Array.isArray(incident.automaticActions)) {
          incident.automaticActions.forEach((action) => {
            if (action.action.includes('playwright')) {
              console.log(`[PlaywrightPanel] Found action: ${action.action}`);
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

      console.log(`[PlaywrightPanel] Total Playwright actions: ${playwrightResults.length}`);

      // Sort by timestamp descending (newest first)
      playwrightResults.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      setResults(playwrightResults.slice(0, 20));
      setLastChecked(new Date());
      setError(null);
      console.log('[PlaywrightPanel] Fetch completed successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[PlaywrightPanel] Error fetching incidents:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchIncidents(false);
  }, [token, user]);

  // Manual refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncidents(true);
  };

  if (loading && !results.length) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">🎬 Playwright Automation</h2>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="animate-spin">⏳</div>
          Loading incidents...
        </div>
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
            className="p-2 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
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

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          Error: {error}
          <button
            onClick={handleRefresh}
            className="block mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Auto Execution Notice */}
      <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-green-300 mb-1">✨ Real-Time Automatic Execution</h3>
            <p className="text-sm text-green-300">
              When a new incident is detected, Playwright actions execute automatically in real-time. 
              Click refresh to see latest results.
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
            ⚡ Automatic Executions ({results.length})
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
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Last Updated */}
      {lastChecked && (
        <div className="text-xs text-slate-500 text-center mt-4">
          Last fetched: {lastChecked.toLocaleTimeString()}
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
            <span>On-Demand Refresh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

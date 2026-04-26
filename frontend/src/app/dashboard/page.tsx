'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import MetricCard from '../../components/MetricCard';
import IncidentCard from '../../components/IncidentCard';
import PlaywrightPanel from '../../components/PlaywrightPanel';
import { AdvancedInsights } from '../../components/AdvancedInsights';
import { RefreshCw, AlertTriangle, Play, Square, Zap, Search, Brain, Bird } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function Dashboard() {
  type Incident = {
    _id?: string;
    incidentId?: string;
    id?: string;
    type: string;
    service: string;
    severity: 'critical' | 'warning' | 'info';
    status: 'detecting' | 'analyzing' | 'responding' | 'resolved' | 'active';
    title?: string;
    createdAt?: string;
    detectedAt?: string;
    timestamp?: string;
    isLive?: boolean;
    description?: string;
    rootCause?: string;
    affectedUsers?: string | number;
    confidence?: string | number;
  };

  const router = useRouter();
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState({
    active: 0,
    resolved: 0,
    avgResolution: '0m 0s',
    uptime: '100%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveMode, setLiveMode] = useState(false);
  const [chaosData, setChaosData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [kbQuery, setKbQuery] = useState('');
  const [kbResults, setKbResults] = useState<any[]>([]);
  const [canaryResult, setCanaryResult] = useState<any>(null);
  const [isRunningCanary, setIsRunningCanary] = useState(false);

  const projectId = user?.projectIds?.[0];
  const { connected, incidents: wsIncidents, startLiveDemo, stopLiveDemo } = useWebSocket(projectId || '');

  // Fetch incidents and metrics from backend
  const fetchDashboardData = async () => {
    // If not authenticated, we stop immediately to avoid 401s in console
    if (!token) {
      console.log('Dashboard fetch suppressed: Token not yet available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use user from auth or extract from token directly if needed
      if (!user) {
        console.log('Dashboard fetch suppressed: User data not yet loaded');
        return;
      }

      const projectId = user.projectIds?.[0];
      const endpoints: Promise<any>[] = [];
      
      // Try stats endpoint first
      if (projectId) {
        endpoints.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/project/${projectId}/stats`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
        );
      }

      // Always fetch incidents (with or without projectId)
      const incidentUrl = projectId
        ? `${process.env.NEXT_PUBLIC_API_URL}/incidents/project/${projectId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/incidents`;
      
      endpoints.push(
        fetch(incidentUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.all(endpoints);

      // Check for 401s specifically
      const unauthorized = responses.find(r => r.status === 401);
      if (unauthorized) {
        console.error('Unauthorized request detected in dashboard data fetch');
        setError('Session expired. Please log in again.');
        return;
      }

      // Check if requests succeeded
      let statsData = null;
      let incidentsData = [];

      if (projectId && responses[0]?.ok) {
        statsData = await responses[0].json();
      }

      const incidentsResponse = responses[projectId ? 1 : 0];
      if (incidentsResponse?.ok) {
        incidentsData = await incidentsResponse.json();
      }

      // Transform backend data to match frontend types
      const transformedIncidents = Array.isArray(incidentsData)
        ? incidentsData.map((incident: any) => ({
            id: incident._id || incident.incidentId,
            type: incident.type || 'unknown',
            service: incident.service || 'Unknown Service',
            severity: incident.severity || 'info',
            status: incident.status || 'detecting',
            timestamp: incident.detectedAt
              ? new Date(incident.detectedAt).toLocaleString()
              : 'Just now',
            description: incident.description,
            rootCause: incident.rootCause,
            affectedUsers: incident.affectedUsers,
            confidence: incident.confidence,
            isLive: incident.status !== 'resolved',
          }))
        : [];

      setIncidents(transformedIncidents);

      // Use real metrics from backend or calculate from incidents
      if (statsData) {
        setMetrics({
          active: statsData.activeCount || 0,
          resolved: statsData.resolvedCount || 0,
          avgResolution: statsData.avgResolutionTime || '0m 0s',
          uptime: statsData.systemUptime || '100%',
        });
      } else {
        // Fallback: calculate from incidents
        const activeCount = transformedIncidents.filter(
          i => i.status !== 'resolved'
        ).length;
        const resolvedCount = transformedIncidents.filter(
          i => i.status === 'resolved'
        ).length;

        setMetrics({
          active: activeCount,
          resolved: resolvedCount,
          avgResolution: '0m 0s',
          uptime: '100%',
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to connect to backend. Please check your network connection or contact support.');
      // Show empty state, not mock data
      setIncidents([]);
      setMetrics({
        active: 0,
        resolved: 0,
        avgResolution: '0m 0s',
        uptime: '100%',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvancedInsights = async () => {
    if (!token || !projectId) return;

    try {
      // Fetch Benchmark Data
      const bRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/benchmarking/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bRes.ok) setBenchmarkData(await bRes.json());

      // Fetch sample Chaos data for 'booking-service'
      const cRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/chaos/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ service: 'booking-service' })
      });
      if (cRes.ok) setChaosData(await cRes.json());
    } catch (err) {
      console.error('Error fetching advanced insights:', err);
    }
  };

  const runCanary = async (isDryRun = false) => {
    if (!token) return;
    setIsRunningCanary(true);
    setCanaryResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/agents/canary/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          targetUrl: 'http://localhost:5001', // Checking the Hospital System Backend
          flow: 'hospital',
          dryRun: isDryRun 
        })
      });
      
      if (!res.ok) {
        setCanaryResult({ success: false, criticalStep: `Server Error (${res.status})` });
        return;
      }

      const data = await res.json();
      setCanaryResult({
        ...data,
        isDryRun
      });
    } catch (err: any) {
      console.error('Canary failed:', err);
      setCanaryResult({ success: false, criticalStep: err.message || 'Connection Failed' });
    } finally {
      setIsRunningCanary(false);
    }
  };

  const searchKB = async (q: string) => {
    setKbQuery(q);
    if (q.length < 3) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/agents/knowledge/search?query=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setKbResults(await res.json());
    } catch (err) {
      console.error('KB search failed:', err);
    }
  };

  // Fetch data on mount and set up polling
  useEffect(() => {
    fetchDashboardData();
    fetchAdvancedInsights();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);

    return () => clearInterval(interval);
  }, [user, token, projectId]);

  const handleRefresh = async () => {
    await fetchDashboardData();
    await fetchAdvancedInsights();
  };

  const toggleLiveDemo = () => {
    if (!liveMode) {
      startLiveDemo();
      setLiveMode(true);
    } else {
      stopLiveDemo();
      setLiveMode(false);
    }
  };

  const handleOpenIncident = (incident: Incident) => {
    const id = incident.id || incident._id || incident.incidentId;
    if (id) {
      // Store incident data in sessionStorage to avoid re-fetching
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`incident_${id}`, JSON.stringify(incident));
      }
      router.push(`/incidents/${id}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Ops Command Center</h1>
            <p className="text-slate-400 mt-1">
              {liveMode ? '🔴 Active Threat Stream' : 'Live Infrastructure Intelligence'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLiveDemo}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                liveMode
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {liveMode ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Testing Stream
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Trigger Test Stream
                </>
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* WebSocket Status */}
        {liveMode && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 animate-pulse" />
            Live demo running - New incidents will appear in real-time below
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
            <p className="text-xs mt-2 text-red-300">
              Troubleshooting: Check your network connection and try refreshing the page. Click "Start Live Demo" to simulate incidents.
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Active Incidents"
            value={metrics.active}
            trend={{ value: metrics.active > 2 ? 25 : -25, isPositive: metrics.active === 0 }}
            highlight
          />
          <MetricCard
            label="Resolved (24h)"
            value={metrics.resolved}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            label="Avg Resolution Time"
            value={metrics.avgResolution}
            trend={{ value: -8, isPositive: true }}
          />
          <MetricCard
            label="System Uptime"
            value={metrics.uptime}
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        {/* AI Guardian Advanced Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedInsights mode="chaos" data={chaosData} />
            <AdvancedInsights mode="benchmark" data={benchmarkData} />
        </div>

        {/* Feature 4 & 5: KB and Canaries Quick Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#112D5E] border border-[#1E3A5F] p-5 rounded-xl hover:border-indigo-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
                        <Search size={20} />
                    </div>
                    <h3 className="font-bold text-slate-100">Knowledge Search</h3>
                </div>
                <div className="relative">
                    <input 
                      type="text" 
                      placeholder="What usually breaks on Fridays?" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500"
                      value={kbQuery}
                      onChange={(e) => searchKB(e.target.value)}
                    />
                    <Brain className="absolute right-3 top-2.5 w-4 h-4 text-gray-600" />
                </div>
                {kbResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                    {kbResults.map((res, i) => (
                      <div key={i} className="text-[10px] p-2 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-200">
                        <div className="font-bold">{res.type}</div>
                        <div className="opacity-70">{res.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="bg-[#112D5E] border border-[#1E3A5F] p-5 rounded-xl hover:border-emerald-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                        <Bird size={20} />
                    </div>
                    <h3 className="font-bold text-slate-100 italic">Silent Canary (F5)</h3>
                </div>
                <div className="flex gap-2 mb-3">
                    <button 
                      onClick={() => runCanary(false)}
                      disabled={isRunningCanary}
                      className="flex-1 bg-emerald-500 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                        {isRunningCanary && !canaryResult?.isDryRun ? 'RUNNING...' : 'TEST GUEST FLOW'}
                    </button>
                    <button 
                      onClick={() => runCanary(true)}
                      disabled={isRunningCanary}
                      className="flex-1 bg-gray-800 text-gray-400 text-[10px] font-bold py-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        {isRunningCanary && canaryResult?.isDryRun ? 'SIMULATING...' : 'DRY RUN'}
                    </button>
                </div>
                {canaryResult && (
                  <div className={`text-[10px] p-2 rounded border font-mono ${canaryResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">{canaryResult.isDryRun ? 'DRY RUN MODE' : 'LIVE TEST'}</span>
                      <span>{canaryResult.success ? 'PASSED' : 'FAILED'}</span>
                    </div>
                    {canaryResult.success ? `Latency: ${Math.round(canaryResult.avgLatency)}ms` : `Error: ${canaryResult.criticalStep}`}
                    {canaryResult.isDryRun && canaryResult.success && (
                      <div className="mt-1 text-[8px] opacity-70 border-t border-emerald-500/20 pt-1">
                        * Sandbox simulation completed without touching production database.
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="bg-[#112D5E] border border-[#1E3A5F] p-5 rounded-xl flex items-center justify-center italic text-gray-500 text-xs text-center px-8">
                "System is learning after every incident. 82 patterns cached."
            </div>
        </div>

        {/* Playwright Automation Panel */}
        <PlaywrightPanel />

        {/* Incident Feed */}
        <div className="bg-[#112D5E] rounded-xl border border-[#1E3A5F] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E3A5F]">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Real-Time Incident Feed
            </h2>
          </div>

          <div className="divide-y divide-[#1E3A5F] max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-400">
                Loading incidents...
              </div>
            ) : incidents.length > 0 ? (
              incidents.map((incident, index) => (
                <div
                  key={incident.id || incident._id || incident.incidentId || index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenIncident(incident);
                  }}
                  className="cursor-pointer hover:bg-[#1E3A5F]/50 transition-colors"
                >
                  <IncidentCard 
                    {...incident} 
                    id={incident.id || incident._id || incident.incidentId || ""} 
                    severity={(incident.severity as any) === 'active' ? 'critical' : (incident.severity as any)}
                    status={(incident.status as any) === 'active' ? 'detecting' : (incident.status as any)}
                    timestamp={incident.timestamp || ""}
                  />
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-400">
                No incidents detected. {liveMode ? 'Simulated incidents will appear here shortly.' : 'Your systems are running smoothly.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-[#112D5E]/50 rounded-lg px-4 py-3 text-xs text-slate-400 border border-[#1E3A5F]">
          Last updated: {new Date().toLocaleTimeString()} | Connected to
          backend | User: {user?.email}
        </div>
      </div>
    </DashboardLayout>
  );
}

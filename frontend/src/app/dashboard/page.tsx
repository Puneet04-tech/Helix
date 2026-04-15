'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MetricCard from '../../components/MetricCard';
import IncidentCard from '../../components/IncidentCard';
import IncidentDetailModal from '../../components/IncidentDetailModal';
import { RefreshCw, AlertTriangle, Play, Square, Zap } from 'lucide-react';
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
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  const projectId = user?.projectIds?.[0];
  const { connected, incidents: wsIncidents, startLiveDemo, stopLiveDemo } = useWebSocket(projectId || '');

  // Fetch incidents and metrics from backend
  const fetchDashboardData = async () => {
    if (!user || !token) return;

    setLoading(true);
    setError('');

    try {
      // Try to get projectId, fallback to fetching all
      const projectId = user.projectIds?.[0];

      const endpoints = [];
      
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
      setError('Failed to connect to backend. Make sure the server is running on port 5000.');
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

  // Fetch data on mount and set up polling
  useEffect(() => {
    fetchDashboardData();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [user, token]);

  const handleRefresh = async () => {
    await fetchDashboardData();
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
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              {liveMode ? '🔴 Live Incident Streaming' : 'Real-time monitoring and crisis detection'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLiveDemo}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                liveMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {liveMode ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Live Demo
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Live Demo
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
              Troubleshooting: Check that the backend is running on port 5000. Click "Start Live Demo" to simulate incidents.
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

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </DashboardLayout>
  );
}

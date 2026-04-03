'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import MetricCard from '@/components/MetricCard';
import IncidentCard from '@/components/IncidentCard';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  type Incident = {
    id: string;
    type: string;
    service: string;
    severity: 'critical' | 'warning' | 'info';
    status: 'detecting' | 'analyzing' | 'responding' | 'resolved';
    timestamp: string;
    isLive: boolean;
  };

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState({
    active: 2,
    resolved: 48,
    avgResolution: '14m 32s',
    uptime: '99.97%',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In production, fetch from API
    const mockIncidents: Incident[] = [
      {
        id: '1',
        type: 'performance_degradation',
        service: 'Auth Service',
        severity: 'warning',
        status: 'responding',
        timestamp: '2 min ago',
        isLive: true,
      },
      {
        id: '2',
        type: 'unauthorized_access',
        service: 'Payment Service',
        severity: 'critical',
        status: 'analyzing',
        timestamp: '5 min ago',
        isLive: true,
      },
      {
        id: '3',
        type: 'service_crash',
        service: 'User Service',
        severity: 'warning',
        status: 'resolved',
        timestamp: '1 hour ago',
        isLive: false,
      },
    ];
    setIncidents(mockIncidents);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Real-time monitoring and crisis detection
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Active Incidents"
            value={metrics.active}
            trend={{ value: -25, isPositive: true }}
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

          <div className="divide-y divide-[#1E3A5F]">
            {incidents.length > 0 ? (
              incidents.map(incident => (
                <IncidentCard key={incident.id} {...incident} />
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-400">
                No incidents detected. Your systems are running smoothly.
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-[#112D5E]/50 rounded-lg px-4 py-3 text-xs text-slate-400 border border-[#1E3A5F]">
          Last updated: {new Date().toLocaleTimeString()} | Connected to
          backend
        </div>
      </div>
    </DashboardLayout>
  );
}

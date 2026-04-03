'use client';

import DashboardLayout from '@/components/DashboardLayout';
import IncidentCard from '@/components/IncidentCard';
import { AlertTriangle } from 'lucide-react';

export default function IncidentsPage() {
  type IncidentType = {
    id: string;
    type: string;
    service: string;
    severity: 'critical' | 'warning' | 'info';
    status: 'detecting' | 'analyzing' | 'responding' | 'resolved';
    timestamp: string;
    isLive: boolean;
  };

  const incidents: IncidentType[] = [
    {
      id: '1',
      type: 'performance_degradation',
      service: 'Auth Service',
      severity: 'warning',
      status: 'resolved',
      timestamp: '2 hours ago',
      isLive: false,
    },
    {
      id: '2',
      type: 'unauthorized_access',
      service: 'Payment Service',
      severity: 'critical',
      status: 'resolved',
      timestamp: '4 hours ago',
      isLive: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Incidents</h1>
          <p className="text-slate-400 mt-1">Browse all detected incidents</p>
        </div>

        <div className="bg-[#112D5E] rounded-xl border border-[#1E3A5F] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E3A5F]">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              All Incidents
            </h2>
          </div>

          <div className="divide-y divide-[#1E3A5F]">
            {incidents.map(incident => (
              <IncidentCard key={incident.id} {...incident} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

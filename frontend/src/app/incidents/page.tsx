'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import IncidentCard from '@/components/IncidentCard';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIncidents = async () => {
      if (!user || !token) return;

      setLoading(true);
      setError('');

      try {
        const projectId = user.projectIds?.[0];
        const url = projectId
          ? `${process.env.NEXT_PUBLIC_API_URL}/incidents/project/${projectId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/incidents`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        const data = await response.json();
        const transformed = Array.isArray(data)
          ? data.map((incident: any) => ({
              id: incident._id || incident.incidentId,
              type: incident.type || 'unknown',
              service: incident.service || 'Unknown Service',
              severity: incident.severity || 'info',
              status: incident.status || 'detecting',
              timestamp: incident.detectedAt
                ? new Date(incident.detectedAt).toLocaleString()
                : 'Just now',
              isLive: incident.status !== 'resolved',
            }))
          : [];

        setIncidents(transformed);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load incidents');
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [user, token]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Incidents</h1>
          <p className="text-slate-400 mt-1">Browse all detected incidents</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
            <p className="text-xs mt-2 text-red-300">
              Make sure the backend is running on port 5000 and you have incidents data in the database.
            </p>
          </div>
        )}

        <div className="bg-[#112D5E] rounded-xl border border-[#1E3A5F] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E3A5F]">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              All Incidents
            </h2>
          </div>

          <div className="divide-y divide-[#1E3A5F]">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-400">
                Loading incidents...
              </div>
            ) : incidents.length > 0 ? (
              incidents.map(incident => (
                <IncidentCard key={incident.id} {...incident} />
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-400">
                No incidents found.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

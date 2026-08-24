'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import IncidentCard from '../../components/IncidentCard';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchIncidents = async () => {
      if (!user || !token) return;

      setLoading(true);
      setError('');

      try {
        const projectId = user.projectIds?.[0];
        const offset = (page - 1) * limit;
        const url = projectId
          ? `${process.env.NEXT_PUBLIC_API_URL}/incidents/project/${projectId}?limit=${limit}&offset=${offset}`
          : `${process.env.NEXT_PUBLIC_API_URL}/incidents?limit=${limit}&offset=${offset}`;

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
        // Fetch total count for pagination
        const countUrl = projectId
          ? `${process.env.NEXT_PUBLIC_API_URL}/incidents/project/${projectId}/count`
          : `${process.env.NEXT_PUBLIC_API_URL}/incidents/count`;
        const countRes = await fetch(countUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (countRes.ok) {
          const countData = await countRes.json();
          setTotal(countData.count || 0);
        }
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
              incidents.map((incident, index) => (
                <IncidentCard 
                  key={incident.id || index} 
                  {...incident} 
                  id={incident.id || ""}
                />
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-400">
                No incidents found.
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-slate-400">
              Showing {incidents.length} of {total} incidents
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-[#1A3A6E] hover:bg-[#1E3A5F] disabled:opacity-40 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                disabled={page >= Math.ceil(total / limit)}
                className="bg-[#1A3A6E] hover:bg-[#1E3A5F] disabled:opacity-40 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

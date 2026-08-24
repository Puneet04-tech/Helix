'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Filter } from 'lucide-react';

export default function AnalyticsPage() {
  type Event = {
    _id: string;
    type: string;
    service?: string;
    severity?: string;
    message?: string;
    flow?: string;
    detectedAt?: string;
    createdAt?: string;
  };

  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchEvents = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError('');
    try {
      const projectId = user.projectIds?.[0];
      // Event feed drives the analytics view. Prefer the project-scoped list.
      let url = projectId
        ? `${process.env.NEXT_PUBLIC_API_URL}/events/project/${projectId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/events`;

      if (typeFilter && projectId) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/events/project/${projectId}/type/${encodeURIComponent(
          typeFilter,
        )}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch event analytics');
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError('Failed to load analytics data.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, typeFilter]);

  // Metrics derived from the live event stream.
  const total = events.length;
  const severityCounts = events.reduce<Record<string, number>>((acc, e) => {
    const k = e.severity || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const typeCounts = events.reduce<Record<string, number>>((acc, e) => {
    const k = e.type || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const serviceCounts = events.reduce<Record<string, number>>((acc, e) => {
    const k = e.service || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const maxType = Math.max(1, ...Object.values(typeCounts));
  const maxService = Math.max(1, ...Object.values(serviceCounts));

  const statCard =
    'bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-5';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
            <p className="text-slate-400 mt-1">
              Event stream and incident analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#5BA4F5]" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#2979CC]"
            >
              <option value="">All types</option>
              {Object.keys(typeCounts).map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={statCard}>
            <p className="text-sm text-slate-400">Total Events</p>
            <p className="text-3xl font-bold text-slate-100 mt-1">{total}</p>
          </div>
          <div className={statCard}>
            <p className="text-sm text-slate-400">Critical</p>
            <p className="text-3xl font-bold text-red-400 mt-1">
              {severityCounts['critical'] || 0}
            </p>
          </div>
          <div className={statCard}>
            <p className="text-sm text-slate-400">Warning</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">
              {severityCounts['warning'] || 0}
            </p>
          </div>
          <div className={statCard}>
            <p className="text-sm text-slate-400">Info</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">
              {severityCounts['info'] || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By service */}
          <div className={statCard}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Events by Service
            </h2>
            {Object.entries(serviceCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(serviceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([svc, count]) => (
                    <div key={svc}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{svc}</span>
                        <span className="text-slate-400">{count}</span>
                      </div>
                      <div className="h-2 bg-[#0A1428] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5BA4F5] rounded-full"
                          style={{ width: `${(count / maxService) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No service data yet.</p>
            )}
          </div>

          {/* Types with severity counts */}
          <div className={statCard}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Event Types
            </h2>
            {Object.entries(typeCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(typeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([type, count]) => (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{type}</span>
                        <span className="text-slate-400">{count}</span>
                      </div>
                      <div className="h-2 bg-[#0A1428] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2979CC] rounded-full"
                          style={{ width: `${(count / maxType) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No event types yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
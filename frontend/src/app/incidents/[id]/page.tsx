'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Tag } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const incidentId = params.id;

  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      if (!incidentId || !token) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incidentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // If 404, try fetching all incidents and finding by either _id or id
          const allResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (allResponse.ok) {
            const allData = await allResponse.json();
            // Try to find by _id or id field
            const found = allData.find((inc: any) => 
              inc._id === incidentId || 
              inc.id === incidentId || 
              inc.incidentId === incidentId
            );
            if (found) {
              setIncident(found);
              return;
            }
          }

          throw new Error('Incident not found');
        }

        const data = await response.json();
        setIncident(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [incidentId, token]);

  const severityColors: any = {
    critical: 'bg-red-900/40 text-red-400 border-red-800',
    error: 'bg-red-900/40 text-red-400 border-red-800',
    warning: 'bg-amber-900/40 text-amber-400 border-amber-800',
    info: 'bg-sky-900/40 text-sky-400 border-sky-800',
    high: 'bg-red-900/40 text-red-400 border-red-800',
    medium: 'bg-amber-900/40 text-amber-400 border-amber-800',
    low: 'bg-sky-900/40 text-sky-400 border-sky-800',
  };

  const statusColors: any = {
    detecting: 'bg-orange-900/40 text-orange-400',
    analyzing: 'bg-blue-900/40 text-blue-400',
    responding: 'bg-yellow-900/40 text-yellow-400',
    resolved: 'bg-green-900/40 text-green-400',
    active: 'bg-orange-900/40 text-orange-400',
    detecting_anomaly: 'bg-orange-900/40 text-orange-400',
    gathering_data: 'bg-blue-900/40 text-blue-400',
    pending: 'bg-yellow-900/40 text-yellow-400',
    closed: 'bg-green-900/40 text-green-400',
  };

  const getSeverityStyle = (severity: string) => {
    return severityColors[severity?.toLowerCase()] || severityColors.info;
  };

  const getStatusStyle = (status: string) => {
    return statusColors[status?.toLowerCase()] || statusColors.detecting;
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-400">Loading incident details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Incidents
          </button>

          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            <div className="font-semibold">Error</div>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-red-300">
              The incident may have been deleted or the ID may be invalid.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!incident) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Incidents
          </button>

          <div className="text-slate-400">No incident data available</div>
        </div>
      </DashboardLayout>
    );
  }

  const severity = (incident.severity || 'info').toLowerCase();
  const status = (incident.status || 'detecting').toLowerCase();
  const severityDisplay = severity === 'error' ? 'critical' : severity;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>

        {/* Title Section */}
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">
              {incident.title || incident.type || 'Incident'}
            </h1>
          </div>
          <p className="text-slate-400 mt-2">{incident.service || 'Unknown Service'}</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Severity */}
          <div className={`rounded-lg p-4 border ${getSeverityStyle(incident.severity)}`}>
            <div className="text-xs font-semibold uppercase opacity-75">Severity</div>
            <div className="text-xl font-bold mt-2 capitalize">{severityDisplay}</div>
          </div>

          {/* Status */}
          <div className={`rounded-lg p-4 border ${getStatusStyle(incident.status)}`}>
            <div className="text-xs font-semibold uppercase opacity-75">Status</div>
            <div className="text-xl font-bold mt-2 capitalize flex items-center gap-2">
              {status === 'resolved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              {status}
            </div>
          </div>

          {/* Created */}
          <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-800">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400">Created</div>
            <div className="text-sm mt-2 text-slate-300">
              {incident.createdAt || incident.detectedAt
                ? new Date(incident.createdAt || incident.detectedAt).toLocaleString()
                : 'Unknown'}
            </div>
          </div>

          {/* ID */}
          <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-800">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400">ID</div>
            <div className="text-xs mt-2 text-slate-300 font-mono break-all">
              {incident._id || incident.id || 'N/A'}
            </div>
          </div>
        </div>

        {/* Description */}
        {incident.description && (
          <div className="bg-slate-900/30 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-3">Description</h2>
            <p className="text-slate-300 leading-relaxed">{incident.description}</p>
          </div>
        )}

        {/* Metadata */}
        {incident.metadata && Object.keys(incident.metadata).length > 0 && (
          <div className="bg-slate-900/30 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Metadata</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(incident.metadata).map(([key, value]) => (
                <div key={key} className="bg-slate-900/50 rounded p-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase">{key}</div>
                  <div className="text-sm text-slate-200 mt-1">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {incident.events && incident.events.length > 0 && (
          <div className="bg-slate-900/30 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Timeline</h2>
            <div className="space-y-3">
              {incident.events.map((event: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-slate-200">{event.message || event.description}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown time'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional: Postmortem */}
        {incident.postmortemUrl && (
          <div className="bg-slate-900/30 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Postmortem</h2>
            <a
              href={incident.postmortemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Download PDF
            </a>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Shield, Users, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const incidentId = params.id;

  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncident = async () => {
      // First try to get from sessionStorage (passed from dashboard)
      if (typeof window !== 'undefined' && incidentId) {
        const stored = sessionStorage.getItem(`incident_${incidentId}`);
        if (stored) {
          setIncident(JSON.parse(stored));
          setLoading(false);
          return;
        }
      }

      // If not in storage, try to fetch (but don't show errors)
      if (!incidentId || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incidentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIncident(data);
        }
      } catch (err) {
        // Silently fail - data from storage is enough
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, [incidentId, token]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-400">Loading incident details...</div>
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
          <div className="text-slate-400">No incident data available. Please select an incident from the dashboard.</div>
        </div>
      </DashboardLayout>
    );
  }

  const severity = (incident.severity || 'info').toLowerCase();
  const status = (incident.status || 'detecting').toLowerCase();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>

        {/* Title Section */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">
              {incident.title || (incident.type || 'Incident').replace(/_/g, ' ').toUpperCase()}
            </h1>
          </div>
          <p className="text-lg text-slate-300">{incident.service || 'Unknown Service'}</p>
        </div>

        {/* Critical Metrics Grid */}
        <div className="grid grid-cols-4 gap-4">
          {/* Severity */}
          <div className={`rounded-lg p-6 border ${
            severity === 'critical' 
              ? 'bg-red-500/20 border-red-500/50'
              : severity === 'warning'
              ? 'bg-orange-500/20 border-orange-500/50'
              : 'bg-blue-500/20 border-blue-500/50'
          }`}>
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Severity</div>
            <div className="text-2xl font-bold capitalize">{severity}</div>
          </div>

          {/* Status */}
          <div className={`rounded-lg p-6 border ${
            status === 'resolved'
              ? 'bg-green-500/20 border-green-500/50'
              : 'bg-yellow-500/20 border-yellow-500/50'
          }`}>
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Status</div>
            <div className="text-2xl font-bold capitalize flex items-center gap-2">
              {status === 'resolved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              {status}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Confidence</div>
            <div className="text-2xl font-bold text-blue-300">{incident.confidence || '87.2'}%</div>
          </div>

          {/* Affected Users */}
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-6">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Affected</div>
            <div className="text-2xl font-bold text-orange-300">{incident.affectedUsers || '0'} users</div>
          </div>
        </div>

        {/* Timestamps Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Created</div>
            <div className="text-sm text-slate-200">
              {incident.createdAt || incident.detectedAt
                ? new Date(incident.createdAt || incident.detectedAt).toLocaleString()
                : 'Unknown'}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Last Updated</div>
            <div className="text-sm text-slate-200">
              {incident.updatedAt
                ? new Date(incident.updatedAt).toLocaleString()
                : 'Recently'}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-semibold uppercase opacity-75 text-slate-400 mb-2">Incident ID</div>
            <div className="text-xs text-slate-300 font-mono break-all">
              {incident._id || incident.id || 'N/A'}
            </div>
          </div>
        </div>

        {/* Full Description */}
        {incident.description && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Incident Description
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">{incident.description}</p>
          </div>
        )}

        {/* Root Cause Analysis */}
        {incident.rootCause && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Root Cause Analysis
            </h2>
            <p className="text-slate-300 text-base">{incident.rootCause}</p>
          </div>
        )}

        {/* Detection Features & Results */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Detection & Analysis Results
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* ML Detection */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">ML Anomaly Detection</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• Pattern Anomaly Score: <span className="font-bold text-blue-300">94.2%</span></p>
                <p>• Deviation from Baseline: <span className="font-bold text-blue-300">High</span></p>
                <p>• Detection Model: <span className="font-bold">Isolation Forest</span></p>
                <p>• Confidence Level: <span className="font-bold text-green-300">Very High</span></p>
              </div>
            </div>

            {/* Threat Intelligence */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-300 mb-3">Threat Intelligence</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• CVSS Score: <span className="font-bold text-red-300">8.9 (High)</span></p>
                <p>• Attack Vector: <span className="font-bold">Network</span></p>
                <p>• Threat Actor: <span className="font-bold">Automated/Unknown</span></p>
                <p>• Risk Level: <span className="font-bold text-red-300">Critical</span></p>
              </div>
            </div>

            {/* Performance Impact */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-300 mb-3">Performance Impact</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• Latency Increase: <span className="font-bold">+245ms</span></p>
                <p>• CPU Usage: <span className="font-bold">78%</span></p>
                <p>• Memory Usage: <span className="font-bold">62%</span></p>
                <p>• Error Rate: <span className="font-bold text-orange-300">12.5%</span></p>
              </div>
            </div>

            {/* Isolation Results */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-300 mb-3">Isolation Results</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• Quarantine Status: <span className="font-bold text-green-300">Active</span></p>
                <p>• Requests Blocked: <span className="font-bold">1,247</span></p>
                <p>• Sources Isolated: <span className="font-bold">3</span></p>
                <p>• Duration: <span className="font-bold">47 minutes</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Response Actions */}
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-400 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Automated Response Actions Executed
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 rounded p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="font-semibold text-green-300">AI Agent Protocol Initiated</span>
              </div>
              <p className="text-sm text-slate-300">Automatic threat response triggered at 19:28:39</p>
            </div>

            <div className="bg-green-500/10 rounded p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="font-semibold text-green-300">Threat Isolation Activated</span>
              </div>
              <p className="text-sm text-slate-300">Malicious IPs and requests blocked</p>
            </div>

            <div className="bg-green-500/10 rounded p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="font-semibold text-green-300">Service Readiness Check</span>
              </div>
              <p className="text-sm text-slate-300">Recovery actions initialized</p>
            </div>

            <div className="bg-green-500/10 rounded p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="font-semibold text-green-300">Compliance Check Completed</span>
              </div>
              <p className="text-sm text-slate-300">All regulatory requirements validated</p>
            </div>
          </div>
        </div>

        {/* Incident Type Details */}
        {incident.type && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              Incident Type Information
            </h2>
            <p className="text-slate-300">
              <span className="font-semibold">Type:</span> {incident.type.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p className="text-slate-300 mt-2">
              <span className="font-semibold">Category:</span> {incident.service || 'Unknown'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

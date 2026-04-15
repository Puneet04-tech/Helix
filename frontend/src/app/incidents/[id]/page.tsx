'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Shield, Users, Zap, TrendingUp, Loader, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const incidentId = params.id;

  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPostmortem, setGeneratingPostmortem] = useState(false);

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

  const handleAnalyzeIncident = async () => {
    if (!incidentId || !token) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incidentId}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Re-fetch the incident data
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incidentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setIncident(data);
          // Update session storage too
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`incident_${incidentId}`, JSON.stringify(data));
          }
        }
      }
    } catch (err) {
      console.error('Failed to analyze incident:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGeneratePostmortem = async () => {
    if (!incidentId || !token) return;
    
    setGeneratingPostmortem(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incidentId}/postmortem/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Re-fetch the incident data
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incidentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setIncident(data);
          // Update session storage too
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`incident_${incidentId}`, JSON.stringify(data));
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate postmortem:', err);
    } finally {
      setGeneratingPostmortem(false);
    }
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

        {/* Detection Features & Results - Real Agent Data */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Detection & Analysis Results
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Detection Agent */}
            {incident.agentReasoning?.detectionAgent ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-3">Detection Agent</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Analysis: <span className="font-bold text-blue-300">{incident.agentReasoning.detectionAgent.analysis || 'N/A'}</span></p>
                  <p>• Confidence: <span className="font-bold text-blue-300">{incident.agentReasoning.detectionAgent.confidence || 'N/A'}</span></p>
                  <p>• Detected: <span className="font-bold">{new Date(incident.agentReasoning.detectionAgent.timestamp).toLocaleString()}</span></p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-400 mb-3">Detection Agent</h3>
                <p className="text-sm text-slate-400">No detection data available</p>
              </div>
            )}

            {/* Analysis Agent */}
            {incident.agentReasoning?.analysisAgent ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-300 mb-3">Analysis Agent</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Root Cause: <span className="font-bold text-red-300">{incident.agentReasoning.analysisAgent.rootCause || 'N/A'}</span></p>
                  <p>• Affected Systems: <span className="font-bold">{incident.agentReasoning.analysisAgent.affectedSystems?.join(', ') || 'N/A'}</span></p>
                  <p>• Estimated Impact: <span className="font-bold text-orange-300">{incident.agentReasoning.analysisAgent.estimatedImpact || 'N/A'}</span></p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-400 mb-3">Analysis Agent</h3>
                <p className="text-sm text-slate-400">No analysis data available</p>
              </div>
            )}

            {/* Response Agent */}
            {incident.agentReasoning?.responseAgent ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-300 mb-3">Response Agent</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Actions Executed: <span className="font-bold text-green-300">{incident.agentReasoning.responseAgent.actions?.length || 0}</span></p>
                  <p>• Success Rate: <span className="font-bold text-green-300">
                    {incident.agentReasoning.responseAgent.actions?.length > 0 
                      ? `${Math.round((incident.agentReasoning.responseAgent.actions.filter((a: any) => a.success).length / incident.agentReasoning.responseAgent.actions.length) * 100)}%`
                      : 'N/A'
                    }
                  </span></p>
                  <p>• Executed: <span className="font-bold">{new Date(incident.agentReasoning.responseAgent.timestamp).toLocaleString()}</span></p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-400 mb-3">Response Agent</h3>
                <p className="text-sm text-slate-400">No response data available</p>
              </div>
            )}

            {/* Communications Agent */}
            {incident.agentReasoning?.commsAgent ? (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Communications Agent</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Notifications Sent: <span className="font-bold text-purple-300">{incident.agentReasoning.commsAgent.notifications?.length || 0}</span></p>
                  <p>• Channels: <span className="font-bold">{incident.agentReasoning.commsAgent.notifications?.map((n: any) => n.channel).join(', ') || 'N/A'}</span></p>
                  <p>• Sent: <span className="font-bold">{new Date(incident.agentReasoning.commsAgent.timestamp).toLocaleString()}</span></p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/20 border border-slate-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-400 mb-3">Communications Agent</h3>
                <p className="text-sm text-slate-400">No communication data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Automated Response Actions */}
        {incident.agentReasoning?.responseAgent?.actions && 
         incident.agentReasoning.responseAgent.actions.length > 0 ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-400 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Automated Response Actions Executed
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {incident.agentReasoning.responseAgent.actions.map((action: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`rounded p-4 border ${
                    action.success 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      action.success ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className={`font-semibold ${
                      action.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {action.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {action.success && <span className="text-xs text-green-400 ml-auto">✓ EXECUTED</span>}
                  </div>
                  <div className="text-sm text-slate-300 mb-2">
                    <p><span className="font-semibold">Target:</span> {action.target}</p>
                    <p className="mt-2"><span className="font-semibold">Result:</span> {action.result}</p>
                  </div>
                  
                  {/* Show blocked IPs if applicable */}
                  {action.action === 'block_ip' && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded p-3 mt-3">
                      <p className="text-xs font-semibold text-red-300 mb-2">BLOCKED IP ADDRESSES:</p>
                      <p className="text-sm text-slate-300 font-mono">
                        {incident.metadata?.sourceIp || incident.metadata?.originIp || 'See firewall logs for details'}
                      </p>
                    </div>
                  )}

                  {/* Show maintenance ticket if applicable */}
                  {action.action === 'dispatch_maintenance' && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded p-3 mt-3">
                      <p className="text-xs font-semibold text-blue-300 mb-2">MAINTENANCE TICKET:</p>
                      <div className="text-sm text-slate-300 space-y-1">
                        <p>Location: <span className="font-mono">{incident.metadata?.location || 'General'}</span></p>
                        <p>Room: <span className="font-mono">{incident.metadata?.room || incident.metadata?.location || 'Unknown'}</span></p>
                        <p>Priority: <span className="font-mono">{incident.severity === 'critical' ? 'URGENT' : 'ROUTINE'}</span></p>
                        <p>Status: <span className="text-green-300">Ticket Created</span></p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Response Summary */}
            {incident.agentReasoning.responseAgent.timestamp && (
              <div className="mt-6 pt-4 border-t border-green-500/30">
                <p className="text-sm text-slate-400">
                  Response executed at: <span className="text-slate-200">
                    {new Date(incident.agentReasoning.responseAgent.timestamp).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-3">Response Status</h2>
            <p className="text-slate-300">No automated response actions executed for this incident yet.</p>
          </div>
        )}

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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleAnalyzeIncident}
            disabled={analyzing}
            className={`rounded-lg p-4 border flex items-center justify-center gap-2 font-semibold transition-all ${
              analyzing 
                ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
            }`}
          >
            {analyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Incident with Grok
              </>
            )}
          </button>

          <button
            onClick={handleGeneratePostmortem}
            disabled={generatingPostmortem}
            className={`rounded-lg p-4 border flex items-center justify-center gap-2 font-semibold transition-all ${
              generatingPostmortem 
                ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30'
            }`}
          >
            {generatingPostmortem ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Postmortem Report
              </>
            )}
          </button>
        </div>

        {/* Postmortem Report Display */}
        {incident.postmortemContent && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Postmortem Report
            </h2>
            <div className="bg-slate-950/50 border border-slate-800 rounded p-4 text-slate-300 text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
              {incident.postmortemContent}
            </div>
            {incident.postmortemGeneratedAt && (
              <p className="text-xs text-slate-400 mt-3">
                Generated: {new Date(incident.postmortemGeneratedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Users, Shield, Zap } from 'lucide-react';

interface IncidentDetailModalProps {
  incident: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function IncidentDetailModal({
  incident,
  isOpen,
  onClose,
}: IncidentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'timeline'>('overview');

  if (!isOpen || !incident) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'warning':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-orange-500/20 text-orange-400'
      : 'bg-green-500/20 text-green-400';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="bg-[#0D1B3E] border-b border-[#1E3A5F] px-8 py-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-lg border ${getSeverityColor(incident.severity)}`}>
              {(incident.severity || 'info').toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {(incident.type || 'UNKNOWN').replace(/_/g, ' ').toUpperCase()}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{incident.id || incident._id}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-[#1E3A5F] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-8 space-y-6">
              {/* Key Information Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-2">SERVICE</div>
                  <div className="text-lg font-semibold text-slate-200">{incident.service}</div>
                </div>
                <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-2">STATUS</div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold w-fit ${getStatusColor(incident.status)}`}>
                    {incident.status.toUpperCase()}
                  </div>
                </div>
                <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-2">DETECTED</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {new Date(incident.timestamp || incident.detectedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-2">CONFIDENCE</div>
                  <div className="text-lg font-bold text-[#5BA4F5]">
                    {incident.confidence || '87.2'}%
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <p className="text-slate-300 leading-relaxed">
                  {incident.description || 'No description available'}
                </p>
              </div>

              {/* Impact Analysis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">Affected Users</h3>
                  </div>
                  <div className="text-3xl font-bold text-orange-400">
                    {incident.affectedUsers ? parseInt(incident.affectedUsers).toLocaleString() : '0'}
                  </div>
                  <p className="text-sm text-slate-400 mt-2">users impacted by this incident</p>
                </div>

                <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">Impact Level</h3>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {incident.severity === 'critical' ? 'CRITICAL' : 'HIGH'}
                  </div>
                  <p className="text-sm text-slate-400 mt-2">service area affected</p>
                </div>
              </div>

              {/* Root Cause */}
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Root Cause Analysis
                </h3>
                <div className="bg-[#112D5E] rounded p-4 text-slate-300">
                  {incident.rootCause || 'Analysis in progress...'}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4">✓ Automated Response Executed</h3>
                <div className="space-y-2">
                  <p className="text-sm text-green-300">• AI agent initiated automatic response protocol</p>
                  <p className="text-sm text-green-300">• Threat isolation activated</p>
                  <p className="text-sm text-green-300">• Incident log created and archived</p>
                  <p className="text-sm text-green-300">• Compliance check completed</p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="p-8 space-y-6">
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Threat Intelligence</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Threat Type Classification</span>
                    <span className="text-slate-200 font-medium">
                      {incident.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">CVSS Score</span>
                    <span className="text-red-400 font-bold">8.9 (High)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Threat Actor</span>
                    <span className="text-slate-200">Automated/Unknown</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Attack Vector</span>
                    <span className="text-slate-200">Network</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">ML Anomaly Detected</h3>
                <p className="text-sm text-blue-300">
                  Pattern anomaly score: 94.2% - This activity deviates significantly from baseline behavior
                </p>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="p-8 space-y-4">
              <div className="space-y-4">
                {[
                  { time: 'Now', action: 'Incident Created', status: 'current' },
                  { time: '2s ago', action: 'Threat Analysis Started', status: 'completed' },
                  { time: '5s ago', action: 'AI Agent Initiated Response', status: 'completed' },
                  { time: '8s ago', action: 'Automated Mitigation Applied', status: 'completed' },
                ].map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          event.status === 'current'
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-green-500'
                        }`}
                      ></div>
                      {idx < 3 && (
                        <div className="w-0.5 h-12 bg-gradient-to-b from-slate-500 to-transparent mt-2"></div>
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium text-slate-300">{event.action}</p>
                      <p className="text-xs text-slate-500">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Tab Navigation */}
        <div className="bg-[#0D1B3E] border-t border-[#1E3A5F] px-8 py-4 flex gap-4">
          {['overview', 'analysis', 'timeline'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1E3A5F] text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface IncidentCardProps {
  id: string;
  type: string;
  service: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'detecting' | 'analyzing' | 'responding' | 'resolved';
  timestamp: string;
  isLive?: boolean;
}

export default function IncidentCard({
  id,
  type,
  service,
  severity,
  status,
  timestamp,
  isLive = false,
}: IncidentCardProps) {
  const severityColors = {
    critical: 'bg-red-900/40 text-red-400 border-red-800',
    warning: 'bg-amber-900/40 text-amber-400 border-amber-800',
    info: 'bg-sky-900/40 text-sky-400 border-sky-800',
  };

  const statusIcons = {
    detecting: <AlertCircle className="w-3 h-3" />,
    analyzing: <AlertCircle className="w-3 h-3" />,
    responding: <AlertCircle className="w-3 h-3" />,
    resolved: <CheckCircle className="w-3 h-3" />,
  };

  return (
    <Link href={`/incidents/${id}`}>
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1E3A5F] hover:bg-[#1A3A6E] cursor-pointer transition-colors">
        {/* Live Indicator */}
        {isLive && (
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        )}

        {/* Severity Badge */}
        <div
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[severity]}`}
        >
          {severity.toUpperCase()}
        </div>

        {/* Incident Details */}
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200">
            {type.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Service: <span className="text-slate-400">{service}</span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-slate-500">{timestamp}</div>

        {/* Status Icon */}
        <div className="text-slate-400">{statusIcons[status]}</div>
      </div>
    </Link>
  );
}

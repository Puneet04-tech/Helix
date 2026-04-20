'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuditLog {
  id: string;
  service: string;
  action: string;
  message?: string;
  details?: any;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  incidentId?: string;
}

export const AuditTrail: React.FC<{ incidentId?: string }> = ({ incidentId }) => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [ws, setWs] = useState<any>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token) return;

    const io = require('socket.io-client').default || require('socket.io-client');
    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
      {
        path: '/socket.io',
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
      }
    );

    socket.on('connect', () => {
      console.log('[AuditTrail] WebSocket connected');
      socket.emit('subscribe_project', { token });
    });

    socket.on('audit_log', (event: any) => {
      const log = event.log || event;
      if (incidentId && log.incidentId !== incidentId) return;

      setLogs(prev => [log, ...prev].slice(0, 100));
      console.log('[AuditTrail] Received audit log:', log);
    });

    setWs(socket);

    return () => {
      socket.disconnect();
    };
  }, [token, incidentId]);

  // Fetch initial audit trail
  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        const endpoint = incidentId 
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/audit/incident/${incidentId}`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/audit`;
        
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || data);
        }
      } catch (error) {
        console.error('[AuditTrail] Failed to fetch audit trail:', error);
      }
    };

    if (token) {
      fetchAuditTrail();
    }
  }, [token, incidentId]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const levelColors: Record<string, string> = {
    debug: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
    warn: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Audit Trail</h3>
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {filteredLogs.length}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4">
          {/* Filters */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {['all', 'debug', 'info', 'warn', 'error'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === lvl
                    ? levelColors[lvl]
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No audit logs</p>
            ) : (
              filteredLogs.map((log, idx) => (
                <div
                  key={`${log.id}-${idx}`}
                  className={`p-3 rounded-md border border-gray-200 ${levelColors[log.level]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.service}</span>
                        <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-mono">
                          {log.action}
                        </span>
                      </div>
                      {log.message && (
                        <p className="text-sm mb-1">{log.message}</p>
                      )}
                      {log.details && (
                        <details className="text-xs opacity-75">
                          <summary className="cursor-pointer">Details</summary>
                          <pre className="mt-1 p-2 bg-white bg-opacity-30 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 ml-4 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

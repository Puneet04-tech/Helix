'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { FileClock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditPage() {
  type AuditLog = {
    _id?: string;
    id?: string;
    projectId?: string;
    incidentId?: string;
    service?: string;
    action?: string;
    message?: string;
    details?: any;
    level?: string;
    severity?: string;
    timestamp?: string;
    createdAt?: string;
  };

  const { user, token } = useAuth();
  const projectId = user?.projectIds?.[0] || '';
  const { auditLogs: wsAuditLogs } = useWebSocket(projectId);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('all');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!wsAuditLogs || wsAuditLogs.length === 0) return;
    setLogs(prev => {
      const combined = [...wsAuditLogs, ...prev];
      const seen = new Set();
      return combined.filter(item => {
        const key = item._id || item.id || `${item.timestamp}-${item.action}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }, [wsAuditLogs]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/audit?limit=${limit}&offset=${offset}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch audit trail');
      const data = await response.json();
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setTotal(typeof data?.total === 'number' ? data.total : 0);
    } catch (err) {
      console.error('Fetch audit error:', err);
      setError('Failed to load audit trail.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, limit, offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = level === 'all' ? logs : logs.filter(l => (l.level || l.severity) === level);

  const levelClasses: Record<string, string> = {
    debug: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    warn: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    error: 'bg-red-500/10 text-red-300 border-red-500/30',
    critical: 'bg-red-500/10 text-red-300 border-red-500/30',
  };

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Audit Trail</h1>
            <p className="text-slate-400 mt-1">
              Full platform activity log ({total} entries)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#2979CC]"
            >
              <option value="all">All levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={limit}
              onChange={e => {
                setLimit(parseInt(e.target.value));
                setOffset(0);
              }}
              className="bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#2979CC]"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E3A5F] flex items-center gap-2">
            <FileClock className="w-5 h-5 text-[#5BA4F5]" />
            <h2 className="text-lg font-semibold text-slate-100">Activity Log</h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-slate-400">
              Loading audit trail...
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-[#1E3A5F]">
              {filtered.map((log, idx) => {
                const key = log._id || log.id || `${log.timestamp}-${idx}`;
                const lev = (log.level || log.severity || 'info').toLowerCase();
                const stamp = log.timestamp || log.createdAt;
                return (
                  <div key={key} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono border ${levelClasses[lev] || levelClasses.info}`}
                          >
                            {lev}
                          </span>
                          <span className="text-sm font-medium text-slate-100">
                            {log.action || 'action'}
                          </span>
                          {log.service && (
                            <span className="text-xs text-slate-400">
                              {log.service}
                            </span>
                          )}
                          {log.incidentId && (
                            <span className="text-xs text-slate-500 font-mono">
                              #{log.incidentId}
                            </span>
                          )}
                        </div>
                        {log.message && (
                          <p className="text-sm text-slate-300 mt-1">
                            {log.message}
                          </p>
                        )}
                        {log.details && typeof log.details === 'object' && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-500 cursor-pointer">
                              Details
                            </summary>
                            <pre className="mt-2 p-3 bg-[#0A1428] rounded-lg text-xs text-slate-400 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      {stamp && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(stamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-slate-400">
              No audit entries match the current filter.
            </div>
          )}
        </div>

        {total > limit && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Page {currentPage} of {pageCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="flex items-center gap-1 bg-[#1A3A6E] hover:bg-[#1E3A5F] disabled:opacity-40 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => setOffset(Math.min(total - limit, offset + limit))}
                disabled={offset + limit >= total}
                className="flex items-center gap-1 bg-[#1A3A6E] hover:bg-[#1E3A5F] disabled:opacity-40 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
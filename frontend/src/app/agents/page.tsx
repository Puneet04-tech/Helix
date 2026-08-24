'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Play,
  FlaskConical,
  Search,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

export default function AgentsPage() {
  const { token } = useAuth();

  const [chaosService, setChaosService] = useState('');
  const [chaosResult, setChaosResult] = useState<any>(null);
  const [chaosLoading, setChaosLoading] = useState(false);
  const [chaosError, setChaosError] = useState('');

  const [canaryUrl, setCanaryUrl] = useState('');
  const [canaryFlow, setCanaryFlow] = useState<'hotel' | 'hospital'>('hospital');
  const [canaryResult, setCanaryResult] = useState<any>(null);
  const [canaryLoading, setCanaryLoading] = useState(false);
  const [canaryError, setCanaryError] = useState('');

  const [kbQuery, setKbQuery] = useState('');
  const [kbResults, setKbResults] = useState<any[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbError, setKbError] = useState('');

  const runChaos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !chaosService.trim()) return;
    setChaosLoading(true);
    setChaosError('');
    setChaosResult(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agents/chaos/simulate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ service: chaosService.trim() }),
        },
      );
      if (!response.ok) throw new Error('Chaos simulation failed');
      setChaosResult(await response.json());
    } catch (err: any) {
      setChaosError(err.message || 'Chaos simulation failed');
    } finally {
      setChaosLoading(false);
    }
  };

  const runCanary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canaryUrl.trim()) return;
    setCanaryLoading(true);
    setCanaryError('');
    setCanaryResult(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agents/canary/run`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: canaryUrl.trim(),
            flow: canaryFlow,
          }),
        },
      );
      if (!response.ok) throw new Error('Canary test failed');
      setCanaryResult(await response.json());
    } catch (err: any) {
      setCanaryError(err.message || 'Canary test failed');
    } finally {
      setCanaryLoading(false);
    }
  };

  const searchKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !kbQuery.trim()) return;
    setKbLoading(true);
    setKbError('');
    setKbResults([]);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agents/knowledge/search?query=${encodeURIComponent(
          kbQuery.trim(),
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error('Knowledge search failed');
      const data = await response.json();
      setKbResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setKbError(err.message || 'Knowledge search failed');
    } finally {
      setKbLoading(false);
    }
  };

  const card =
    'bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-6 space-y-4';
  const inputClass =
    'w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Autonomous Agents
          </h1>
          <p className="text-slate-400 mt-1">
            Chaos engineering, canary testing, and the knowledge base
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chaos Simulation */}
          <div className={card}>
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-[#ff6b6b]" />
              <h2 className="text-lg font-semibold text-slate-100">
                Chaos Simulation
              </h2>
            </div>
            <form onSubmit={runChaos} className="flex gap-2">
              <input
                type="text"
                value={chaosService}
                onChange={e => setChaosService(e.target.value)}
                placeholder="Seed service (e.g. API Gateway)"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={chaosLoading}
                className="flex items-center gap-2 bg-[#2979CC] hover:bg-[#1F5AA8] disabled:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                Simulate
              </button>
            </form>
            {chaosError && (
              <p className="mt-3 text-sm text-red-400">{chaosError}</p>
            )}
            {chaosLoading && (
              <p className="mt-3 text-sm text-slate-400">Analyzing failure cascade...</p>
            )}
            {chaosResult && !chaosLoading && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                      chaosResult.riskLevel === 'High'
                        ? 'border-red-500/30 text-red-400 bg-red-500/10'
                        : chaosResult.riskLevel === 'None'
                          ? 'border-green-500/30 text-green-400 bg-green-500/10'
                          : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                    }`}
                  >
                    Risk: {chaosResult.riskLevel}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(chaosResult.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">
                    Cascade chain ({chaosResult.cascadeChain?.length || 0}):
                  </p>
                  {chaosResult.cascadeChain?.length ? (
                    <div className="space-y-2">
                      {chaosResult.cascadeChain.map(
                        (c: any, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2"
                          >
                            <span className="text-sm text-slate-200">
                              {c.service}
                            </span>
                            <span className="text-xs text-slate-400">
                              {(c.probability * 100).toFixed(1)}% ·{' '}
                              <span className="text-[#5BA4F5]">{c.impactLevel}</span>
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No historical cascade data available for this service.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Canary Test */}
          <div className={card}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Silent Canary
              </h2>
            </div>
            <form onSubmit={runCanary} className="space-y-3">
              <input
                type="text"
                value={canaryUrl}
                onChange={e => setCanaryUrl(e.target.value)}
                placeholder="Target URL (e.g. http://localhost:5001/health)"
                className={inputClass}
              />
              <div className="flex gap-2">
                {(['hospital', 'hotel'] as const).map(flow => (
                  <button
                    key={flow}
                    type="button"
                    onClick={() => setCanaryFlow(flow)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                      canaryFlow === flow
                        ? 'bg-[#2979CC] text-white'
                        : 'bg-[#1A3A6E] text-slate-300'
                    }`}
                  >
                    {flow}
                  </button>
                ))}
                <button
                  type="submit"
                  disabled={canaryLoading}
                  className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              </div>
            </form>
            {canaryError && (
              <p className="mt-3 text-sm text-red-400">{canaryError}</p>
            )}
            {canaryResult && !canaryLoading && (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                      canaryResult.up || canaryResult.success
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {canaryResult.up || canaryResult.success
                      ? 'Up'
                      : 'Down'}
                  </span>
                  <span className="text-sm text-slate-300">
                    Latency:{' '}
                    <span className="text-[#5BA4F5]">
                      {canaryResult.latency ?? canaryResult.totalLatencyMs}ms
                    </span>
                  </span>
                </div>
                {canaryResult.steps?.length ? (
                  <div className="mt-3 space-y-2">
                    {canaryResult.steps.map((s: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-slate-300">
                          {s.name || s.step}
                        </span>
                        <span className="text-xs text-slate-400">
                          {s.latencyMs ?? s.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Base */}
        <div className={card}>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-[#5BA4F5]" />
            <h2 className="text-lg font-semibold text-slate-100">
              Knowledge Base Search
            </h2>
          </div>
          <form onSubmit={searchKnowledge} className="flex gap-2">
            <input
              type="text"
              value={kbQuery}
              onChange={e => setKbQuery(e.target.value)}
              placeholder="Search resolved incident root causes..."
              className={inputClass}
            />
            <button
              type="submit"
              disabled={kbLoading}
              className="flex items-center gap-2 bg-[#2979CC] hover:bg-[#1F5AA8] disabled:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              <Cpu className="w-4 h-4" />
              Search
            </button>
          </form>
          {kbError && <p className="mt-3 text-sm text-red-400">{kbError}</p>}
          {kbLoading && (
            <p className="mt-3 text-sm text-slate-400">Searching knowledge base...</p>
          )}
          {!kbLoading && kbResults.length > 0 && (
            <div className="mt-4 divide-y divide-[#1E3A5F]">
              {kbResults.map((item, i) => (
                <div key={i} className="py-3">
                  <p className="text-sm text-slate-200">
                    {item.type || item.incidentType || 'Incident'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.rootCause ||
                      item.agentReasoning?.analysisAgent?.rootCause ||
                      'No root cause recorded'}
                  </p>
                </div>
              ))}
            </div>
          )}
          {!kbLoading && kbResults.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              No knowledge matches. Search for a resolved incident's root cause.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Bot className="w-4 h-4" />
          Agent actions execute against the configured target environment.
        </div>
      </div>
    </DashboardLayout>
  );
}
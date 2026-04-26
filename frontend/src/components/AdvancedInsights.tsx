import React from 'react';
import { Network, Activity, ShieldAlert, BarChart3, Info } from 'lucide-react';

interface BenchmarkingProps {
    data: any;
    mode: 'chaos' | 'benchmark';
}

export const AdvancedInsights = ({ data, mode }: BenchmarkingProps) => {
  if (mode === 'benchmark') {
    const metrics = data?.benchmarks || { avgResponseTime: 280, stabilityScore: 88, bookingErrorRate: 0.008 };
    const client = data?.client || { avgResolutionTime: 340000, stabilityScore: 94 };
    
    return (
      <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" />
            Feature 7: Industry Benchmarking
          </h3>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 uppercase font-mono tracking-widest">
            Anonymous Peer Data
          </span>
        </div>

        <div className="space-y-6">
          <BenchmarkRow 
            label="Avg Response Time" 
            value={`${Math.round(client.avgResolutionTime / 1000)}s`} 
            industry={`${metrics.avgResponseTime}ms`} 
            status={client.avgResolutionTime / 1000 > metrics.avgResponseTime ? 'slower' : 'better'} 
            percent={Math.abs(Math.round(((client.avgResolutionTime / 1000) - metrics.avgResponseTime) / metrics.avgResponseTime * 100))} 
          />
          <BenchmarkRow 
            label="Stability Score" 
            value={client.stabilityScore.toFixed(1)} 
            industry={metrics.stabilityScore} 
            status={client.stabilityScore > metrics.stabilityScore ? 'better' : 'slower'} 
            percent={Math.abs(Math.round(client.stabilityScore - metrics.stabilityScore))} 
          />
        </div>
        
        <div className="mt-6 p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-xs text-indigo-300/70 flex gap-3">
          <Info className="flex-shrink-0 w-4 h-4 mt-0.5" />
          Data is aggregated across Comparable hospitality clients. No specific peer data is exposed.
        </div>
      </div>
    );
  }

  const cascadeChain = data?.cascadeChain || [];

  return (
    <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-red-400" />
          Feature 2: Real-Time Chaos Risk Map
        </h3>
        <button className="text-[10px] bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 uppercase font-bold hover:bg-red-500/20 transition-all">
          {data ? 'System Analysis Active' : 'Analyze Current Risks'}
        </button>
      </div>

      <div className="relative h-64 bg-black/40 rounded-xl border border-gray-800 overflow-hidden mb-4 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="h-full w-full" style={{backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px'}}></div>
        </div>
        
        <div className="flex flex-col items-center gap-4 z-10 w-full px-4">
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg font-bold text-red-100 text-sm text-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                {data?.seedService || 'BOOKING_SERVICE'}<br/><span className="text-[10px] font-normal opacity-70">Detected Service Node</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 w-full">
              {cascadeChain.length > 0 ? cascadeChain.slice(0, 3).map((c: any, i: number) => (
                <div key={i} className="p-2 bg-gray-800 border border-red-500/50 rounded text-xs text-gray-300 animate-pulse">
                  {c.service}
                  <div className="text-[10px] text-red-400">Impact Risk: {Math.round(c.probability * 100)}%</div>
                </div>
              )) : (
                <>
                  <div className="p-2 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">PAYMENT_SVC</div>
                  <div className="p-2 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">EMAIL_NOTIF</div>
                </>
              )}
            </div>
            <div className="text-[10px] text-gray-500 font-mono italic">
              {data ? `AI analyzed ${cascadeChain.length} live dependency chains across your infrastructure` : 'Scanning infrastructure for risk mapping...'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-gray-500 mb-1">Risk Level</div>
            <div className={`font-bold ${data?.riskLevel === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>
              {data?.riskLevel || 'N/A'}
            </div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-gray-500 mb-1">Impacted Nodes</div>
            <div className="font-bold text-white">{cascadeChain.length} Services</div>
        </div>
      </div>
    </div>
  );
};

const BenchmarkRow = ({ label, value, industry, status, percent }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono">{value} vs <span className="text-gray-500">{industry}</span></span>
    </div>
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
      <div className="h-full bg-indigo-500" style={{ width: '70%' }}></div>
      <div className={`h-full ${status === 'better' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: '10%' }}></div>
    </div>
    <div className={`text-[10px] ${status === 'better' ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
        {status === 'better' ? '▲' : '▼'} {percent}% {status === 'better' ? 'above' : 'below'} peers
    </div>
  </div>
);

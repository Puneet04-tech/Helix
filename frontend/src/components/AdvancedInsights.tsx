import React from 'react';
import { Network, Activity, ShieldAlert, BarChart3, Info } from 'lucide-react';

interface BenchmarkingProps {
    data: any;
    mode: 'chaos' | 'benchmark';
}

export const AdvancedInsights = ({ data, mode }: BenchmarkingProps) => {
  if (mode === 'benchmark') {
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
          <BenchmarkRow label="Avg Response Time" value="340ms" industry="280ms" status="slower" percent={21} />
          <BenchmarkRow label="Stability Score" value="94.2" industry="88.5" status="better" percent={6} />
          <BenchmarkRow label="Guest Error Rate" value="3.2%" industry="0.8%" status="slower" percent={300} />
        </div>
        
        <div className="mt-6 p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-xs text-indigo-300/70 flex gap-3">
          <Info className="flex-shrink-0 w-4 h-4 mt-0.5" />
          Data is aggregated across 42 comparable hospitality clients. No specific peer data is exposed.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-red-400" />
          Feature 2: Chaos Mode Risk Map
        </h3>
        <button className="text-[10px] bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 uppercase font-bold hover:bg-red-500/20 transition-all">
          Inject Sandbox Failure
        </button>
      </div>

      <div className="relative h-64 bg-black/40 rounded-xl border border-gray-800 overflow-hidden mb-4 flex items-center justify-center">
        {/* Mocked Dependency Graph Visualization */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="h-full w-full" style={{backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px'}}></div>
        </div>
        
        <div className="flex flex-col items-center gap-4 z-10">
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg font-bold text-red-100 text-xs text-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                PAYMENT_GATEWAY<br/><span className="text-[8px] font-normal opacity-70">Source of Failure</span>
            </div>
            <div className="flex gap-12">
                <div className="p-2 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">BOOKING_SVC</div>
                <div className="p-2 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">EMAIL_NOTIF</div>
                <div className="p-2 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">REVENUE_DASH</div>
            </div>
            <div className="text-[10px] text-gray-500 font-mono italic">AI Guardian simulated 4 dependency chains based on historical logs</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-gray-500 mb-1">Critical Dependencies</div>
            <div className="font-bold text-white">7 Services at risk</div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-gray-500 mb-1">Time to Failure</div>
            <div className="font-bold text-white">~3 Minutes</div>
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

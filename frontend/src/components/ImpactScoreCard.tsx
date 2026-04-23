import React from 'react';
import { Target, TrendingDown, Users, DollarSign, Brain } from 'lucide-react';

export const ImpactScoreCard = ({ impact, sentiment }: { impact: any; sentiment?: any }) => {
  if (!impact) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Score */}
      <div className="bg-gray-900 border border-indigo-500/30 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
          <Brain size={60} />
        </div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Impact Score</span>
          <Target className="text-indigo-400 w-4 h-4" />
        </div>
        <div className="text-3xl font-bold text-white">{impact.guestImpactScore}</div>
        <div className="text-xs text-gray-500 mt-1">Scale of 0-100 (Criticality)</div>
      </div>

      {/* Revenue */}
      <div className="bg-gray-900 border border-emerald-500/30 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
          <DollarSign size={60} />
        </div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Revenue at Risk</span>
          <TrendingDown className="text-emerald-400 w-4 h-4" />
        </div>
        <div className="text-3xl font-bold text-white">₹{impact.estimatedRevenueAtRisk?.toLocaleString()}</div>
        <div className="text-xs text-gray-500 mt-1">Based on loss of conversion</div>
      </div>

      {/* Guests */}
      <div className="bg-gray-900 border border-blue-500/30 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
          <Users size={60} />
        </div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Guests Affected</span>
          <Users className="text-blue-400 w-4 h-4" />
        </div>
        <div className="text-3xl font-bold text-white">{impact.affectedGuestCount}</div>
        <div className="text-xs text-gray-500 mt-1">Confirmed user sessions</div>
      </div>

      {/* Sentiment (Feature 8) */}
      <div className={`bg-gray-900 border p-4 rounded-xl relative overflow-hidden group ${
        sentiment?.label === 'negative' ? 'border-red-500/30' : 'border-indigo-500/30'
      }`}>
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Brain size={60} />
        </div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Guest Sentiment</span>
          <Activity className="text-red-400 w-4 h-4" />
        </div>
        <div className={`text-xl font-bold uppercase ${
          sentiment?.label === 'negative' ? 'text-red-400' : 'text-indigo-400'
        }`}>
          {sentiment?.emotionalTone || (impact.guestImpactScore > 50 ? 'DISTRESSED' : 'ANXIOUS')}
        </div>
        <div className="text-xs text-gray-500 mt-2 italic px-2 border-l border-gray-700">
          "{sentiment?.highlightedQuotes?.[0] || 'Booking failing multiple times, help!'}"
        </div>
      </div>
    </div>
  );
};

const Activity = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

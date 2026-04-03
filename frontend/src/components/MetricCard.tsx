'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  highlight?: boolean;
}

export default function MetricCard({
  label,
  value,
  trend,
  highlight = false,
}: MetricCardProps) {
  return (
    <div
      className={`bg-[#112D5E] rounded-xl p-4 border ${
        highlight ? 'border-[#2979CC] border-l-4' : 'border-[#1E3A5F]'
      }`}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-[#93C5FD] mb-2">{value}</div>
      {trend && (
        <div className={`text-xs font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
          {trend.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(trend.value)}% from last week
        </div>
      )}
    </div>
  );
}

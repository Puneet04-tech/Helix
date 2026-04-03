'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function StatusPage() {
  const services = [
    { name: 'Auth Service', status: 'operational', uptime: 99.99 },
    { name: 'Payment Service', status: 'operational', uptime: 99.97 },
    { name: 'User Service', status: 'operational', uptime: 99.98 },
    { name: 'Analytics Service', status: 'operational', uptime: 99.95 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">System Status</h1>
          <p className="text-slate-400 mt-1">Real-time service health status</p>
        </div>

        <div className="space-y-3">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg px-6 py-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-slate-100 font-medium">{service.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {service.uptime}% uptime
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  Operational
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StatusPage() {
  type Service = {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: number;
  };

  const { user, token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user || !token) return;

      setLoading(true);
      setError('');

      try {
        const projectId = user.projectIds?.[0];

        // Fetch from status endpoint - returns services derived from real incidents
        const response = await fetch(
          projectId
            ? `${process.env.NEXT_PUBLIC_API_URL}/status/project/${projectId}`
            : `${process.env.NEXT_PUBLIC_API_URL}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setServices(Array.isArray(data) ? data : []);
        } else {
          throw new Error('Failed to fetch service status');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load service status');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, token]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">System Status</h1>
            <p className="text-slate-400 mt-1">Real-time service health status</p>
          </div>
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
            <p className="text-xs mt-2 text-red-300">
              Services will appear as incidents are detected and stored in the database.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">System Status</h1>
          <p className="text-slate-400 mt-1">Real-time service health status</p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-slate-400">Loading service status...</div>
          ) : services.length > 0 ? (
            services.map((service, idx) => (
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
                  {service.status === 'operational' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Operational
                      </span>
                    </>
                  ) : service.status === 'degraded' ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">
                        Degraded
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-medium text-red-400">
                        Down
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-400">No services found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

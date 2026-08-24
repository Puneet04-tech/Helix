'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  TestTube2,
  Plus,
  RefreshCw,
  Building2,
  Activity,
  KeyRound,
} from 'lucide-react';

export default function ClientsPage() {
  type Client = {
    _id: string;
    name: string;
    status: 'active' | 'inactive' | 'suspended';
    monitoredServices: string[];
    userIds: string[];
    apiKey?: string;
    createdAt?: string;
  };

  const { token, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [servicesInput, setServicesInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const fetchClients = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch clients error:', err);
      setError('Failed to load clients. Ensure the backend is running and seeded.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const services = servicesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: user?.organizationId || 'default',
            name: clientName,
            monitoredServices: services,
          }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create client');
      }
      setCreateSuccess(`Client "${clientName}" created successfully.`);
      setClientName('');
      setServicesInput('');
      setShowForm(false);
      await fetchClients();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  const statusColor = (status: string) =>
    status === 'active'
      ? 'bg-green-500/10 text-green-400 border-green-500/30'
      : status === 'suspended'
        ? 'bg-red-500/10 text-red-400 border-red-500/30'
        : 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Clients</h1>
            <p className="text-slate-400 mt-1">
              Monitored hospital & hotel deployments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchClients}
              className="flex items-center gap-2 bg-[#1A3A6E] hover:bg-[#1E3A5F] text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-[#2979CC] hover:bg-[#1F5AA8] text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Client
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreateClient}
            className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-100">
              Register a new client deployment
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                required
                placeholder="e.g. General Hospital, Grand Hotel"
                className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Monitored Services (comma separated)
              </label>
              <input
                type="text"
                value={servicesInput}
                onChange={e => setServicesInput(e.target.value)}
                placeholder="e.g. API Gateway, Authentication, Billing"
                className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
              />
            </div>
            {createError && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm">
                {createSuccess}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-[#2979CC] hover:bg-[#1F5AA8] disabled:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {creating ? 'Creating...' : 'Create Client'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-[#1A3A6E] hover:bg-[#1E3A5F] text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-[#112D5E] rounded-xl border border-[#1E3A5F] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E3A5F] flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-[#5BA4F5]" />
            <h2 className="text-lg font-semibold text-slate-100">
              Registered Clients
            </h2>
            <span className="ml-auto text-sm text-slate-400">
              {clients.length} total
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-slate-400">
              Loading clients...
            </div>
          ) : clients.length > 0 ? (
            <div className="divide-y divide-[#1E3A5F]">
              {clients.map(client => (
                <div
                  key={client._id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-100 font-medium">
                        {client.name || client._id}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">
                          <KeyRound className="inline w-3 h-3 mr-1" />
                          {client.apiKey
                            ? `${client.apiKey.slice(0, 12)}...`
                            : 'No API key'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Activity className="inline w-3 h-3" />
                          {client.monitoredServices?.length || 0} services
                        </span>
                        <span className="text-xs text-slate-500">
                          {client.userIds?.length || 0} linked users
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-medium uppercase ${statusColor(
                      client.status,
                    )}`}
                  >
                    {client.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-slate-400">
              No clients found. Register your first client deployment above.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
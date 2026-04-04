'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchFiltersProps {
  incidents: any[];
  onFilter: (filtered: any[]) => void;
}

export default function SearchFilters({ incidents, onFilter }: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values from incidents
  const severities = useMemo(() => [...new Set(incidents.map(i => i.severity))], [incidents]);
  const statuses = useMemo(() => [...new Set(incidents.map(i => i.status))], [incidents]);
  const services = useMemo(() => [...new Set(incidents.map(i => i.service))], [incidents]);

  // Apply filters
  const filtered = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch =
        searchTerm === '' ||
        incident.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = selectedSeverity === null || incident.severity === selectedSeverity;
      const matchesStatus = selectedStatus === null || incident.status === selectedStatus;
      const matchesService = selectedService === null || incident.service === selectedService;

      return matchesSearch && matchesSeverity && matchesStatus && matchesService;
    });
  }, [incidents, searchTerm, selectedSeverity, selectedStatus, selectedService]);

  // Call onFilter whenever filtered list changes
  React.useEffect(() => {
    onFilter(filtered);
  }, [filtered, onFilter]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSeverity !== null ||
    selectedStatus !== null ||
    selectedService !== null;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity(null);
    setSelectedStatus(null);
    setSelectedService(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search incidents by type, service, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#2979CC] transition-colors"
        />
      </div>

      {/* Filter Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg text-slate-300 hover:border-[#2979CC] transition-colors text-sm font-medium"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}

        <span className="text-xs text-slate-400">
          {filtered.length} of {incidents.length} incidents
        </span>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-3 gap-4 bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4">
          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
            <div className="space-y-2">
              {severities.map((sev) => (
                <label key={sev} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    checked={selectedSeverity === sev}
                    onChange={() => setSelectedSeverity(selectedSeverity === sev ? null : sev)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs text-slate-300 capitalize">{sev}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <div className="space-y-2">
              {statuses.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={selectedStatus === status}
                    onChange={() => setSelectedStatus(selectedStatus === status ? null : status)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs text-slate-300 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Service</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {services.map((service) => (
                <label key={service} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="service"
                    checked={selectedService === service}
                    onChange={() => setSelectedService(selectedService === service ? null : service)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs text-slate-300">{ service}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingDown, Zap, BarChart3, MessageSquare, ArrowRight, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for demo - EXPANDED DETAILED DATA
  const mockIncidents = [
    {
      id: '1',
      type: 'performance_degradation',
      service: 'Auth Service',
      severity: 'warning',
      status: 'resolved',
      timestamp: '2 hours ago',
      duration: '12m 34s',
      description: 'Response time increased from 150ms to 2.5s',
      rootCause: 'Database connection pool exhaustion',
      affectedUsers: '15,432',
      impact: 'Login delays for 2.3% of users',
    },
    {
      id: '2',
      type: 'unauthorized_access',
      service: 'Payment Service',
      severity: 'critical',
      status: 'resolved',
      timestamp: '5 hours ago',
      duration: '45m 12s',
      description: 'Suspicious API calls detected from unknown IP',
      rootCause: 'Compromised API key in public repository',
      affectedUsers: '2,156',
      impact: 'Potential unauthorized payment attempts blocked',
    },
    {
      id: '3',
      type: 'service_crash',
      service: 'User Service',
      severity: 'warning',
      status: 'resolved',
      timestamp: '1 day ago',
      duration: '8m 45s',
      description: 'Service crashed due to memory leak',
      rootCause: 'Unbounded cache in user session handler',
      affectedUsers: '8,923',
      impact: 'User profile access unavailable for 8 minutes',
    },
    {
      id: '4',
      type: 'database_error',
      service: 'Analytics Service',
      severity: 'info',
      status: 'resolved',
      timestamp: '1 day ago',
      duration: '3m 18s',
      description: 'Connection timeout to replica database',
      rootCause: 'Maintenance window on replica instance',
      affectedUsers: '100',
      impact: 'Analytics queries slightly delayed',
    },
    {
      id: '5',
      type: 'ssl_certificate',
      service: 'API Gateway',
      severity: 'critical',
      status: 'resolved',
      timestamp: '2 days ago',
      duration: '1m 02s',
      description: 'SSL certificate expiration detected',
      rootCause: 'Certificate renewal automation failed',
      affectedUsers: '45,000',
      impact: 'All external API calls temporarily blocked',
    },
    {
      id: '6',
      type: 'resource_exhaustion',
      service: 'Storage Service',
      severity: 'warning',
      status: 'resolved',
      timestamp: '3 days ago',
      duration: '22m 15s',
      description: 'Disk usage reached 95% capacity',
      rootCause: 'Accumulation of unused temporary files',
      affectedUsers: '5,234',
      impact: 'Slow file uploads and processing',
    },
    {
      id: '7',
      type: 'memory_leak',
      service: 'Background Jobs',
      severity: 'warning',
      status: 'resolved',
      timestamp: '5 days ago',
      duration: '34m 00s',
      description: 'Memory consumption increased by 300%',
      rootCause: 'Queue processing task not releasing memory',
      affectedUsers: '0',
      impact: 'Worker nodes restarted automatically',
    },
    {
      id: '8',
      type: 'network_timeout',
      service: 'CDN',
      severity: 'info',
      status: 'resolved',
      timestamp: '1 week ago',
      duration: '5m 30s',
      description: 'Increased latency detected',
      rootCause: 'Regional network congestion',
      affectedUsers: '234,000',
      impact: 'Slower content delivery in US-East region',
    },
    {
      id: '9',
      type: 'rate_limit_exceeded',
      service: 'API Gateway',
      severity: 'warning',
      status: 'resolved',
      timestamp: '1 week ago',
      duration: '15m 45s',
      description: 'API rate limits triggered multiple times',
      rootCause: 'Bot traffic from crawler spider',
      affectedUsers: '3,421',
      impact: '0.8% of legitimate requests throttled',
    },
    {
      id: '10',
      type: 'data_corruption',
      service: 'Storage Service',
      severity: 'critical',
      status: 'resolved',
      timestamp: '2 weeks ago',
      duration: '2h 34m',
      description: 'Data consistency check failed in backup storage',
      rootCause: 'Partial write during network failure',
      affectedUsers: '50',
      impact: 'Backup data restored from secondary replica',
    },
  ];

  const mockServices = [
    { 
      name: 'Auth Service', 
      status: 'operational', 
      uptime: 99.99,
      lastIncident: '2 hours ago',
      avgResponseTime: '142ms',
      requests24h: '2.3M',
    },
    { 
      name: 'Payment Service', 
      status: 'operational', 
      uptime: 99.97,
      lastIncident: '5 hours ago',
      avgResponseTime: '187ms',
      requests24h: '450K',
    },
    { 
      name: 'User Service', 
      status: 'operational', 
      uptime: 99.98,
      lastIncident: '1 day ago',
      avgResponseTime: '156ms',
      requests24h: '1.8M',
    },
    { 
      name: 'Analytics Service', 
      status: 'operational', 
      uptime: 99.95,
      lastIncident: '1 day ago',
      avgResponseTime: '523ms',
      requests24h: '890K',
    },
    { 
      name: 'API Gateway', 
      status: 'operational', 
      uptime: 99.99,
      lastIncident: '2 days ago',
      avgResponseTime: '65ms',
      requests24h: '45.2M',
    },
    { 
      name: 'Storage Service', 
      status: 'operational', 
      uptime: 99.96,
      lastIncident: '3 days ago',
      avgResponseTime: '234ms',
      requests24h: '1.2M',
    },
    { 
      name: 'Background Jobs', 
      status: 'operational', 
      uptime: 99.98,
      lastIncident: '5 days ago',
      avgResponseTime: '1.2s',
      requests24h: '156K',
    },
    { 
      name: 'CDN', 
      status: 'operational', 
      uptime: 99.97,
      lastIncident: '1 week ago',
      avgResponseTime: '45ms',
      requests24h: '120M',
    },
    { 
      name: 'Logging Service', 
      status: 'operational', 
      uptime: 99.94,
      lastIncident: '2 days ago',
      avgResponseTime: '89ms',
      requests24h: '5.6M',
    },
    { 
      name: 'Search Service', 
      status: 'operational', 
      uptime: 99.99,
      lastIncident: '10 days ago',
      avgResponseTime: '256ms',
      requests24h: '890K',
    },
  ];

  const mockMetrics = {
    activeIncidents: 2,
    resolved24h: 48,
    avgResolution: '14m 32s',
    uptime: '99.97%',
    totalIncidentsMonth: 324,
    avgResponseTime: '187ms',
    totalRequests: '245.8M',
    criticalResolved: 12,
  };

  const mockAlerts = [
    { type: 'CPU', value: '72%', status: 'warning', service: 'API Gateway' },
    { type: 'Memory', value: '88%', status: 'warning', service: 'Analytics Service' },
    { type: 'Disk I/O', value: '45%', status: 'normal', service: 'Storage Service' },
    { type: 'Network', value: '34%', status: 'normal', service: 'CDN' },
    { type: 'Database', value: '62%', status: 'normal', service: 'Payment Service' },
    { type: 'Cache Hit', value: '92%', status: 'normal', service: 'Auth Service' },
    { type: 'Queue Depth', value: '5,234', status: 'warning', service: 'Background Jobs' },
    { type: 'Error Rate', value: '0.002%', status: 'normal', service: 'User Service' },
  ];

  const mockTrends = [
    { metric: 'Incident Count', trend: -25, value: '2' },
    { metric: 'Response Time', trend: -15, value: '187ms' },
    { metric: 'Error Rate', trend: -42, value: '0.003%' },
    { metric: 'Recovery Time', trend: -8, value: '14m 32s' },
    { metric: 'MTTR (Month)', trend: -18, value: '12m 15s' },
    { metric: 'System Uptime', trend: 2, value: '99.97%' },
    { metric: 'Resource Util', trend: -12, value: '65%' },
    { metric: 'Alert Volume', trend: -35, value: '1.2K/day' },
  ];

  const features = [
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: 'Real-Time Detection',
      description: 'Automatically detect threats and incidents across your entire infrastructure in real-time with ML-powered anomaly detection.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Autonomous Response',
      description: 'AI-powered response agents take action automatically to mitigate threats before impact with zero human intervention.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Comprehensive Analytics',
      description: 'Deep insights into incident patterns, root causes, trends, and system health metrics with 30+ performance indicators.',
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Helix Intelligence',
      description: 'Chat with our intelligent security assistant to get instant answers about threats, incidents, services, and system health.',
    },
    {
      icon: <ShieldAlert className="w-8 h-8" />,
      title: 'Threat Intelligence',
      description: 'Integrated with global threat databases and anomaly signatures for the latest security insights.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Automated Playbooks',
      description: 'Pre-built and custom automation playbooks for common incidents with configurable response actions.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Compliance Reporting',
      description: 'Automatically generate compliance reports for SOC2, ISO27001, HIPAA, and other regulatory frameworks.',
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Multi-Channel Alerts',
      description: 'Get notified via email, Slack, PagerDuty, webhooks, and SMS with intelligent alert routing.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] via-[#1A2F5E] to-[#0D1B3E]">
      {/* Navigation */}
      <nav className="bg-[#0D1B3E]/80 backdrop-blur border-b border-[#1E3A5F] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-[#5BA4F5]" />
            <span className="text-2xl font-bold text-[#5BA4F5]">Helix</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('dashboard')} className="text-slate-300 hover:text-white">Features</button>
            <button onClick={() => setActiveTab('incidents')} className="text-slate-300 hover:text-white">Demo Data</button>
            <a href="/login" className="px-4 py-2 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg transition-colors">
              Login
            </a>
            <a href="/login" className="px-4 py-2 border border-[#5BA4F5] text-[#5BA4F5] hover:bg-[#5BA4F5]/10 rounded-lg transition-colors">
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Autonomous Threat<br />Detection & Response
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Helix automatically detects, analyzes, and responds to security threats in real-time. Powered by AI agents that learn from your incidents.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/login" className="px-8 py-3 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </a>
            <button className="px-8 py-3 border border-[#5BA4F5] text-[#5BA4F5] hover:bg-[#5BA4F5]/10 rounded-lg font-medium transition-colors">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-20">
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center hover:border-[#2979CC] transition-colors">
            <div className="text-3xl font-bold text-[#5BA4F5]">{mockMetrics.activeIncidents}</div>
            <div className="text-sm text-slate-400 mt-2">Active Incidents</div>
            <div className="text-xs text-green-400 mt-1">↓ 25% from last week</div>
          </div>
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center hover:border-[#2979CC] transition-colors">
            <div className="text-3xl font-bold text-green-400">{mockMetrics.resolved24h}</div>
            <div className="text-sm text-slate-400 mt-2">Resolved (24h)</div>
            <div className="text-xs text-green-400 mt-1">↑ 12% from last week</div>
          </div>
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center hover:border-[#2979CC] transition-colors">
            <div className="text-3xl font-bold text-[#5BA4F5]">{mockMetrics.avgResolution}</div>
            <div className="text-sm text-slate-400 mt-2">Avg Resolution</div>
            <div className="text-xs text-green-400 mt-1">↓ 8% from last week</div>
          </div>
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center hover:border-[#2979CC] transition-colors">
            <div className="text-3xl font-bold text-green-400">{mockMetrics.uptime}</div>
            <div className="text-sm text-slate-400 mt-2">System Uptime</div>
            <div className="text-xs text-slate-500 mt-1">→ 0% from last week</div>
          </div>
        </div>

        {/* Extended Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-20">
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-orange-400">{mockMetrics.totalIncidentsMonth}</div>
            <div className="text-sm text-slate-400 mt-2">Total Incidents (30 days)</div>
          </div>
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-[#5BA4F5]">{mockMetrics.avgResponseTime}</div>
            <div className="text-sm text-slate-400 mt-2">Average Response Time</div>
          </div>
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-400">{mockMetrics.totalRequests}</div>
            <div className="text-sm text-slate-400 mt-2">Total Requests (24h)</div>
          </div>
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-red-400">{mockMetrics.criticalResolved}</div>
            <div className="text-sm text-slate-400 mt-2">Critical Incidents (Month)</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#1E3A5F]">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-6 hover:border-[#2979CC] transition-colors group">
              <div className="text-[#5BA4F5] mb-4 group-hover:text-[#7BB8FF] transition-colors">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#5BA4F5] transition-colors">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Dashboard */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#1E3A5F]">
        <h2 className="text-4xl font-bold text-white mb-6">Live Dashboard Demo</h2>
        <p className="text-slate-400 mb-8">See what your incident monitoring dashboard looks like with real data.</p>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-[#1E3A5F]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-[#2979CC] text-[#2979CC]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'incidents'
                ? 'border-[#2979CC] text-[#2979CC]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Incidents
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'services'
                ? 'border-[#2979CC] text-[#2979CC]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Services
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-8 space-y-8">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">ACTIVE INCIDENTS</div>
                <div className="text-3xl font-bold text-[#5BA4F5]">2</div>
                <div className="text-xs text-green-400 mt-2">↓ 25% from last week</div>
              </div>
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">RESOLVED (24H)</div>
                <div className="text-3xl font-bold text-green-400">48</div>
                <div className="text-xs text-green-400 mt-2">↑ 12% from last week</div>
              </div>
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">AVG RESOLUTION TIME</div>
                <div className="text-3xl font-bold text-[#5BA4F5]">14m 32s</div>
                <div className="text-xs text-green-400 mt-2">↓ 8% from last week</div>
              </div>
              <div className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">SYSTEM UPTIME</div>
                <div className="text-3xl font-bold text-green-400">99.97%</div>
                <div className="text-xs text-slate-500 mt-2">→ 0% from last week</div>
              </div>
            </div>

            {/* System Alerts */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">System Resource Alerts</h3>
              <div className="grid grid-cols-4 gap-3">
                {mockAlerts.map((alert, idx) => (
                  <div key={idx} className={`bg-[#0D1B3E] border rounded-lg p-4 ${
                    alert.status === 'warning' ? 'border-orange-500/50' : 'border-[#1E3A5F]'
                  }`}>
                    <div className="text-xs text-slate-400">{alert.type}</div>
                    <div className={`text-2xl font-bold mt-1 ${
                      alert.status === 'warning' ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {alert.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{alert.service}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trends */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
              <div className="grid grid-cols-4 gap-3">
                {mockTrends.map((item, idx) => (
                  <div key={idx} className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4">
                    <div className="text-xs text-slate-400">{item.metric}</div>
                    <div className="text-2xl font-bold text-slate-200 mt-1">{item.value}</div>
                    <div className={`text-xs mt-2 flex items-center gap-1 ${
                      item.trend < 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {item.trend < 0 ? '↓' : '↑'} {Math.abs(item.trend)}% from last month
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents (Last 24h)</h3>
              <div className="space-y-3">
                {mockIncidents.slice(0, 4).map(incident => (
                  <div key={incident.id} className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-4 hover:border-[#2979CC] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`px-3 py-1 rounded text-xs font-semibold ${
                          incident.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : incident.severity === 'warning'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {incident.severity.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-slate-200 font-medium">
                            {incident.type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-500">{incident.service}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Resolved</div>
                        <div className="text-sm text-green-400">✓ {incident.duration}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs mt-3 pt-3 border-t border-[#1E3A5F]">
                      <div>
                        <span className="text-slate-500">Root Cause:</span>
                        <div className="text-slate-300 mt-1">{incident.rootCause}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Affected Users:</span>
                        <div className="text-slate-300 mt-1">{incident.affectedUsers}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Impact:</span>
                        <div className="text-slate-300 mt-1">{incident.impact}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-8 space-y-6">
            <div className="flex gap-4 mb-6">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                All ({mockIncidents.length})
              </button>
              <button className="px-4 py-2 bg-[#1E3A5F] text-slate-300 rounded-lg text-sm font-medium hover:bg-[#2979CC] transition-colors">
                Critical (2)
              </button>
              <button className="px-4 py-2 bg-[#1E3A5F] text-slate-300 rounded-lg text-sm font-medium hover:bg-[#2979CC] transition-colors">
                Active (1)
              </button>
              <button className="px-4 py-2 bg-[#1E3A5F] text-slate-300 rounded-lg text-sm font-medium hover:bg-[#2979CC] transition-colors">
                Resolved (7)
              </button>
            </div>

            <div className="space-y-4">
              {mockIncidents.map((incident, idx) => (
                <div key={incident.id} className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg overflow-hidden hover:border-[#2979CC] transition-all">
                  <div className="p-4 cursor-pointer hover:bg-[#1E3A5F]/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          incident.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : incident.severity === 'warning'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {incident.severity.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-slate-200 font-semibold">
                            {incident.type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{incident.description}</div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-xs font-semibold px-2 py-1 rounded ${
                          incident.status === 'active'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {incident.status.toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">{incident.timestamp}</div>
                      </div>
                    </div>

                    <div className="bg-[#112D5E] rounded p-3 mt-3">
                      <div className="grid grid-cols-5 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500">Service</span>
                          <div className="text-slate-200 font-medium mt-1">{incident.service}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Duration</span>
                          <div className="text-slate-200 font-medium mt-1">{incident.duration}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Root Cause</span>
                          <div className="text-slate-200 font-medium mt-1 line-clamp-1">{incident.rootCause}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Affected Users</span>
                          <div className="text-slate-200 font-medium mt-1">{incident.affectedUsers}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Impact</span>
                          <div className="text-slate-200 font-medium mt-1 line-clamp-1">{incident.impact}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-8 space-y-6">
            <div className="text-sm text-slate-400 mb-6">
              <span className="text-green-400">● </span> OPERATIONAL
              <span className="ml-4"><span className="text-yellow-400">● </span> DEGRADED</span>
              <span className="ml-4"><span className="text-red-400">● </span> DOWN</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {mockServices.map((service, idx) => (
                <div key={idx} className="bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg p-6 hover:border-[#2979CC] transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-slate-200 font-semibold text-lg">{service.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Last incident: {service.lastIncident}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">{service.uptime}%</div>
                      <div className="text-xs text-slate-500">Uptime</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-[#1E3A5F]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Avg Response Time</span>
                      <span className="text-sm font-medium text-[#5BA4F5]">{service.avgResponseTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">24h Requests</span>
                      <span className="text-sm font-medium text-slate-300">{service.requests24h}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Error Rate</span>
                      <span className="text-sm font-medium text-green-400">0.02%</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-3 py-2 bg-[#1E3A5F] text-slate-300 rounded text-xs font-medium hover:bg-[#2979CC] transition-colors">
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#1E3A5F] text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Protect Your Infrastructure?</h2>
        <p className="text-xl text-slate-300 mb-8">
          Join teams worldwide using Helix for autonomous threat detection and response.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/login" className="px-8 py-3 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/login" className="px-8 py-3 border border-[#5BA4F5] text-[#5BA4F5] hover:bg-[#5BA4F5]/10 rounded-lg font-medium transition-colors">
            View Documentation
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E3A5F] bg-[#0D1B3E]/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400 text-sm">
          <p>© 2026 Helix. Autonomous Threat Detection & Response Platform.</p>
        </div>
      </footer>
    </div>
  );
}

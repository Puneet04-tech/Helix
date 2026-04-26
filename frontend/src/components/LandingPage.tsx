import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  ArrowRight, 
  ChevronRight, 
  Activity,
  Search,
  Users,
  Layers,
  Cpu,
  RefreshCw,
  Globe,
  Lock,
  Clock,
  Database,
  Terminal,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  const [activeDomain, setActiveDomain] = useState<'general' | 'hospital' | 'hotel'>('general');

  const coreFeatures = [
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Autonomous Detection',
      description: 'Real-time monitoring across distributed systems with AI-driven anomaly identification.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Self-Healing Agents',
      description: 'Automated response agents that execute mitigation playbooks without human intervention.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'RCA Logic Engine',
      description: 'Instant Root Cause Analysis linking disparate system events into a single cohesive story.',
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: 'Groq-Helix Pipeline',
      description: 'Ultra-low latency LLM inference for analyzing millions of log lines per second.',
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'Multi-Tenant SDK',
      description: 'Plug-and-play SDK to integrate monitoring into any tech stack in minutes.',
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Crisis Chat Interface',
      description: 'Natural language interface to query system health, incidents, and performance metrics.',
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Guardian Security',
      description: 'Advanced threat detection for unauthorized access, data breaches, and API abuse.',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Global Health Sync',
      description: 'Synchronized health monitoring across multiple regions and cloud providers.',
    },
    {
      icon: <RefreshCw className="w-8 h-8" />,
      title: 'Auto-Recovery',
      description: 'Failover mechanisms that automatically switch traffic to healthy nodes.',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Live Postmortems',
      description: 'Automatically generated incident reports for compliance and internal audits.',
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Predictive Scanning',
      description: 'Anticipate failures before they occur by identifying subtle performance trends.',
    },
    {
      icon: <Terminal className="w-8 h-8" />,
      title: 'API Integration Hub',
      description: 'Seamlessly connects with PagerDuty, Slack, Email, and custom Webhooks.',
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: 'Asset Protection',
      description: 'Dedicated monitoring for database health, query efficiency, and storage capacity.',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Historical Trends',
      description: 'Analyze months of data to optimize infrastructure and reduce recurring issues.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Coordination',
      description: 'Escalate incidents to the right personnel with context-aware intelligent routing.',
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Performance Score',
      description: 'Real-time health score calculation based on 30+ system performance indicators.',
    },
  ];

  const domainExamples = {
    general: {
      title: 'General IT Infrastructure',
      subtitle: 'Universal monitoring for any cloud-based system.',
      metrics: [
        { label: 'Uptime', value: '99.99%', color: 'text-green-400' },
        { label: 'MTTR', value: '14m 32s', color: 'text-blue-400' },
        { label: 'Health Score', value: '98', color: 'text-green-400' },
      ],
      description: 'Helix SDK monitors API Gateways, Microservices, and Databases. It identifies spikes in error rates and executes automatic scaling or cache clears to maintain stability.',
      useCase: 'Software companies, Fintech, and SaaS platforms.'
    },
    hospital: {
      title: 'Hospital Operational Center',
      subtitle: 'Critical monitoring for life-saving infrastructure.',
      metrics: [
        { label: 'System Uptime', value: '100%', color: 'text-green-400' },
        { label: 'Incidents (24h)', value: '12', color: 'text-orange-400' },
        { label: 'Patient Safety Score', value: '94', color: 'text-green-400' },
      ],
      description: 'Using the Helix SDK, hospitals integrate MRI scanners, patient record systems, and nursing station APIs. Helix detects timeouts in critical diagnostics and clears system bottlenecks autonomously.',
      useCase: 'Modern Hospitals, Clinics, and Medical Research Labs.'
    },
    hotel: {
      title: 'Luxury Hospitality Guardian',
      subtitle: 'Seamless experience monitoring for guest satisfaction.',
      metrics: [
        { label: 'Booking Uptime', value: '99.98%', color: 'text-green-400' },
        { label: 'Guest Sentiment', value: 'Positive', color: 'text-blue-400' },
        { label: 'Health Score', value: '96', color: 'text-green-400' },
      ],
      description: 'Hotels use the Helix SDK to monitor Booking Gateways, In-room entertainment, and CRM APIs. Helix detects when a VIP guest’s booking fails and triggers an manual override alert instantly.',
      useCase: 'Luxury Hotels, Resorts, and Travel Agencies.'
    }
  };

  return (
    <div className="min-h-screen bg-[#060B26] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-[#060B26]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#2979CC] to-[#5BA4F5] rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">HELIX</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Core Features</a>
            <a href="#examples" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Industry Examples</a>
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <Link href="/login" className="px-5 py-2 rounded-lg bg-[#2979CC] hover:bg-[#1A56A0] transition-colors text-sm font-semibold">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#2979CC]/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#5BA4F5]/10 blur-[120px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-[#5BA4F5] mb-8">
              <Zap className="w-4 h-4" /> 16 Core Features Implemented
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold mb-8 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Autonomous Crisis Detection.
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Helix is a universal guardian system. High-stakes industries use the Helix SDK to detect, analyze, and resolve infrastructure crises autonomously.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="px-8 py-4 rounded-xl bg-[#2979CC] hover:bg-[#1A56A0] transition-all flex items-center justify-center gap-3 font-bold group">
                Enter Command Center <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 16 Core Features Grid */}
      <section id="features" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Infrastructure Features</h2>
            <div className="h-1 w-20 bg-[#2979CC] rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#2979CC]/50 transition-all hover:bg-white/[0.05] group">
                <div className="mb-4 text-[#5BA4F5] group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[#5BA4F5] transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Integration Section */}
      <section id="examples" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">Industry Versatility</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Helix isn't just for IT. It's a general-purpose crisis management system. By integrating the **Helix SDK**, any physical or digital system can benefit from our autonomous agents.
              </p>
              
              <div className="flex flex-col gap-4">
                {(['general', 'hospital', 'hotel'] as const).map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setActiveDomain(domain)}
                    className={`p-6 rounded-xl border transition-all text-left flex items-center justify-between group ${
                      activeDomain === domain 
                        ? 'bg-[#2979CC] border-[#2979CC] text-white shadow-[0_0_30px_rgba(41,121,204,0.3)]' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {domain === 'general' && <Activity className="w-5 h-5" />}
                        {domain === 'hospital' && <Lock className="w-5 h-5" />}
                        {domain === 'hotel' && <Users className="w-5 h-5" />}
                        {domain.charAt(0).toUpperCase() + domain.slice(1)} Integration
                      </h4>
                      <p className={`text-sm mt-1 ${activeDomain === domain ? 'text-blue-100' : 'text-slate-500'}`}>
                        {domain === 'general' ? 'Core system monitoring' : `Sector-specific ${domain} logic`}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${activeDomain === domain ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#112D5E] to-[#0A1931] border border-[#1E3A5F] overflow-hidden min-h-[400px]">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    LIVE_CONTEXT: {activeDomain.toUpperCase()}
                  </span>
                </div>
                
                <h3 className="text-3xl font-bold mb-2">{domainExamples[activeDomain].title}</h3>
                <p className="text-[#5BA4F5] font-medium mb-8 italic">"{domainExamples[activeDomain].subtitle}"</p>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {domainExamples[activeDomain].metrics.map((m, i) => (
                    <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      "{domainExamples[activeDomain].description}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <CheckCircle className="w-4 h-4 text-green-400" /> Suitable for: {domainExamples[activeDomain].useCase}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 justify-center mb-6">
            <ShieldAlert className="w-6 h-6 text-[#5BA4F5]" />
            <span className="font-bold">HELIX PROTECT</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 Helix Autonomous Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

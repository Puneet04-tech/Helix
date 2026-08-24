'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import OnboardingTutorial from '../../components/OnboardingTutorial';
import { Zap, PlayCircle, Eye, Settings, ChevronRight } from 'lucide-react';

export default function OnboardingPage() {
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const cards = [
    {
      n: '01',
      title: 'Watch incidents stream in',
      desc: 'Helix continuously detects threats and streams them to your dashboard automatically.',
      icon: <Zap className="w-6 h-6 text-[#5BA4F5]" />,
    },
    {
      n: '02',
      title: 'Dive into any incident',
      desc: 'See the full analysis: severity, affected services, root cause, and the autonomous response.',
      icon: <Eye className="w-6 h-6 text-green-400" />,
    },
    {
      n: '03',
      title: 'Explore agents & analytics',
      desc: 'Chaos simulations, canary testing, the knowledge base, and event analytics.',
      icon: <PlayCircle className="w-6 h-6 text-yellow-400" />,
    },
    {
      n: '04',
      title: 'Stay compliant & audited',
      desc: 'Generate compliance PDFs and review the full audit trail.',
      icon: <Settings className="w-6 h-6 text-orange-400" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center py-6">
          <Zap className="w-16 h-16 text-[#5BA4F5] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-100">
            Welcome to Helix
          </h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            An autonomous threat detection and response platform. Here is a
            quick tour of what you can do.
          </p>
          <button
            onClick={() => setTutorialOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-[#2979CC] hover:bg-[#1F5AA8] text-white px-6 py-3 rounded-lg text-sm transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Start Quick Tour
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map(card => (
            <button
              key={card.n}
              onClick={() => setTutorialOpen(true)}
              className="text-left bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-6 hover:border-[#2979CC] transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-slate-600">{card.n}</span>
                {card.icon}
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100">
                  {card.title}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#5BA4F5] transition-colors" />
              </div>
              <p className="text-sm text-slate-400 mt-2">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <OnboardingTutorial
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </DashboardLayout>
  );
}
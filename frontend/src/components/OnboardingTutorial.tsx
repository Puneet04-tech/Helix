'use client';

import React, { useState } from 'react';
import { X, Play, Zap, Eye, Settings } from 'lucide-react';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTutorial({ isOpen, onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '🎯 Welcome to Helix',
      description:
        'An autonomous threat detection platform that detects and responds to security threats in real-time, without human intervention.',
      icon: <Zap className="w-12 h-12 text-blue-400" />,
      action: 'Next',
    },
    {
      title: '⚡ Live Demo - The Best Part',
      description:
        'Click the "Start Live Demo" button on the dashboard to see real-time security incidents streaming in. New threats appear automatically every 6 seconds!',
      icon: <Play className="w-12 h-12 text-green-400" />,
      action: 'Next',
    },
    {
      title: '👁️ Incident Deep Dive',
      description:
        'Click on any incident to see detailed analysis: severity, affected users, root cause, and the automated response timeline.',
      icon: <Eye className="w-12 h-12 text-purple-400" />,
      action: 'Next',
    },
    {
      title: '🔍 Search & Filter',
      description:
        'Use the search bar and filters to find incidents by type, service, or severity. Filter critical incidents to see what matters most.',
      icon: <Settings className="w-12 h-12 text-orange-400" />,
      action: 'Got It!',
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2979CC] to-[#1A56A0] px-6 py-8 flex flex-col items-center gap-4">
          {currentStep.icon}
          <h2 className="text-2xl font-bold text-white text-center">
            {currentStep.title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-slate-300 text-center leading-relaxed mb-8">
            {currentStep.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx <= step ? 'bg-[#2979CC]' : 'bg-[#1E3A5F]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0D1B3E] border-t border-[#1E3A5F] px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Skip
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg font-medium transition-colors"
          >
            {currentStep.action}
          </button>
        </div>
      </div>
    </div>
  );
}

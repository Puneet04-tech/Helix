'use client';

import DashboardLayout from '../components/DashboardLayout';
import { Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('ag_xxxxxxxxxxxxxxxx');
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account and integration</p>
        </div>

        <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            API Integration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="flex-1 bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg px-4 py-2 text-slate-200 text-sm font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                  }}
                  className="px-4 py-2 bg-[#2979CC] hover:bg-[#1A56A0] text-white rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Use this key to integrate the SDK with your application
              </p>
            </div>

            <div className="border-t border-[#1E3A5F] pt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Notification Preferences
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-[#1E3A5F]"
                  />
                  <span className="text-sm text-slate-300">
                    Email alerts on critical incidents
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#1E3A5F]" />
                  <span className="text-sm text-slate-300">
                    Email alerts on warnings
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-[#1E3A5F]"
                  />
                  <span className="text-sm text-slate-300">
                    Enable predictive alerts
                  </span>
                </label>
              </div>
            </div>

            <button className="w-full mt-6 bg-[#2979CC] hover:bg-[#1A56A0] text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { ScrollText, Download, FileText, Info } from 'lucide-react';

export default function CompliancePage() {
  const { token } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Default the range to the last 30 days.
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const todayStr = today.toISOString().slice(0, 10);
  const rangeStart = thirtyDaysAgo.toISOString().slice(0, 10);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setGenerating(true);
    setError('');
    setInfo('');

    if (!startDate || !endDate) {
      setError('Both start and end dates are required.');
      setGenerating(false);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date.');
      setGenerating(false);
      return;
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/compliance/report?startDate=${encodeURIComponent(
        startDate,
      )}&endDate=${encodeURIComponent(endDate)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const message = text.includes('startDate and endDate are required')
          ? 'This project requires a date range. Please select both dates.'
          : 'Compliance report generation failed.';
        throw new Error(message);
      }

      // response is a PDF blob — trigger a browser download.
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match
        ? match[1]
        : `compliance-report-${startDate}-to-${endDate}.pdf`;

      const url2 = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url2);

      setInfo('Report generated and download started.');
    } catch (err: any) {
      setError(err.message || 'Compliance report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const inputClass =
    'bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white focus:border-[#2979CC] focus:outline-none w-full';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Compliance Reports</h1>
          <p className="text-slate-400 mt-1">
            Generate formal compliance/audit reports for a date range
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {info}
          </div>
        )}

        <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#5BA4F5]" />
            <h2 className="text-lg font-semibold text-slate-100">
              Generate Compliance Report
            </h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  max={todayStr}
                  onChange={e => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  max={todayStr}
                  onChange={e => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={generating}
                className="flex items-center gap-2 bg-[#2979CC] hover:bg-[#1F5AA8] disabled:bg-slate-600 text-white px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                {generating ? 'Generating...' : 'Generate & Download PDF'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(rangeStart);
                  setEndDate(todayStr);
                  setError('');
                }}
                className="bg-[#1A3A6E] hover:bg-[#1E3A5F] text-slate-200 px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                Last 30 days
              </button>
            </div>
          </form>

          <div className="bg-[#0A1428] border border-[#1E3A5F] rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-[#5BA4F5] shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400">
              Reports include an executive summary, severity and incident-type
              breakdowns, a detailed incident log, and a compliance statement.
              The PDF download starts automatically after generation.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
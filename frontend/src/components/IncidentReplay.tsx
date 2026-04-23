'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Fingerprint, Activity, Clock } from 'lucide-react';

interface Event {
  type: string;
  timestamp: string;
  severity: string;
}

export const IncidentReplay = ({ events = [], fingerprint = null }: { events: Event[], fingerprint: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentIndex < events.length - 1) {
      timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 1000); // 1 second step
    } else {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, events]);

  useEffect(() => {
    setVisibleEvents(events.slice(0, currentIndex + 1));
  }, [currentIndex, events]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-indigo-500/30 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
          <Activity className="w-5 h-5" /> Feature 6: Incident Replay
        </h3>
        <div className="flex gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
          <button onClick={() => setCurrentIndex(-1)} className="p-1 hover:text-indigo-400"><SkipBack size={20}/></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:text-indigo-400">
            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
          </button>
          <button onClick={() => setCurrentIndex(prev => Math.min(events.length - 1, prev + 1))} className="p-1 hover:text-indigo-400">
            <SkipForward size={20}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Replay Timeline */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {visibleEvents.length === 0 && (
            <div className="text-center py-10 text-gray-500 italic">Press Play to begin replay...</div>
          )}
          {visibleEvents.map((event, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border animate-in slide-in-from-left duration-300 ${
              event.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800 border-gray-700'
            }`}>
              <div className={`mt-1 h-3 w-3 rounded-full ${
                event.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-indigo-400'
              }`} />
              <div>
                <div className="font-mono text-sm font-bold uppercase">{event.type}</div>
                <div className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DNA Fingerprint View */}
        <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold uppercase tracking-wider text-xs">
            <Fingerprint className="w-4 h-4" /> DNA Fingerprint Match (80%+)
          </div>
          
          {fingerprint ? (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-100 text-sm">
                <span className="font-bold">Match Found:</span> This pattern sequence matches a service crash from March 3rd (Redis Timeout).
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Similarity Score</span>
                  <span className="text-emerald-400 font-bold">92.4%</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div className="bg-gray-900 p-3 rounded border border-gray-700 font-mono text-[10px] text-gray-400 break-all leading-relaxed">
                {fingerprint.signature || 'GENERIC_P_SIG_829_23'}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Estimated escalation time: 4m 12s
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 italic text-sm py-10">
              Generating fingerprint pattern...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

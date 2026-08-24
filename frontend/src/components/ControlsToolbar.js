import React, { useState } from 'react';
import { ShieldCheck, Radar } from 'lucide-react';

export default function ControlsToolbar() {
  const [monitoring, setMonitoring] = useState(true);
  const safetyScore = 98;

  return (
    <div className="absolute top-6 left-6 z-20 flex flex-wrap items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-cyan-400/20 px-4 py-2.5 rounded-2xl shadow-2xl">
      {/* Brand Logo / Title */}
      <div className="flex items-center gap-3 pr-4 border-r border-cyan-400/20" data-testid="sabre-branding">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/50 bg-gradient-to-br from-cyan-300 via-blue-500 to-blue-800 text-xl shadow-lg shadow-blue-500/30" data-testid="sabre-target-emoticon" aria-label="SABRE target">🎯</div>
        <div>
          <h1 className="font-tech text-lg font-extrabold leading-none tracking-[0.18em] text-white">SABRE <span className="text-cyan-300">—</span></h1>
          <p className="mt-1 max-w-[210px] font-tech text-[9px] font-medium leading-tight tracking-[0.08em] text-blue-200">Spatial Attack Behaviour Reconstruction Engine</p>
        </div>
      </div>

      {/* Live telemetry status */}
      <div className="flex items-center gap-2.5" data-testid="telemetry-status">
        <Radar className="h-5 w-5 text-cyan-300 animate-pulse" />
        <div className="leading-tight">
          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Actively reading telemetries
          </p>
          <p className="text-[11px] text-emerald-300/90 font-medium" data-testid="threat-status">No ongoing threats</p>
        </div>
      </div>

      {/* Safety score */}
      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5" data-testid="safety-score">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        <div className="leading-tight">
          <p className="text-[9px] uppercase tracking-widest text-emerald-300/80 font-mono">Safety Score</p>
          <p className="text-sm font-bold text-emerald-200 font-mono">{safetyScore}<span className="text-emerald-400/60 text-xs">/100</span></p>
        </div>
      </div>

      {/* Placeholder toggle */}
      <button
        onClick={() => setMonitoring((m) => !m)}
        data-testid="monitoring-toggle-btn"
        aria-pressed={monitoring}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-1.5 transition-colors hover:bg-slate-800"
      >
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300">Auto-Defense</span>
        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${monitoring ? 'bg-emerald-500' : 'bg-slate-600'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${monitoring ? 'translate-x-4' : 'translate-x-1'}`} />
        </span>
      </button>
    </div>
  );
}

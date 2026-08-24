import React from 'react';
import { Sun, Moon, Sunset, Eye, FileText, Sparkles, Layers } from 'lucide-react';
import { Button } from './ui/button';

export default function ControlsToolbar({
  timeOfDay,
  setTimeOfDay,
  wireframeMode,
  setWireframeMode,
  onOpenSpecs,
  onResetView
}) {
  return (
    <div className="absolute top-6 left-6 z-20 flex flex-wrap items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 px-4 py-2.5 rounded-2xl shadow-2xl">
      {/* Brand Logo / Title */}
      <div className="flex items-center gap-3 pr-4 border-r border-cyan-400/20" data-testid="sabre-branding">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/50 bg-gradient-to-br from-cyan-300 via-blue-500 to-blue-800 text-xl shadow-lg shadow-blue-500/30" data-testid="sabre-target-emoticon" aria-label="SABRE target">🎯</div>
        <div>
          <h1 className="font-tech text-lg font-extrabold leading-none tracking-[0.18em] text-white">SABRE <span className="text-cyan-300">—</span></h1>
          <p className="mt-1 max-w-[210px] font-tech text-[9px] font-medium leading-tight tracking-[0.08em] text-blue-200">Spatial Attack Behaviour Reconstruction Engine</p>
        </div>
      </div>

      {/* Time of Day Presets */}
      <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setTimeOfDay('sunset')}
          data-testid="time-sunset-btn"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            timeOfDay === 'sunset'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sunset className="w-3.5 h-3.5" />
          <span>Sunset</span>
        </button>
        <button
          onClick={() => setTimeOfDay('night')}
          data-testid="time-night-btn"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            timeOfDay === 'night'
              ? 'bg-blue-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Night</span>
        </button>
        <button
          onClick={() => setTimeOfDay('day')}
          data-testid="time-day-btn"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            timeOfDay === 'day'
              ? 'bg-amber-100 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Day</span>
        </button>
      </div>

      {/* Wireframe Toggle */}
      <button
        onClick={() => setWireframeMode(!wireframeMode)}
        data-testid="wireframe-toggle-btn"
        className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
          wireframeMode
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
            : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Wireframe</span>
      </button>

      {/* Blueprint Specs Modal trigger */}
      <button
        onClick={onOpenSpecs}
        data-testid="toolbar-specs-btn"
        className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-950/60 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-all"
      >
        <FileText className="w-3.5 h-3.5 text-amber-400" />
        <span>Specs</span>
      </button>
    </div>
  );
}

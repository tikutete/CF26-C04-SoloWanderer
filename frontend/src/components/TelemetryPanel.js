import React from 'react';
import { Activity } from 'lucide-react';

const KIND_STYLE = {
  info: 'text-slate-400',
  event: 'text-cyan-200',
  auth: 'text-amber-300 font-semibold',
};

export default function TelemetryPanel({ telemetry = [] }) {
  return (
    <div
      className="absolute right-4 top-[70px] z-40 flex max-h-[45vh] w-[320px] flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-900/70 shadow-2xl backdrop-blur-xl"
      data-testid="telemetry-panel"
    >
      <div className="flex items-center gap-2.5 border-b border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5">
        <Activity className="h-4 w-4 text-cyan-300" />
        <h3 className="font-tech text-sm font-bold tracking-widest text-white">LIVE TELEMETRY</h3>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed" data-testid="telemetry-panel-feed">
        {telemetry.length === 0
          ? <div className="text-slate-500">[ listening... ]</div>
          : telemetry.map((t) => <div key={t.id} className={KIND_STYLE[t.kind] || 'text-slate-400'}>{t.text}</div>)}
      </div>
    </div>
  );
}

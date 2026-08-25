import React, { useState } from 'react';
import { ShieldAlert, Crosshair, ChevronRight, X, RotateCcw, Radar, Bug } from 'lucide-react';
import { TACTIC_COLOR } from '../data/mitreAttacks';

const roleLabel = {
  origin: 'ATTACK ORIGIN',
  injected: 'INJECTED HOP',
  hop: 'LATERAL HOP (Wi-Fi hub)',
  target: 'OBJECTIVE',
};

export default function SandboxSabrePanel({
  injections = [],
  pathSteps = [],
  canTrace = false,
  traced = false,
  tracing = false,
  onTrace,
  onReset,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const floorsHit = [...new Set(pathSteps.map((s) => s.floor))].length;

  return (
    <>
      <aside
        className="absolute right-0 top-[57px] bottom-0 z-30 flex w-[360px] flex-col gap-3 overflow-y-auto border-l border-red-500/30 bg-gradient-to-b from-[#1a0d10]/95 to-[#0b0709]/95 p-4 backdrop-blur-xl"
        data-testid="sandbox-sabre-panel"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10">
            <Bug className="h-5 w-5 text-red-300" />
          </div>
          <div>
            <h3 className="font-tech text-sm font-bold tracking-widest text-white">SABRE THREAT SANDBOX</h3>
            <p className="text-[10px] uppercase tracking-wider text-red-300/70">Manual attack modelling · MITRE ATT&amp;CK</p>
          </div>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/30 p-3">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-red-300/80">
            <Crosshair className="h-3.5 w-3.5" /> Injected threats · {injections.length}
          </p>
          {injections.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-slate-400">
              Click any device node, choose an <span className="text-slate-200">attack type</span>, then an
              <span className="text-slate-200"> attack subtype</span>. Inject threats on devices across floors,
              then trace the propagation path.
            </p>
          ) : (
            <ul className="flex flex-col gap-2" data-testid="injection-list">
              {injections.map((inj) => (
                <li key={inj.nodeId} className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-100">{inj.node.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">F{inj.node.floor} · {inj.node.ip}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded px-1.5 py-[1px] text-[10px] font-bold text-black"
                      style={{ backgroundColor: TACTIC_COLOR[inj.tactic.id] || '#8be7f2' }}
                    >
                      {inj.tactic.name} · {inj.tactic.id}
                    </span>
                    <span className="font-mono text-[10px] text-slate-300">{inj.tech.tid} · {inj.tech.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onTrace}
            disabled={!canTrace || tracing}
            data-testid="trace-path-btn"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-2.5 font-mono text-[12px] font-bold uppercase tracking-wider text-red-200 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Radar className={`h-4 w-4 ${tracing ? 'animate-spin' : ''}`} /> {tracing ? 'Tracing…' : 'Trace possible path'}
          </button>
          <button
            onClick={onReset}
            data-testid="sandbox-reset-btn"
            title="Reset sandbox"
            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {traced && pathSteps.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-black/40 p-3" data-testid="path-breakdown">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-red-300">
              <ShieldAlert className="h-3.5 w-3.5" /> Reconstructed path · {pathSteps.length} nodes · {floorsHit} floors
            </p>
            <ol className="relative flex flex-col gap-0 border-l border-red-500/30 pl-4">
              {pathSteps.map((s, i) => (
                <li key={`${s.ip}-${i}`} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-red-400 bg-red-500 shadow-[0_0_8px_rgba(255,59,59,0.9)]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-300/80">{roleLabel[s.role]}</p>
                  <p className="text-[12.5px] font-semibold text-slate-100">{s.name} <span className="font-mono text-[10px] text-slate-400">· F{s.floor} · {s.ip}</span></p>
                  {s.tactic && (
                    <p className="text-[11px] text-slate-300">
                      <span style={{ color: TACTIC_COLOR[s.tactic.id] || '#8be7f2' }}>{s.tactic.name}</span>
                      {' · '}<span className="font-mono">{s.tech.tid}</span> {s.tech.name}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2.5">
              <p className="text-[11px] text-amber-100">
                <span className="font-bold">Assessment:</span> a chain of individually-plausible events
                propagates from Floor {pathSteps[0]?.floor} upward, pivoting through each floor&apos;s Wi-Fi
                uplink toward the <span className="font-bold">Core Switch (Floor 5)</span> — the network backbone
                and highest-value objective.
              </p>
            </div>

            <button
              onClick={() => setShowDetails(true)}
              data-testid="sandbox-details-btn"
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-[12px] font-semibold text-slate-200 hover:bg-slate-800"
            >
              Show more details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {showDetails && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6" data-testid="sandbox-details-modal">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-red-500/40 bg-[#120a0d] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-red-500/30 bg-[#170c10] px-5 py-3">
              <h3 className="font-tech text-base font-bold tracking-widest text-white">ATTACK STEP BREAKDOWN</h3>
              <button onClick={() => setShowDetails(false)} data-testid="sandbox-details-close" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3 p-5">
              {pathSteps.map((s, i) => (
                <div key={`d-${s.ip}-${i}`} className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-white">{i + 1}. {s.name}</span>
                    <span className="rounded bg-slate-800 px-2 py-[2px] font-mono text-[11px] text-slate-300">F{s.floor} · {s.ip}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-red-300/80">{roleLabel[s.role]}</p>
                  {s.tactic ? (
                    <p className="mt-1 text-[13px] font-medium text-slate-200">
                      <span className="font-bold" style={{ color: TACTIC_COLOR[s.tactic.id] || '#8be7f2' }}>{s.tactic.name} ({s.tactic.id})</span>
                      {' — '}<span className="font-mono font-semibold">{s.tech.tid}</span> {s.tech.name}
                    </p>
                  ) : (
                    <p className="mt-1 text-[13px] font-medium text-slate-300">
                      Network transit via the floor Wi-Fi uplink toward the Core Switch (no operator-injected technique).
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

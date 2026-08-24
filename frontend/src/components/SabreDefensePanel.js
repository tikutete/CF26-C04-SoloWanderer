import React, { useState } from 'react';
import { ShieldAlert, Activity, Loader2, ChevronDown, ChevronRight, Crosshair } from 'lucide-react';

const STEPS = [
  {
    cmd: 'ssh 10.0.1.10 -> login as C4entrp / root',
    mitre: 'T1078 - Valid Accounts (Initial Access) + T1021.004 - SSH (remote service abuse)',
    type: 'Default credential exploitation',
  },
  {
    cmd: 'ip neigh',
    mitre: 'T1018 - Remote System Discovery',
    type: 'Network reconnaissance',
  },
  {
    cmd: 'ssh 10.0.1.12 -> login as recep2 / lobby2',
    mitre: 'T1021.004 - Remote Services: SSH + T1078 - Valid Accounts (Lateral Movement)',
    type: 'Lateral movement via SSH with known credentials',
  },
  {
    cmd: 'nmap',
    mitre: 'T1046 - Network Service Scanning + T1135 - Network Share Discovery',
    type: 'Service enumeration and shared resource discovery',
  },
  {
    cmd: 'smb://10.0.3.20/memo',
    mitre: 'T1039 - Data from Network Shared Drive + T1552 - Unsecured Credentials',
    type: 'Credential harvesting from a network share',
  },
  {
    cmd: 'login exec_dsvr_2 --user dsvr_backup',
    mitre: 'T1078 - Valid Accounts (Privilege Escalation + Lateral Movement) + T1550 - Use Alternate Authentication Material',
    type: 'Credential reuse / lateral movement using harvested credentials',
  },
  {
    cmd: 'ssh back_serv_01 --user srv_backup',
    mitre: 'T1021.004 - Remote Services: SSH (Lateral Movement)',
    type: 'Impact - Data destruction',
  },
];

function ScoreBadge({ score, mode }) {
  const styles = {
    idle: { ring: 'border-emerald-400/40', text: 'text-emerald-300', bg: 'bg-emerald-500/10', label: 'SECURE' },
    warn: { ring: 'border-amber-400/60', text: 'text-amber-300', bg: 'bg-amber-500/15', label: 'ELEVATED' },
    crit: { ring: 'border-red-500/70', text: 'text-red-300', bg: 'bg-red-500/20', label: 'CRITICAL' },
  }[mode];
  return (
    <div className={`flex items-center justify-between rounded-xl border ${styles.ring} ${styles.bg} px-3.5 py-3 transition-colors duration-500 ${mode === 'crit' ? 'sabre-compromised' : ''}`} data-testid="sabre-score">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-300/80">Safety Score</p>
        <p className={`font-mono text-3xl font-bold leading-none ${styles.text}`} data-testid="sabre-score-value">
          {score}<span className="text-sm text-slate-400/70">/100</span>
        </p>
      </div>
      <span className={`rounded-md border ${styles.ring} px-2 py-1 font-mono text-[10px] font-bold tracking-wider ${styles.text}`}>{styles.label}</span>
    </div>
  );
}

export default function SabreDefensePanel({ score, scoreMode, telemetry, preempt, alerts, reconStage, analysis }) {
  const [showDetails, setShowDetails] = useState(false);
  const reconstructing = reconStage >= 1 && !analysis;

  return (
    <div
      className="absolute right-4 top-[70px] bottom-4 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-red-500/30 shadow-2xl backdrop-blur-xl"
      style={{ background: 'linear-gradient(180deg, rgba(40,10,12,0.72), rgba(20,8,10,0.66))' }}
      data-testid="sabre-defense-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-red-500/25 bg-red-500/10 px-4 py-3">
        <ShieldAlert className="h-5 w-5 text-red-300" />
        <div>
          <h3 className="font-tech text-sm font-bold tracking-widest text-white">SABRE DEFENSE</h3>
          <p className="text-[10px] text-red-200/70">Auto-Defense active · monitoring telemetry</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
        {/* Safety score */}
        <ScoreBadge score={score} mode={scoreMode} />

        {/* Telemetry feed / preempt */}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-red-200/70">
            <Activity className="h-3.5 w-3.5" /> Live Telemetry
          </p>
          <div className="min-h-[74px] rounded-lg border border-slate-700/60 bg-black/40 p-2.5 font-mono text-[11px] leading-relaxed" data-testid="sabre-telemetry">
            {preempt ? (
              <div className="animate-pulse font-bold text-amber-300" data-testid="sabre-preempt">&gt; {preempt.text}</div>
            ) : (
              telemetry.length === 0
                ? <div className="text-slate-500">[ listening... ]</div>
                : telemetry.map((t, i) => <div key={i} className="text-slate-400">{t}</div>)
            )}
          </div>
        </div>

        {/* Alert log */}
        {alerts.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-red-200/70">Alerts</p>
            <div className="space-y-1.5" data-testid="sabre-alerts">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] ${
                    a.level === 'crit'
                      ? 'border-red-500/50 bg-red-500/15 text-red-200 font-bold'
                      : 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  {a.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reconstruction loading */}
        {reconstructing && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-red-200" data-testid="sabre-reconstructing">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[11px]">Reconstructing potential attack path...</span>
          </div>
        )}

        {/* Analysis result */}
        {analysis && (
          <div className="space-y-2.5 rounded-xl border border-red-500/35 bg-black/30 p-3" data-testid="sabre-analysis">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-red-300" />
              <h4 className="font-tech text-xs font-bold tracking-widest text-white">ATTACK RECONSTRUCTED</h4>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400">Attack type:</span>
                <span className="rounded-md bg-red-500/25 px-2 py-0.5 font-bold text-red-200 ring-1 ring-red-400/40">Internal Spearphishing</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400">MITRE ATT&amp;CK ID:</span>
                <span className="rounded bg-slate-700/60 px-2 py-0.5 font-mono font-semibold text-cyan-200">T1534</span>
              </div>
            </div>

            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-red-200/70">Potential reason</p>
              <ul className="list-disc space-y-1 pl-4 text-[11.5px] leading-snug text-slate-300">
                <li>Lobby Kiosk and Reception PC 2 share the same admin account &mdash; enabling the initial foothold and first lateral hop.</li>
                <li>The memo on <span className="font-mono text-cyan-200">10.0.3.20</span> stored the saved password of Executive PC 2, harvested for onward movement.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowDetails((v) => !v)}
              data-testid="sabre-show-details-btn"
              className="flex w-full items-center justify-between rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-700"
            >
              <span>Show more details</span>
              {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showDetails && (
              <div className="space-y-2.5" data-testid="sabre-step-details">
                {STEPS.map((s, i) => (
                  <div key={i} className="rounded-lg border border-slate-700/70 bg-black/40 p-2.5">
                    <p className="font-mono text-[11px] font-bold text-white">Step {i + 1} &mdash; <span className="text-cyan-200">{s.cmd}</span></p>
                    <p className="mt-1 text-[10.5px] leading-snug text-slate-400">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">MITRE: </span>{s.mitre}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Attack type:</span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold text-amber-200 ring-1 ring-amber-400/40">{s.type}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

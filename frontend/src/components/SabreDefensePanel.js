import React, { useState } from 'react';
import { ShieldAlert, Activity, Loader2, ChevronRight, Crosshair, X } from 'lucide-react';

const STEPS_TERMINAL = [
  { cmd: 'ssh 10.0.1.10 -> login as C4entrp / root', mitre: 'T1078 - Valid Accounts (Initial Access) + T1021.004 - SSH (remote service abuse)', type: 'Default credential exploitation' },
  { cmd: 'ip neigh', mitre: 'T1018 - Remote System Discovery', type: 'Network reconnaissance' },
  { cmd: 'ssh 10.0.1.12 -> login as recep2 / lobby2', mitre: 'T1021.004 - Remote Services: SSH + T1078 - Valid Accounts (Lateral Movement)', type: 'Lateral movement via SSH with known credentials' },
  { cmd: 'nmap', mitre: 'T1046 - Network Service Scanning + T1135 - Network Share Discovery', type: 'Service enumeration and shared resource discovery' },
  { cmd: 'smb://10.0.3.20/memo', mitre: 'T1039 - Data from Network Shared Drive + T1552 - Unsecured Credentials', type: 'Credential harvesting from a network share' },
  { cmd: 'login exec_dsvr_2 --user dsvr_backup', mitre: 'T1078 - Valid Accounts (Privilege Escalation + Lateral Movement) + T1550 - Use Alternate Authentication Material', type: 'Credential reuse / lateral movement using harvested credentials' },
  { cmd: 'ssh back_serv_01 --user srv_backup', mitre: 'T1021.004 - Remote Services: SSH (Lateral Movement)', type: 'Impact - Data destruction' },
];

const STEPS_HARDWARE = [
  { cmd: 'RFID scan @ Lobby (Floor 1)', mitre: 'T1078 - Valid Accounts + T1111 - Multi-Factor / physical access', type: 'Cloned-badge physical entry' },
  { cmd: 'RFID scan @ Floor 2', mitre: 'T1078 - Valid Accounts', type: 'Physical lateral movement' },
  { cmd: 'ssh -i cloud_srvr.pem', mitre: 'T1021.004 - Remote Services: SSH + T1552.004 - Unsecured Private Keys', type: 'Key-based remote access' },
  { cmd: 'show openconfig', mitre: 'T1046 - Network Service Scanning + T1580 - Cloud Infrastructure Discovery', type: 'Cloud service discovery' },
  { cmd: 'pivot -> Domain Controller (10.0.5.2)', mitre: 'T1021 - Remote Services + T1078 - Valid Accounts', type: 'Lateral movement to domain' },
  { cmd: 'reach Mail Server (10.0.5.13)', mitre: 'T1114 - Email Collection', type: 'Data collection / exfil target' },
];

const ANALYSIS = {
  terminal: {
    type: 'Internal Spearphishing',
    mitre: 'T1534',
    reason: [
      "Lobby's Kiosk and Reception PC 2 share the same admin account.",
      'The memo on 10.0.3.20 stored the saved passwords of Executive PC 2.',
    ],
    target: 'The attack was aimed at the Backup Server of the server floor, because of the presence of backup files referenced in the script.',
    steps: STEPS_TERMINAL,
  },
  hardware: {
    type: 'Cloned-Badge Intrusion -> SSH Cloud Pivot',
    mitre: 'T1078 + T1021.004',
    reason: [
      'A cloned RFID badge (UID BA:0D:A2:16) authenticated at the Lobby and Floor-2 readers, granting physical footholds.',
      'The Termux client used the leaked cloud_srvr.pem key to SSH into the Floor-3 Cloud Gateway and pivot inward.',
    ],
    target: 'Propagation reached the Domain Controller (10.0.5.2) and Mail Server (10.0.5.13) on the server floor - the crown-jewel identity and mail infrastructure.',
    steps: STEPS_HARDWARE,
  },
};

const TELEM_STYLE = { info: 'text-slate-400', event: 'text-cyan-200', auth: 'text-amber-300 font-semibold' };

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

export default function SabreDefensePanel({ score, scoreMode, telemetry = [], preempt, alerts = [], analysisKind, reconstructing }) {
  const [showDetails, setShowDetails] = useState(false);
  const cfg = analysisKind ? ANALYSIS[analysisKind] : null;

  return (
    <>
    <div
      className="absolute right-4 top-[70px] bottom-4 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-red-500/30 shadow-2xl backdrop-blur-xl"
      style={{ background: 'linear-gradient(180deg, rgba(40,10,12,0.72), rgba(20,8,10,0.66))' }}
      data-testid="sabre-defense-panel"
    >
      <div className="flex items-center gap-2.5 border-b border-red-500/25 bg-red-500/10 px-4 py-3">
        <ShieldAlert className="h-5 w-5 text-red-300" />
        <div>
          <h3 className="font-tech text-sm font-bold tracking-widest text-white">SABRE DEFENSE</h3>
          <p className="text-[10px] text-red-200/70">Auto-Defense active · monitoring telemetry</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
        <ScoreBadge score={score} mode={scoreMode} />

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
                : telemetry.map((t) => <div key={t.id} className={TELEM_STYLE[t.kind] || 'text-slate-400'}>{t.text}</div>)
            )}
          </div>
        </div>

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

        {reconstructing && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-red-200" data-testid="sabre-reconstructing">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[11px]">Reconstructing potential attack path...</span>
          </div>
        )}

        {cfg && (
          <div className="space-y-2.5 rounded-xl border border-red-500/35 bg-black/30 p-3" data-testid="sabre-analysis">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-red-300" />
              <h4 className="font-tech text-xs font-bold tracking-widest text-white">ATTACK RECONSTRUCTED</h4>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400">Attack type:</span>
                <span className="rounded-md bg-red-500/25 px-2 py-0.5 font-bold text-red-200 ring-1 ring-red-400/40" data-testid="sabre-analysis-type">{cfg.type}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400">MITRE ATT&amp;CK ID:</span>
                <span className="rounded bg-slate-700/60 px-2 py-0.5 font-mono font-semibold text-cyan-200">{cfg.mitre}</span>
              </div>
            </div>

            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-red-200/70">Potential reason</p>
              <ul className="list-disc space-y-1 pl-4 text-[11.5px] leading-snug text-slate-300">
                {cfg.reason.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-red-200/70">Target and purpose</p>
              <p className="text-[11.5px] leading-snug text-slate-300">{cfg.target}</p>
            </div>

            <button
              onClick={() => setShowDetails(true)}
              data-testid="sabre-show-details-btn"
              className="flex w-full items-center justify-between rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-700"
            >
              <span>Show more details</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>

    {showDetails && cfg && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" data-testid="sabre-details-modal">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
        <div className="relative flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-red-500/40 bg-[#140809] shadow-2xl">
          <div className="flex items-center justify-between border-b border-red-500/25 bg-red-500/10 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Crosshair className="h-5 w-5 text-red-300" />
              <div>
                <h3 className="font-tech text-sm font-bold tracking-widest text-white">ATTACK STEP BREAKDOWN</h3>
                <p className="text-[10px] text-red-200/70">Reconstructed kill chain · MITRE ATT&amp;CK mapping</p>
              </div>
            </div>
            <button onClick={() => setShowDetails(false)} data-testid="sabre-details-close" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-5" data-testid="sabre-step-details">
            {cfg.steps.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-700/70 bg-black/40 p-3.5">
                <p className="font-mono text-[13px] font-bold text-white">Step {i + 1} &mdash; <span className="text-cyan-200">{s.cmd}</span></p>
                <p className="mt-2 text-[13px] font-medium leading-snug text-slate-200">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">MITRE: </span>{s.mitre}
                </p>
                <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px]">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attack type:</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[12.5px] font-bold text-amber-100 ring-1 ring-amber-400/40">{s.type}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

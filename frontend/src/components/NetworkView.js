import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Network, Monitor, Wifi, Router, Printer, Camera, ScanLine,
  HardDrive, Cloud, Server, Boxes, ShieldAlert,
} from 'lucide-react';
import { getFloorDevices } from '../data/floorDevices';
import useDefenseEngine, { HW_PATH } from '../hooks/useDefenseEngine';
import SabreDefensePanel from './SabreDefensePanel';
import TelemetryPanel from './TelemetryPanel';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const COLOR = {
  computer: '#56d6e8', kiosk: '#8be7f2', badge: '#ffb454', camera: '#ff7a5c',
  printer: '#9fb2c0', wifi: '#53e0a0', switch: '#4aa8ff', coreswitch: '#38a0ff',
  filestore: '#93a7ba', cloud: '#39d6c4', devserver: '#7d8bf0', server: '#4de0b0',
  domain: '#cf6bff', firewall: '#ff5a5a',
};

const ICON = {
  computer: Monitor, kiosk: Monitor, badge: ScanLine, camera: Camera,
  printer: Printer, wifi: Wifi, switch: Router, coreswitch: Router,
  filestore: HardDrive, cloud: Cloud, devserver: Server, server: Server,
  domain: Boxes, firewall: ShieldAlert,
};

const ORDER = [5, 4, 3, 2, 1]; // Core (F5) at the top, cascading down
const CENTER_X = 520;
const GAP = 64;       // horizontal spacing between devices in a row
const ROW_GAP = 176;  // vertical spacing between switch groups
const TOP = 74;       // y of the top (core) switch
const FAN = 82;       // vertical drop from a switch to its device row
const LABEL_X = 60;

function buildLayout() {
  const nodes = [];
  const edges = [];
  const labels = [];
  const hubYByFloor = {};
  let core = null;
  let g = 0;
  let lastHubY = TOP;

  ORDER.forEach((f) => {
    let { devices, links } = getFloorDevices(f, 1);
    if (f === 2) {
      // Floor 2 shows only 5 PCs in the network view.
      let pc = 0;
      devices = devices.filter((d) => (d.type === 'computer' ? (pc += 1) <= 5 : true));
      // The Wi-Fi AP and Badge Reader are devices — hang them off the Floor-2 switch
      // (previously they formed a stray hub row that looked like a dangling link).
      const sw = devices.find((d) => d.type === 'switch');
      const wifi = devices.find((d) => d.type === 'wifi');
      if (sw && wifi) {
        wifi.isHub = false;
        links = links.map((l) => (l.hubId === wifi.id ? { ...l, hubId: sw.id } : l));
        links.push({ fromId: wifi.id, hubId: sw.id });
      }
    }
    const hubs = devices.filter((d) => d.isHub);
    const eps = devices.filter((d) => !d.isHub);

    hubs.forEach((h, hi) => {
      const hubY = TOP + g * ROW_GAP;
      const rowY = hubY + FAN;
      if (hi === 0) { labels.push({ f, y: hubY }); hubYByFloor[f] = hubY; }

      if (h.type === 'coreswitch') core = { x: CENTER_X, y: hubY };
      else nodes.push({ ...h, x: CENTER_X, y: hubY, floor: f });

      const list = eps.filter((d) => {
        const lk = links.find((l) => l.fromId === d.id);
        return lk ? lk.hubId === h.id : hubs[0].id === h.id;
      });
      const total = (list.length - 1) * GAP;
      list.forEach((d, idx) => {
        const x = CENTER_X - total / 2 + idx * GAP;
        nodes.push({ ...d, x, y: rowY, floor: f });
        edges.push({ x1: CENTER_X, y1: hubY, x2: x, y2: rowY, ip: d.ip, floor: f });
      });

      lastHubY = hubY;
      g += 1;
    });
  });

  edges.push({ x1: CENTER_X, y1: TOP, x2: CENTER_X, y2: lastHubY, backbone: true });
  return { nodes, edges, labels, core, hubYByFloor, width: 1040, height: lastHubY + FAN + 90 };
}

function Chip({ x, y, type, title, testid, big, compromised }) {
  const base = COLOR[type] || '#9fb2c0';
  const c = compromised ? '#ff3b3b' : base;
  const Icon = ICON[type] || Monitor;
  const size = big ? 52 : 40;
  return (
    <div
      data-testid={testid}
      data-compromised={compromised ? 'true' : 'false'}
      title={title}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl border bg-[#0b1620] transition-transform hover:scale-110 ${compromised ? 'sabre-compromised z-10' : ''}`}
      style={{ left: x, top: y, width: size, height: size, borderColor: c, boxShadow: compromised ? undefined : `0 0 14px -4px ${c}` }}
    >
      {compromised && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-xl border-2 border-red-500/70 animate-ping" />
          <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-red-600 px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wider text-white shadow">Compromised</span>
        </>
      )}
      <Icon style={{ color: c }} width={big ? 26 : 20} height={big ? 26 : 20} />
    </div>
  );
}

export default function NetworkView({ onClose, compromisedIps = [], autoDefense = true, onResetPath, attackLog = [] }) {
  const { nodes, edges, labels, core, hubYByFloor, width, height } = useMemo(buildLayout, []);

  // Poll the backend event bridge (ESP32 RFID + Termux phone). Only events that
  // arrive after entering the Network View drive reactions (existing ones are baselined).
  const [demoEvents, setDemoEvents] = useState([]);
  const seenRef = useRef(null);
  useEffect(() => {
    if (!BACKEND) return undefined;
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch(`${BACKEND}/api/demo/events`);
        const data = await r.json();
        if (stop) return;
        const evs = data.events || [];
        if (seenRef.current === null) { seenRef.current = new Set(evs.map((e) => e.id)); return; }
        const fresh = evs.filter((e) => !seenRef.current.has(e.id));
        if (fresh.length) { fresh.forEach((e) => seenRef.current.add(e.id)); setDemoEvents((prev) => [...prev, ...fresh]); }
      } catch (e) { /* transient network error - keep polling */ }
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  const engine = useDefenseEngine(attackLog, demoEvents, autoDefense);
  const { reconStage, litIps, hwRevealed } = engine;

  const handleReset = useCallback(() => {
    onResetPath?.();
    setDemoEvents([]);
    if (BACKEND) fetch(`${BACKEND}/api/demo/reset`, { method: 'POST' }).catch(() => {});
  }, [onResetPath]);

  // Node lookup by IP (for the reconstructed-path overlay).
  const nodeByIp = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { m[n.ip] = n; });
    if (core) m['10.0.5.1'] = core;
    return m;
  }, [nodes, core]);
  const fs1 = nodeByIp['10.0.3.19'];   // File Storage Unit 1 (F3)
  const fs2 = nodeByIp['10.0.3.20'];   // File Storage Unit 2 (F3) - the memo share
  const dev = nodeByIp['10.0.4.18'];   // Dev Server 2 (F4)
  const backup = nodeByIp['10.0.5.16']; // Backup Server (F5)
  const kiosk = nodeByIp['10.0.1.10'];  // Lobby Kiosk (F1) - attack origin
  const recep = nodeByIp['10.0.1.12'];  // Reception PC 2 (F1) - first lateral hop

  const show = !autoDefense; // OFF: reveal the actual compromised path in red
  const comp = useMemo(() => new Set(show ? compromisedIps : []), [show, compromisedIps]);
  const hasPath = comp.size > 0;
  // Chips light up for the OFF terminal path AND the hardware-demo lit devices (both modes).
  const chipLit = useMemo(() => { const s = new Set(comp); litIps.forEach((ip) => s.add(ip)); return s; }, [comp, litIps]);

  // Hardware-demo reconstruction: ordered node lookups.
  const hwNodes = useMemo(() => HW_PATH.map((ip) => nodeByIp[ip]).filter(Boolean), [nodeByIp]);

  // Red backbone span: from the highest to the lowest compromised floor hub (grows upward as the attacker ascends).
  const spine = useMemo(() => {
    const ys = [...comp]
      .map((ip) => hubYByFloor[parseInt(String(ip).split('.')[2], 10)])
      .filter((v) => typeof v === 'number');
    if (ys.length < 2) return null;
    return { y1: Math.min(...ys), y2: Math.max(...ys) };
  }, [comp, hubYByFloor]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#070d13]" data-testid="network-view">
      <div className="flex items-center justify-between border-b border-cyan-400/20 bg-slate-900/80 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <Network className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="font-tech text-base font-bold tracking-widest text-white">NETWORK VIEW</h2>
            <p className="text-[11px] text-slate-400">2D topology · every device connects individually to its floor switch · switches uplink to the Core Switch (Floor 5) · hover for details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Attack-path status */}
          {autoDefense ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-emerald-300" data-testid="net-defense-status">
              <ShieldAlert className="h-3.5 w-3.5" /> Auto-Defense ON · SABRE monitoring
            </span>
          ) : hasPath ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-red-300 sabre-compromised" data-testid="net-attack-status">
              <ShieldAlert className="h-3.5 w-3.5" /> Attack path · {comp.size} hop{comp.size > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="rounded-lg border border-slate-600 bg-slate-800/60 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-300" data-testid="net-defense-status">
              Auto-Defense OFF · awaiting activity
            </span>
          )}
          <button
            onClick={handleReset}
            data-testid="reset-attack-path-btn"
            disabled={compromisedIps.length === 0 && demoEvents.length === 0}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset attack path
          </button>
          <button onClick={onClose} data-testid="network-view-close" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-auto"
        style={{
          backgroundColor: '#0b1219',
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        data-testid="network-canvas"
      >
        <div className="relative" style={{ width, height }}>
          <svg width={width} height={height} className="absolute inset-0">
            {labels.map((l) => (
              <text key={`lbl-${l.f}`} x={LABEL_X} y={l.y + 4} fill="#5b7183" fontSize="12" fontFamily="monospace" fontWeight="bold">{`FLOOR ${l.f}`}</text>
            ))}
            {edges.map((e, idx) => {
              const hot = !e.backbone && comp.has(e.ip);
              return (
                <line
                  key={idx}
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={hot ? '#ff3b3b' : e.backbone ? '#38a0ff' : '#66e0ff'}
                  strokeWidth={hot ? 2.6 : e.backbone ? 2.4 : 1.3}
                  strokeOpacity={hot ? 0.95 : e.backbone ? 0.9 : 0.5}
                  strokeLinecap="round"
                  style={hot ? { filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.9))' } : undefined}
                />
              );
            })}
            {/* Red backbone spine — traces the vertical route across compromised floors */}
            {spine && (
              <line
                x1={CENTER_X} y1={spine.y1} x2={CENTER_X} y2={spine.y2}
                stroke="#ff3b3b" strokeWidth={3} strokeOpacity={0.95} strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 5px rgba(255,59,59,0.95))' }}
                data-testid="net-attack-spine"
              />
            )}

            {/* Auto-Defense ON: reconstructed potential attack path (staged, dotted) */}
            {autoDefense && reconStage >= 2 && fs1 && (
              <circle cx={fs1.x} cy={fs1.y} r={27} fill="none" stroke="#ff6b6b" strokeWidth={1.8} className="sabre-dash sabre-ring" data-testid="recon-ring-fs1" />
            )}
            {autoDefense && reconStage >= 2 && fs2 && (
              <circle cx={fs2.x} cy={fs2.y} r={27} fill="none" stroke="#ff6b6b" strokeWidth={1.8} className="sabre-dash sabre-ring" data-testid="recon-ring-fs2" />
            )}
            {/* Origin of the chain: Lobby Kiosk -> Reception PC 2 (F1) -> File Storage (F3) */}
            {autoDefense && reconStage >= 2 && kiosk && (
              <circle cx={kiosk.x} cy={kiosk.y} r={27} fill="none" stroke="#ff6b6b" strokeWidth={1.8} className="sabre-dash sabre-ring" data-testid="recon-ring-kiosk" />
            )}
            {autoDefense && reconStage >= 2 && recep && (
              <circle cx={recep.x} cy={recep.y} r={27} fill="none" stroke="#ff6b6b" strokeWidth={1.8} className="sabre-dash sabre-ring" data-testid="recon-ring-recep" />
            )}
            {autoDefense && reconStage >= 2 && kiosk && recep && (
              <line x1={kiosk.x} y1={kiosk.y} x2={recep.x} y2={recep.y} stroke="#ff3b3b" strokeWidth={2} className="sabre-dash" style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.9))' }} data-testid="recon-line-origin" />
            )}
            {autoDefense && reconStage >= 2 && recep && fs2 && (
              <line x1={recep.x} y1={recep.y} x2={fs2.x} y2={fs2.y} stroke="#ff3b3b" strokeWidth={2} className="sabre-dash" style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.9))' }} data-testid="recon-line-recep-fs" />
            )}
            {autoDefense && reconStage >= 2 && recep && fs1 && (
              <line x1={recep.x} y1={recep.y} x2={fs1.x} y2={fs1.y} stroke="#ff5a5a" strokeWidth={1.6} strokeOpacity={0.7} className="sabre-dash" />
            )}
            {autoDefense && reconStage >= 3 && fs1 && dev && (
              <line x1={fs1.x} y1={fs1.y} x2={dev.x} y2={dev.y} stroke="#ff5a5a" strokeWidth={1.6} strokeOpacity={0.75} className="sabre-dash" />
            )}
            {autoDefense && reconStage >= 3 && fs2 && dev && (
              <line x1={fs2.x} y1={fs2.y} x2={dev.x} y2={dev.y} stroke="#ff3b3b" strokeWidth={2} className="sabre-dash" style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.9))' }} data-testid="recon-line-dev" />
            )}
            {autoDefense && reconStage >= 3 && dev && (
              <circle cx={dev.x} cy={dev.y} r={27} fill="none" stroke="#ff6b6b" strokeWidth={1.8} className="sabre-dash sabre-ring" />
            )}
            {autoDefense && reconStage >= 4 && dev && backup && (
              <line x1={dev.x} y1={dev.y} x2={backup.x} y2={backup.y} stroke="#ff3b3b" strokeWidth={2} className="sabre-dash" style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.9))' }} data-testid="recon-line-backup" />
            )}
            {autoDefense && reconStage >= 4 && backup && (
              <circle cx={backup.x} cy={backup.y} r={27} fill="none" stroke="#ff3b3b" strokeWidth={2} className="sabre-dash sabre-ring" data-testid="recon-ring-backup" />
            )}

            {/* Hardware demo (Auto-Defense ON): staged lateral-path trace across revealed nodes */}
            {autoDefense && hwRevealed > 1 && hwNodes.slice(0, hwRevealed).map((n, i) => {
              if (i === 0) return null;
              const p = hwNodes[i - 1];
              return (
                <line
                  key={`hw-line-${i}`}
                  x1={p.x} y1={p.y} x2={n.x} y2={n.y}
                  stroke="#ff3b3b" strokeWidth={2} className="sabre-dash"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.9))' }}
                  data-testid={`hw-recon-line-${i}`}
                />
              );
            })}
            {autoDefense && hwNodes.slice(0, hwRevealed).map((n, i) => (
              <circle key={`hw-ring-${i}`} cx={n.x} cy={n.y} r={27} fill="none" stroke="#ff5a5a" strokeWidth={1.8} className="sabre-dash sabre-ring" data-testid={`hw-recon-ring-${i}`} />
            ))}
          </svg>

          {core && <Chip x={core.x} y={core.y} type="coreswitch" title="Core Switch (Floor 5)" testid="net-node-core" big compromised={chipLit.has('10.0.5.1')} />}
          {nodes.map((d) => (
            <Chip key={d.id} x={d.x} y={d.y} type={d.type} title={`${d.name}\n${d.ip}\n${d.relationship}`} testid={`net-node-${d.id}`} compromised={chipLit.has(d.ip)} />
          ))}
        </div>
      </div>

      {/* Auto-Defense ON: live SABRE defense panel · OFF: live telemetry panel */}
      {autoDefense
        ? <SabreDefensePanel {...engine} />
        : <TelemetryPanel telemetry={engine.telemetry} />}
    </div>
  );
}

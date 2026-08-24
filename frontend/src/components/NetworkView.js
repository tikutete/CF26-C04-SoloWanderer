import React, { useMemo } from 'react';
import {
  X, Network, Monitor, Wifi, Router, Printer, Camera, ScanLine,
  HardDrive, Cloud, Server, Boxes, ShieldAlert,
} from 'lucide-react';
import { getFloorDevices } from '../data/floorDevices';

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
  let core = null;
  let g = 0;
  let lastHubY = TOP;

  ORDER.forEach((f) => {
    let { devices, links } = getFloorDevices(f, 1);
    if (f === 2) {
      // Floor 2 shows only 5 PCs in the network view.
      let pc = 0;
      devices = devices.filter((d) => (d.type === 'computer' ? (pc += 1) <= 5 : true));
    }
    const hubs = devices.filter((d) => d.isHub);
    const eps = devices.filter((d) => !d.isHub);

    hubs.forEach((h, hi) => {
      const hubY = TOP + g * ROW_GAP;
      const rowY = hubY + FAN;
      if (hi === 0) labels.push({ f, y: hubY });

      if (h.type === 'coreswitch') core = { x: CENTER_X, y: hubY };
      else nodes.push({ ...h, x: CENTER_X, y: hubY });

      const list = eps.filter((d) => {
        const lk = links.find((l) => l.fromId === d.id);
        return lk ? lk.hubId === h.id : hubs[0].id === h.id;
      });
      const total = (list.length - 1) * GAP;
      list.forEach((d, idx) => {
        const x = CENTER_X - total / 2 + idx * GAP;
        nodes.push({ ...d, x, y: rowY });
        edges.push({ x1: CENTER_X, y1: hubY, x2: x, y2: rowY });
      });

      lastHubY = hubY;
      g += 1;
    });
  });

  edges.push({ x1: CENTER_X, y1: TOP, x2: CENTER_X, y2: lastHubY, backbone: true });
  return { nodes, edges, labels, core, width: 1040, height: lastHubY + FAN + 90 };
}

function Chip({ x, y, type, title, testid, big }) {
  const c = COLOR[type] || '#9fb2c0';
  const Icon = ICON[type] || Monitor;
  const size = big ? 52 : 40;
  return (
    <div
      data-testid={testid}
      title={title}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl border bg-[#0b1620] transition-transform hover:scale-110"
      style={{ left: x, top: y, width: size, height: size, borderColor: c, boxShadow: `0 0 14px -4px ${c}` }}
    >
      <Icon style={{ color: c }} width={big ? 26 : 20} height={big ? 26 : 20} />
    </div>
  );
}

export default function NetworkView({ onClose }) {
  const { nodes, edges, labels, core, width, height } = useMemo(buildLayout, []);

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
        <button onClick={onClose} data-testid="network-view-close" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700">
          <X className="h-4 w-4" />
        </button>
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
            {edges.map((e, idx) => (
              <line key={idx} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.backbone ? '#38a0ff' : '#66e0ff'} strokeWidth={e.backbone ? 2.4 : 1.3} strokeOpacity={e.backbone ? 0.9 : 0.5} strokeLinecap="round" />
            ))}
          </svg>

          {core && <Chip x={core.x} y={core.y} type="coreswitch" title="Core Switch (Floor 5)" testid="net-node-core" big />}
          {nodes.map((d) => (
            <Chip key={d.id} x={d.x} y={d.y} type={d.type} title={`${d.name}\n${d.ip}\n${d.relationship}`} testid={`net-node-${d.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

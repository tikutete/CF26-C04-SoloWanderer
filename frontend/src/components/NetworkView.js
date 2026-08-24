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

const FLOORS = [1, 2, 3, 4, 5];
const PAD = 80;
const COL_W = 240;
const LANE_GAP = 110;
const EP_DX = 56;
const NODE_H = 30;
const CORE_Y = 44;
const BUS_Y = 120;
const HUB_Y = 180;
const EP_START = 250;
const EP_GAP = 46;

function buildLayout() {
  const nodes = [];
  const edges = [];
  const width = PAD * 2 + COL_W * 5;
  const coreX = PAD + COL_W * 4 + COL_W / 2; // core sits above Floor 5
  const coreCY = CORE_Y + NODE_H / 2;
  let maxY = EP_START;

  FLOORS.forEach((f, i) => {
    const { devices, links } = getFloorDevices(f, 1);
    const hubs = devices.filter((d) => d.isHub);
    const eps = devices.filter((d) => !d.isHub);
    const colCenter = PAD + COL_W * i + COL_W / 2;

    if (f === 5) {
      // Every F5 device connects individually to the Core Switch.
      eps.forEach((d, idx) => {
        const y = EP_START + idx * EP_GAP;
        const x = colCenter + EP_DX;
        nodes.push({ ...d, x, y });
        edges.push({ x1: coreX, y1: coreCY, x2: x, y2: y + NODE_H / 2 });
        maxY = Math.max(maxY, y);
      });
      return;
    }

    const laneX = {};
    hubs.forEach((h, hi) => {
      const lx = colCenter + (hi - (hubs.length - 1) / 2) * LANE_GAP;
      laneX[h.id] = lx;
      nodes.push({ ...h, x: lx, y: HUB_Y });
      edges.push({ x1: lx, y1: BUS_Y, x2: lx, y2: HUB_Y + NODE_H / 2 });
    });
    const groups = {};
    eps.forEach((d) => {
      const lk = links.find((l) => l.fromId === d.id);
      const hid = lk ? lk.hubId : hubs[0].id;
      (groups[hid] = groups[hid] || []).push(d);
    });
    Object.entries(groups).forEach(([hid, list]) => {
      const lx = laneX[hid] ?? colCenter;
      const hubCY = HUB_Y + NODE_H / 2;
      list.forEach((d, idx) => {
        const y = EP_START + idx * EP_GAP;
        const x = lx + EP_DX;
        nodes.push({ ...d, x, y });
        // Individual line from the floor switch to each device (star, not chained).
        edges.push({ x1: lx, y1: hubCY, x2: x, y2: y + NODE_H / 2 });
        maxY = Math.max(maxY, y);
      });
    });
  });

  const core = { x: coreX, y: CORE_Y };
  edges.push({ x1: coreX, y1: coreCY, x2: coreX, y2: BUS_Y, backbone: true });
  edges.push({ x1: PAD + COL_W / 2, y1: BUS_Y, x2: coreX, y2: BUS_Y, backbone: true });

  return { nodes, edges, core, width, height: maxY + NODE_H + 70 };
}

function Chip({ x, y, type, title, testid, big }) {
  const c = COLOR[type] || '#9fb2c0';
  const Icon = ICON[type] || Monitor;
  const size = big ? 52 : 40;
  return (
    <div
      data-testid={testid}
      title={title}
      className="group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl border bg-[#0b1620] transition-transform hover:scale-110"
      style={{ left: x, top: y, width: size, height: size, borderColor: c, boxShadow: `0 0 14px -4px ${c}` }}
    >
      <Icon style={{ color: c }} width={big ? 26 : 20} height={big ? 26 : 20} />
    </div>
  );
}

export default function NetworkView({ onClose }) {
  const { nodes, edges, core, width, height } = useMemo(buildLayout, []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#070d13]" data-testid="network-view">
      <div className="flex items-center justify-between border-b border-cyan-400/20 bg-slate-900/80 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <Network className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="font-tech text-base font-bold tracking-widest text-white">NETWORK VIEW</h2>
            <p className="text-[11px] text-slate-400">2D topology · all floors · switches uplink to Core Switch (Floor 5) · hover a device for details</p>
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
            {FLOORS.map((f, i) => (
              <text key={`lbl-${f}`} x={PAD + COL_W * i + COL_W / 2} y={CORE_Y - 16} textAnchor="middle" fill="#5b7183" fontSize="12" fontFamily="monospace" fontWeight="bold">{`FLOOR ${f}`}</text>
            ))}
            {edges.map((e, idx) => (
              <line key={idx} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.backbone ? '#38a0ff' : '#66e0ff'} strokeWidth={e.backbone ? 2.4 : 1.3} strokeOpacity={e.backbone ? 0.9 : 0.5} strokeLinecap="round" />
            ))}
          </svg>

          <Chip x={core.x} y={core.y + NODE_H / 2} type="coreswitch" title="Core Switch (Floor 5)" testid="net-node-core" big />
          {nodes.map((d) => (
            <Chip key={d.id} x={d.x} y={d.y + NODE_H / 2} type={d.type} title={`${d.name}\n${d.ip}\n${d.relationship}`} testid={`net-node-${d.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

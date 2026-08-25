// Shared 2D topology layout for the Network View and the Sandbox View.
// Mirrors the original NetworkView.buildLayout so the Sandbox View is visually identical.
import {
  Monitor, Wifi, Router, Printer, Camera, ScanLine,
  HardDrive, Cloud, Server, Boxes, ShieldAlert,
} from 'lucide-react';
import { getFloorDevices } from './floorDevices';

export const COLOR = {
  computer: '#56d6e8', kiosk: '#8be7f2', badge: '#ffb454', camera: '#ff7a5c',
  printer: '#9fb2c0', wifi: '#53e0a0', switch: '#4aa8ff', coreswitch: '#38a0ff',
  filestore: '#93a7ba', cloud: '#39d6c4', devserver: '#7d8bf0', server: '#4de0b0',
  domain: '#cf6bff', firewall: '#ff5a5a',
};

export const ICON = {
  computer: Monitor, kiosk: Monitor, badge: ScanLine, camera: Camera,
  printer: Printer, wifi: Wifi, switch: Router, coreswitch: Router,
  filestore: HardDrive, cloud: Cloud, devserver: Server, server: Server,
  domain: Boxes, firewall: ShieldAlert,
};

export const ORDER = [5, 4, 3, 2, 1]; // Core (F5) at the top, cascading down
export const CENTER_X = 520;
export const GAP = 64;       // horizontal spacing between devices in a row
export const ROW_GAP = 176;  // vertical spacing between switch groups
export const TOP = 74;       // y of the top (core) switch
export const FAN = 82;       // vertical drop from a switch to its device row
export const LABEL_X = 60;

export function buildLayout() {
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
      // The Wi-Fi AP and Badge Reader hang off the Floor-2 switch.
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

      if (h.type === 'coreswitch') core = { x: CENTER_X, y: hubY, ...h, floor: f };
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

// The network hub a floor uses to uplink. Prefer the Wi-Fi AP, else the switch,
// else the first hub. Floor 5 resolves to the Core Switch node.
export function getFloorHubNode(nodes, core, floor) {
  if (floor >= 5) return core;
  const hubs = nodes.filter((n) => n.floor === floor && n.isHub);
  if (!hubs.length) return null;
  return hubs.find((h) => h.type === 'wifi') || hubs.find((h) => h.type === 'switch') || hubs[0];
}

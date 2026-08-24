// Per-floor device + network topology model for the SABRE Explore view.
// Positions are laid out as a floating "network map" above each floor's furniture.
// Info (IP, network relationship, physical location) is surfaced in the inspector panel.

const CORE = 'Core Switch (Floor 5)';

export const DEVICE_KIND = {
  computer: 'Workstation',
  kiosk: 'Interactive Kiosk',
  badge: 'Badge Reader',
  camera: 'IP Camera',
  printer: 'Network Printer',
  wifi: 'Wi-Fi Access Point',
  switch: 'Network Switch',
  coreswitch: 'Core Switch',
  filestore: 'File Storage Unit',
  cloud: 'Cloud Server',
  devserver: 'Dev Server',
  server: 'Server',
  domain: 'Domain Controller',
  firewall: 'Firewall Gateway',
};

const SPECS = {
  1: {
    floorName: 'Lobby / Reception',
    hubs: [{ id: 'wifi', type: 'wifi', name: 'Lobby Wi-Fi AP' }],
    endpoints: [
      { hub: 'wifi', type: 'kiosk', name: 'Lobby Kiosk' },
      { hub: 'wifi', type: 'computer', name: 'Reception PC 1' },
      { hub: 'wifi', type: 'computer', name: 'Reception PC 2' },
      { hub: 'wifi', type: 'badge', name: 'Entrance Badge Reader' },
      { hub: 'wifi', type: 'camera', name: 'Lobby Camera 1' },
      { hub: 'wifi', type: 'camera', name: 'Lobby Camera 2' },
    ],
  },
  2: {
    floorName: 'Open Office / General Staff',
    hubs: [
      { id: 'sw', type: 'switch', name: 'Floor-2 Access Switch' },
      { id: 'wifi', type: 'wifi', name: 'Floor-2 Wi-Fi AP' },
    ],
    endpoints: [
      ...Array.from({ length: 10 }, (_, i) => ({ hub: 'sw', type: 'computer', name: `Workstation ${i + 1}` })),
      ...Array.from({ length: 4 }, (_, i) => ({ hub: 'sw', type: 'printer', name: `Printer ${i + 1}` })),
      { hub: 'wifi', type: 'badge', name: 'Floor-2 Badge Reader' },
    ],
  },
  3: {
    floorName: 'Departmental Floor / HR & Sales',
    hubs: [{ id: 'sw', type: 'switch', name: 'Floor-3 Access Switch' }],
    endpoints: [
      { hub: 'sw', type: 'badge', name: 'Floor-3 Badge Reader' },
      ...Array.from({ length: 6 }, (_, i) => ({ hub: 'sw', type: 'computer', name: `Workstation ${i + 1}` })),
      { hub: 'sw', type: 'printer', name: 'Printer 1' },
      { hub: 'sw', type: 'printer', name: 'Printer 2' },
      { hub: 'sw', type: 'filestore', name: 'File Storage Unit 1' },
      { hub: 'sw', type: 'filestore', name: 'File Storage Unit 2' },
      { hub: 'sw', type: 'cloud', name: 'Cloud Storage Gateway' },
    ],
  },
  4: {
    floorName: 'Executive Floor',
    hubs: [
      { id: 'sw1', type: 'switch', name: 'Floor-4 Switch A' },
      { id: 'sw2', type: 'switch', name: 'Floor-4 Switch B' },
    ],
    endpoints: [
      { hub: 'sw1', type: 'badge', name: 'Floor-4 Badge Reader' },
      ...Array.from({ length: 6 }, (_, i) => ({ hub: 'sw1', type: 'computer', name: `Exec Workstation ${i + 1}` })),
      { hub: 'sw2', type: 'devserver', name: 'Dev Server 1' },
      { hub: 'sw2', type: 'devserver', name: 'Dev Server 2' },
      { hub: 'sw2', type: 'filestore', name: 'File Storage Unit 1' },
      { hub: 'sw2', type: 'filestore', name: 'File Storage Unit 2' },
      { hub: 'sw2', type: 'cloud', name: 'Cloud Server 1' },
      { hub: 'sw2', type: 'cloud', name: 'Cloud Server 2' },
    ],
  },
  5: {
    floorName: 'Server Room / IT',
    hubs: [{ id: 'core', type: 'coreswitch', name: 'Core Switch' }],
    endpoints: [
      { hub: 'core', type: 'firewall', name: 'Firewall Gateway' },
      { hub: 'core', type: 'domain', name: 'Domain Controller' },
      { hub: 'core', type: 'badge', name: 'Server Room Badge Reader' },
      { hub: 'core', type: 'server', name: 'Finance Server' },
      { hub: 'core', type: 'server', name: 'File Server' },
      { hub: 'core', type: 'server', name: 'Mail Server' },
      { hub: 'core', type: 'server', name: 'Web Server' },
      { hub: 'core', type: 'server', name: 'Database Server' },
      { hub: 'core', type: 'server', name: 'Backup Server' },
    ],
  },
};

const relationshipFor = (type, floor, parentName) => {
  switch (type) {
    case 'coreswitch':
      return 'Network backbone → aggregates all floor switches → routed via Firewall Gateway';
    case 'firewall':
      return 'Perimeter gateway → routes Core Switch traffic to/from the Internet';
    case 'domain':
      return 'Connected to Core Switch → authenticates all domain endpoints';
    case 'server':
      return 'Connected to Core Switch → serves Floor-5 infrastructure';
    case 'wifi':
      return `Wireless access point for Floor-${floor} → uplinks to ${CORE}`;
    case 'switch':
      return `Aggregates Floor-${floor} wired devices → uplinks to ${CORE}`;
    default:
      if (floor === 5) return 'Connected to Core Switch → routed via Firewall Gateway';
      return `Connected to ${parentName} → uplinks to ${CORE}`;
  }
};

export function getFloorDevices(floorNumber, floorHeight) {
  const spec = SPECS[floorNumber];
  if (!spec) return { devices: [], links: [], floorName: '' };

  const baseY = (floorNumber - 1) * floorHeight;
  const yNode = baseY + 3.0;
  const yHub = baseY + 4.0;
  const location = `Floor ${floorNumber} · ${spec.floorName}`;

  const counters = { ep: 9, sw: 0 };
  const ipFor = (type) => {
    if (type === 'coreswitch') return '10.0.5.1';
    if (type === 'firewall') return '10.0.5.254';
    if (type === 'domain') return '10.0.5.2';
    if (type === 'wifi') return `10.0.${floorNumber}.254`;
    if (type === 'switch') { counters.sw += 1; return `10.0.${floorNumber}.${counters.sw}`; }
    counters.ep += 1;
    return `10.0.${floorNumber}.${counters.ep}`;
  };

  const devices = [];
  const hubPos = {};
  const hubMeta = {};
  let seq = 0;
  const nextId = (type) => `f${floorNumber}-${type}-${(seq += 1)}`;

  // Hubs across the back row.
  const hn = spec.hubs.length;
  spec.hubs.forEach((hub, i) => {
    const x = hn === 1 ? 0 : (i / (hn - 1) - 0.5) * 8;
    const position = [x, yHub, -3.8];
    const meta = {
      id: nextId(hub.type),
      type: hub.type,
      kind: DEVICE_KIND[hub.type],
      name: hub.name,
      ip: ipFor(hub.type),
      relationship: relationshipFor(hub.type, floorNumber),
      location,
      position,
      isHub: true,
    };
    hubPos[hub.id] = position;
    hubMeta[hub.id] = meta;
    devices.push(meta);
  });

  // Endpoints laid out in a roomy grid in front of the hubs.
  const eps = spec.endpoints;
  const perRow = 5;
  const spacingX = 2.75;
  const spacingZ = 2.55;
  const links = [];
  eps.forEach((e, idx) => {
    const row = Math.floor(idx / perRow);
    const colCount = Math.min(perRow, eps.length - row * perRow);
    const col = idx - row * perRow;
    const x = (col - (colCount - 1) / 2) * spacingX;
    const z = -1.3 + row * spacingZ;
    const position = [x, yNode, z];
    const parent = hubMeta[e.hub];
    const meta = {
      id: nextId(e.type),
      type: e.type,
      kind: DEVICE_KIND[e.type],
      name: e.name,
      ip: ipFor(e.type),
      relationship: relationshipFor(e.type, floorNumber, parent?.name),
      location,
      position,
      isHub: false,
    };
    devices.push(meta);
    links.push({ fromId: meta.id, hubId: parent?.id, from: position, to: hubPos[e.hub] });
  });

  return { devices, links, floorName: spec.floorName };
}

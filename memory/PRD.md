# SABRE — Spatial Attack Behaviour Reconstruction Engine

## Problem Statement
Interactive 3D visualization of a 5-floor office tower used to narrate a cyber-attack path.
Each floor is clickable, highlightable, and explorable. Branded "SABRE 🎯" with an Orbitron
techno font in blue/white.

## Stack
- Frontend: React + Three.js (WebGL, OrbitControls), Tailwind, shadcn/ui, lucide-react.
- Backend: FastAPI + MongoDB (currently unused; all logic is frontend/3D state).

## Core Requirements (implemented)
- 5-floor tower with glass facade, office interiors, 15 PCs per floor (3 rows of 5), desks, chairs, plants.
- Click a floor to highlight + show cyber-attack-themed details (Lobby, Open office, Departmental, Executive, Server room).
- SABRE branding (Orbitron, blue/white, target emoji) in the top toolbar.

## Iris Transition Feature (implemented — June 2026)
- Reusable `IrisTransition` component (`/app/frontend/src/components/IrisTransition.js`).
  - Imperative API via ref: `irisRef.current.play({ x, y, onCovered, closeDuration, openDuration, holdDuration })`.
  - Cinematic circular iris: black overlay with a shrinking transparent hole toward (x,y), fires
    `onCovered` while fully black (scene swap happens here), then reverse-opens from screen center.
  - Pure black background + subtle cyan (#00E5FF) edge glow. easeInOutCubic. requestAnimationFrame driven.
  - Overlay stays mounted; WebGL renderer is never destroyed — only camera/floor state changes while black.
  - Guarded against re-entry with a ref (not state) to avoid stale-closure no-ops.
- Flow: Overview → click floor → "🎯 Explore Floor X" button → iris → floor scene (camera zoom + floor isolation).
  Floor view → "Return to Building View" button (bottom-center) → reverse iris → overview.
- `BuildingCanvas3D` accepts `viewMode` ('overview'|'floor'); a useEffect reframes the camera and
  isolates/reveals floors. Click handler reports screen position for the iris origin.

### Key learning / gotcha
- The floating SABRE toolbar overlays the top of the 3D canvas. Controls placed at top-left were
  intercepted by the toolbar's H1 (click stolen). Keep floating controls in the bottom-center area.

## Files of reference
- `/app/frontend/src/App.js` — view mode state, iris wiring, explore/return buttons.
- `/app/frontend/src/components/IrisTransition.js` — reusable transition overlay.
- `/app/frontend/src/components/BuildingCanvas3D.js` — 3D scene, camera reframe + floor isolation.
- `/app/frontend/src/components/FloorInspectorPanel.js` — floor details + level pills.
- `/app/frontend/src/components/ControlsToolbar.js` — SABRE header.

## Device / Network Map Feature (implemented — June 2026)
- Explore view now renders an interactive 3D **network device map** per floor (`/app/frontend/src/data/floorDevices.js` + builders in `BuildingCanvas3D.js`).
- Each device is a distinct glowing 3D marker (computer, kiosk, badge, camera, printer, Wi-Fi AP, switch, core switch, file storage, cloud, dev server, server, domain controller, firewall) connected to its hub by thin additive light-blue tubes.
- Clicking a device shows **IP address, network relationship (human path, e.g. "Connected to Floor-2 Switch → uplinks to Core Switch (Floor 5)"), and physical location** in the right inspector panel (`FloorInspectorPanel.js`, `device-inspector-panel`).
- IPs auto-assigned as 10.0.<floor>.<n> (switch .1, Wi-Fi .254, core switch 10.0.5.1, firewall 10.0.5.254, domain controller 10.0.5.2).
- Floor specs: F1 lobby (Wi-Fi + kiosk/reception/badge/cameras), F2 switch+Wi-Fi (10 PCs, 4 printers, badge), F3 switch (badge, 10 PCs, 2 printers, 2 file storage, cloud), F4 2 switches (badge, 6 PCs, 2 dev servers, 2 file storage, 2 cloud), F5 core switch (firewall, domain controller, badge, 6 named servers).
- Amber selected-floor highlight is disabled in Explore view so device colours stand out. Building interior is untouched. Endpoint labels show on hover/select; infrastructure labels always on.
- Verified across all 5 floors via Playwright (device click → panel with correct IP/location) + full iris round-trip; no console errors.

## Telemetry + Toolbar Update (implemented — June 2026)
- Live telemetry feed (`TelemetryFeed.js`) in the right inspector, replacing Power Load & Structural Stability. Streams lines from `/frontend/public/sabre_telemetry.txt` (format `Fx | DEVICE | MSG`), one every random 0.3–1s, prepends a `[HH:MM:SS.mmm]` timestamp, loops back to line 1 at end, and keeps a history. "Show Detailed Telemetry" expands a scrollable log. FAIL messages render red.
- Floor 3 explore view: computers reduced from 10 → 6.
- Toolbar (`ControlsToolbar.js`) stripped of Sunset/Night/Day, Wireframe, and Specs; scene locked to `day` (App sets `timeOfDay='day'`, `wireframeMode=false`). Added beside the SABRE brand: pulsing "Actively reading telemetries / No ongoing threats" status, a "Safety Score 98/100" pill, and an "Auto-Defense" toggle (placeholder, functional on/off state).

## Left Tabs + Network View (implemented — June 2026)
- Hover-reveal left rail (`LeftTabsRail.js`): a slim strip on the far left expands on hover to show view tabs — "3D Building" and "Network View". `App.activeTab` = 'scene' | 'network'.
- `NetworkView.js`: full-screen 2D topology on a grey grid. Core Switch (Floor 5) sits at the top of a vertical backbone; each floor switch cascades below it, and every device fans out in a **horizontal row beneath its switch with its own individual connection line** (star, not chained). Devices are lucide icon chips matching their type, colour-coded with glow; name/IP/relationship on hover. Floor 2 is capped to 5 PCs in this view (3D explore unchanged). Canvas scrollable.

## Backlog / Future

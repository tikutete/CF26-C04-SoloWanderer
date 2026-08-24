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

## Backlog / Future
- P1: Camera should smoothly tween (currently a jump-cut while black, which is intentional & correct).
- P2: Reduce server-label crowding on Floor 5 (e.g. stagger or show on hover).
- P2: Draw cross-floor uplink hints / animate packet flow along links.
- P2: Wire iris to other scene changes (time-of-day, wireframe) using the reusable component.

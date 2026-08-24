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

## Backlog / Future
- P1: Camera should smoothly tween (currently a jump-cut while black, which is intentional & correct).
- P2: Per-floor camera framing tuned individually; optional depth-of-field.
- P2: Wire iris to other scene changes (time-of-day, wireframe) using the reusable component.

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getFloorDevices } from '../data/floorDevices';

const FLOOR_COUNT = 5;
const FLOOR_HEIGHT = 5.6;

const material = (color, options = {}) => new THREE.MeshStandardMaterial({
  color, roughness: options.roughness ?? 0.5, metalness: options.metalness ?? 0.2,
  emissive: options.emissive ?? 0x000000, emissiveIntensity: options.emissiveIntensity ?? 0,
  transparent: options.transparent ?? false, opacity: options.opacity ?? 1,
  wireframe: options.wireframe ?? false, side: options.side ?? THREE.FrontSide
});

// ---- SABRE device / network-map builders (Explore view) ----
const DEVICE_COLOR = {
  computer: 0x56d6e8, kiosk: 0x8be7f2, badge: 0xffb454, camera: 0xff7a5c,
  printer: 0x9fb2c0, wifi: 0x53e0a0, switch: 0x4aa8ff, coreswitch: 0x38a0ff,
  filestore: 0x93a7ba, cloud: 0x39d6c4, devserver: 0x7d8bf0, server: 0x4de0b0,
  domain: 0xcf6bff, firewall: 0xff5a5a,
};

const glowMat = (hex, intensity = 0.85) => new THREE.MeshStandardMaterial({
  color: hex, emissive: hex, emissiveIntensity: intensity, metalness: 0.45, roughness: 0.3,
});

function makeLabel(text) {
  const font = 26; const pad = 10;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `600 ${font}px Inter, Arial, sans-serif`;
  const w = Math.ceil(measure.measureText(text).width) + pad * 2;
  const h = font + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d');
  c.font = `600 ${font}px Inter, Arial, sans-serif`;
  const r = 10;
  c.beginPath();
  c.moveTo(r, 0); c.arcTo(w, 0, w, h, r); c.arcTo(w, h, 0, h, r); c.arcTo(0, h, 0, 0, r); c.arcTo(0, 0, w, 0, r); c.closePath();
  c.fillStyle = 'rgba(4,16,22,0.78)'; c.fill();
  c.strokeStyle = 'rgba(102,224,255,0.55)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#e6fbff'; c.textBaseline = 'middle'; c.textAlign = 'center';
  c.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(w * 0.011, h * 0.011, 1);
  return sprite;
}

function createDeviceObject(device) {
  const g = new THREE.Group();
  g.position.set(...device.position);
  const c = DEVICE_COLOR[device.type] ?? 0x9fb2c0;
  const mat = glowMat(c);
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c1a22, metalness: 0.6, roughness: 0.4 });
  const add = (geo, m = mat, pos = [0, 0, 0], rot) => {
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(...pos); if (rot) mesh.rotation.set(...rot); g.add(mesh); return mesh;
  };
  switch (device.type) {
    case 'computer':
    case 'kiosk': {
      const hgt = device.type === 'kiosk' ? 0.95 : 0.52;
      add(new THREE.BoxGeometry(0.62, 0.42, 0.08), mat, [0, hgt * 0.35, 0]);
      add(new THREE.BoxGeometry(0.5, 0.32, 0.02), glowMat(c, 1.5), [0, hgt * 0.35, 0.05]);
      add(new THREE.BoxGeometry(0.08, hgt * 0.42, 0.08), dark, [0, hgt * 0.04, 0]);
      add(new THREE.BoxGeometry(0.42, 0.04, 0.28), dark, [0, -hgt * 0.16, 0.06]);
      break;
    }
    case 'badge':
      add(new THREE.BoxGeometry(0.34, 0.5, 0.12), mat);
      add(new THREE.BoxGeometry(0.2, 0.12, 0.02), glowMat(0xfff2cf, 1.7), [0, 0.06, 0.07]);
      break;
    case 'camera':
      add(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 12), mat, [0, 0, 0], [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), dark, [0, 0, 0.24], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(0.06, 0.32, 0.06), dark, [0, -0.28, 0]);
      break;
    case 'printer':
      add(new THREE.BoxGeometry(0.62, 0.5, 0.6), mat);
      add(new THREE.BoxGeometry(0.5, 0.05, 0.4), glowMat(c, 1.2), [0, 0.26, 0]);
      break;
    case 'wifi': {
      add(new THREE.CylinderGeometry(0.4, 0.45, 0.16, 20), mat);
      add(new THREE.SphereGeometry(0.18, 16, 12), glowMat(c, 1.7), [0, 0.16, 0]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 8, 32), glowMat(c, 1.4));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; g.add(ring);
      break;
    }
    case 'switch':
    case 'coreswitch': {
      const w = device.type === 'coreswitch' ? 1.8 : 1.35;
      add(new THREE.BoxGeometry(w, 0.3, 0.8), mat);
      for (let i = 0; i < 6; i += 1) add(new THREE.BoxGeometry(0.1, 0.08, 0.06), glowMat(c, 1.5), [-w / 2 + 0.25 + i * ((w - 0.5) / 5), 0, 0.42]);
      break;
    }
    case 'filestore':
    case 'devserver':
    case 'server': {
      const h = 1.35;
      add(new THREE.BoxGeometry(0.7, h, 0.7), mat);
      for (let i = 0; i < 4; i += 1) add(new THREE.BoxGeometry(0.5, 0.04, 0.02), glowMat(c, 1.3), [0, h / 2 - 0.22 - i * 0.3, 0.36]);
      break;
    }
    case 'cloud':
      add(new THREE.BoxGeometry(0.7, 0.5, 0.6), mat);
      add(new THREE.SphereGeometry(0.26, 16, 12), glowMat(c, 1.3), [0, 0.4, 0]);
      add(new THREE.SphereGeometry(0.18, 16, 12), glowMat(c, 1.3), [0.24, 0.32, 0]);
      add(new THREE.SphereGeometry(0.18, 16, 12), glowMat(c, 1.3), [-0.24, 0.32, 0]);
      break;
    case 'domain': {
      const ico = add(new THREE.IcosahedronGeometry(0.5, 0), glowMat(c, 1.25));
      ico.rotation.set(0.4, 0.4, 0); ico.userData.spin = true;
      break;
    }
    case 'firewall':
      add(new THREE.BoxGeometry(0.8, 0.9, 0.32), mat);
      add(new THREE.BoxGeometry(0.6, 0.1, 0.02), glowMat(0xffd0d0, 1.7), [0, 0.18, 0.17]);
      add(new THREE.BoxGeometry(0.6, 0.1, 0.02), glowMat(0xffd0d0, 1.7), [0, -0.02, 0.17]);
      break;
    default:
      add(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
  }
  const label = makeLabel(device.name); label.position.set(0, 1.0, 0); label.userData.isLabel = true; g.add(label);
  const alwaysLabel = device.isHub || ['server', 'domain', 'firewall', 'coreswitch', 'cloud', 'filestore', 'devserver'].includes(device.type);
  label.visible = alwaysLabel;
  g.traverse((o) => {
    if (o.isMesh) { o.userData.baseIntensity = o.material.emissiveIntensity; o.userData.deviceMesh = true; }
  });
  g.userData.device = device;
  g.userData.label = label;
  g.userData.alwaysLabel = alwaysLabel;
  return g;
}

export default function BuildingCanvas3D({ selectedFloor, onSelectFloor, timeOfDay, wireframeMode, viewMode = 'overview', selectedDevice = null, onSelectDevice }) {
  const mountRef = useRef(null);
  const floorsRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const deviceLayerRef = useRef(null);
  const deviceGroupsRef = useRef([]);
  const linksRef = useRef([]);
  const viewModeRef = useRef(viewMode);
  const onSelectDeviceRef = useRef(onSelectDevice);
  viewModeRef.current = viewMode;
  onSelectDeviceRef.current = onSelectDevice;
  const [hoveredFloor, setHoveredFloor] = useState(null);
  const [hoveredDevice, setHoveredDevice] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const scene = new THREE.Scene();
    const skyColor = timeOfDay === 'night' ? 0x050914 : timeOfDay === 'day' ? 0x8ea9ba : 0x131722;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.012);

    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 400);
    camera.position.set(27, 19, 35);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 82;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.target.set(0, 13, 0);
    controls.update();
    cameraRef.current = camera;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(timeOfDay === 'night' ? 0x355d8c : 0xd4e9f5, 0x0c1018, timeOfDay === 'night' ? 0.7 : 1.15));
    const key = new THREE.DirectionalLight(timeOfDay === 'night' ? 0x73a9ff : timeOfDay === 'day' ? 0xfff0c8 : 0xffa06b, timeOfDay === 'night' ? 1.2 : 3.3);
    key.position.set(28, 35, 22); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key);
    const rim = new THREE.DirectionalLight(0x39b8d4, 1.2); rim.position.set(-26, 22, -18); scene.add(rim);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), material(timeOfDay === 'night' ? 0x09111b : 0x17232d, { roughness: 0.85, metalness: 0.35 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    for (let radius = 12; radius <= 48; radius += 12) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.1, radius, 96), new THREE.MeshBasicMaterial({ color: 0x32a6bd, transparent: true, opacity: 0.13, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
    }

    const floors = new THREE.Group(); floorsRef.current = floors; scene.add(floors);
    const deviceLayer = new THREE.Group(); deviceLayer.visible = false; deviceLayerRef.current = deviceLayer; scene.add(deviceLayer);
    const baseMetal = material(0x263746, { metalness: 0.82, roughness: 0.32 });
    const frameMetal = material(0x76aebe, { metalness: 0.9, roughness: 0.2, emissive: 0x0a2733, emissiveIntensity: 0.3 });
    const glass = material(0x1d8095, { metalness: 0.7, roughness: 0.12, transparent: true, opacity: 0.42, emissive: 0x092c3c, emissiveIntensity: 0.65, side: THREE.DoubleSide });
    const screen = material(0x56d6e8, { metalness: 0.4, roughness: 0.18, emissive: 0x20bcd2, emissiveIntensity: 1.25 });
    const warmScreen = material(0xffb35b, { emissive: 0xd85a27, emissiveIntensity: 1.1, metalness: 0.2 });

    for (let index = 0; index < FLOOR_COUNT; index += 1) {
      const number = index + 1; const group = new THREE.Group(); group.userData.floorNumber = number;
      const y = index * FLOOR_HEIGHT; const width = 14 - index * 0.22; const depth = 12.5 - index * 0.2;
      const add = (geometry, source, position, extra = {}) => {
        const mesh = new THREE.Mesh(geometry, source.clone());
        mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData = { floorNumber: number, originalMaterial: mesh.material, ...extra }; group.add(mesh); return mesh;
      };
      // Modern structure: open floor plates, four corner columns, and a solid rear spine.
      add(new THREE.BoxGeometry(width + 0.8, 0.34, depth + 0.8), frameMetal, [0, y + 0.18, 0]);
      add(new THREE.BoxGeometry(width + 0.8, 0.34, depth + 0.8), frameMetal, [0, y + FLOOR_HEIGHT - 0.12, 0], { isRoof: true });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => add(new THREE.BoxGeometry(0.55, FLOOR_HEIGHT, 0.55), baseMetal, [x * (width / 2 - 0.25), y + FLOOR_HEIGHT / 2, z * (depth / 2 - 0.25)]));
      add(new THREE.BoxGeometry(width - 0.8, FLOOR_HEIGHT - 0.7, 0.45), baseMetal, [0, y + FLOOR_HEIGHT / 2, -depth / 2 + 0.25]);
      // One completely glazed front elevation.
      add(new THREE.BoxGeometry(width - 0.8, FLOOR_HEIGHT - 0.7, 0.12), glass, [0, y + FLOOR_HEIGHT / 2, depth / 2 - 0.06], { isFront: true });
      for (let column = -2; column <= 2; column += 1) add(new THREE.BoxGeometry(0.1, FLOOR_HEIGHT - 0.6, 0.2), frameMetal, [column * 2.65, y + FLOOR_HEIGHT / 2, depth / 2], { isFront: true });
      // Five visible computers per floor, with deterministic variety in desk layout.
      const layout = index % 3;
      const computerXs = layout === 0 ? [-5, -2.5, 0, 2.5, 5] : layout === 1 ? [-4.7, -2.35, 0, 2.35, 4.7] : [-5, -2.5, 0, 2.5, 5];
      const deskY = y + 1.55 + (index % 2) * 0.18;
      const deskRows = layout === 0 ? [2.35, -0.05, -2.45] : layout === 1 ? [2.5, 0.05, -2.4] : [2.2, 0, -2.3];
      // Three rows of five stations: fifteen illuminated PCs on every floor.
      deskRows.forEach((computerDepth, row) => computerXs.forEach((x, workstation) => {
        const screenMaterial = (workstation + row + index) % 4 === 0 ? warmScreen : screen;
        add(new THREE.BoxGeometry(2.05, 0.14, 0.9), baseMetal, [x, deskY, computerDepth], { isFurniture: true });
        add(new THREE.BoxGeometry(0.88, 0.56, 0.06), screenMaterial, [x, deskY + 0.42, computerDepth - 0.22], { isFurniture: true });
        add(new THREE.BoxGeometry(0.08, 0.5, 0.08), frameMetal, [x, deskY + 0.12, computerDepth - 0.22], { isFurniture: true });
        add(new THREE.BoxGeometry(0.72, 0.04, 0.3), frameMetal, [x + (workstation % 2 ? 0.28 : -0.28), deskY + 0.1, computerDepth + 0.08], { isFurniture: true });
        // Every station gets a chair, with alternating arrangements each floor.
        const chairX = x + (layout === 1 ? 0.18 : -0.12);
        const chairZ = computerDepth + (row === 0 ? 1.0 : row === 1 ? 0.88 : 0.78);
        add(new THREE.BoxGeometry(0.92, 0.12, 0.72), frameMetal, [chairX, deskY - 0.62, chairZ], { isFurniture: true });
        add(new THREE.BoxGeometry(0.1, 0.58, 0.1), frameMetal, [chairX - 0.32, deskY - 0.88, chairZ], { isFurniture: true });
        add(new THREE.BoxGeometry(0.1, 0.58, 0.1), frameMetal, [chairX + 0.32, deskY - 0.88, chairZ], { isFurniture: true });
      }));
      // Small biophilic pockets and changing floor layouts make each level feel occupied.
      const plantX = index % 2 === 0 ? -5.8 : 5.8;
      const plantZ = layout === 2 ? -3.8 : -2.8;
      const plantPot = material(index % 2 ? 0xe0a05c : 0xc96c4c, { roughness: 0.7 });
      const plantLeaf = material(index % 2 ? 0x5ca26a : 0x3b8e77, { roughness: 0.8, emissive: 0x10291e, emissiveIntensity: 0.2 });
      add(new THREE.CylinderGeometry(0.48, 0.6, 0.72, 12), plantPot, [plantX, y + 0.66, plantZ], { isFurniture: true });
      add(new THREE.SphereGeometry(0.82 + (index % 2) * 0.15, 12, 8), plantLeaf, [plantX, y + 1.62, plantZ], { isFurniture: true });
      if (index % 2 === 1) add(new THREE.BoxGeometry(1.2, 0.65, 0.85), baseMetal, [-plantX * 0.55, y + 0.58, -3.6], { isFurniture: true });
      // Bright, unambiguous highlight frame around every clickable floor.
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 1, FLOOR_HEIGHT + 0.08, depth + 1)), new THREE.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.06 }));
      outline.position.y = y + FLOOR_HEIGHT / 2; outline.userData = { floorNumber: number, isFloorOutline: true }; group.add(outline);
      floors.add(group);
    }

    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const setPointer = (event) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); };
    const floorAt = (event) => { setPointer(event); const hit = raycaster.intersectObjects(floors.children, true)[0]; return hit?.object?.userData?.floorNumber ?? null; };
    const deviceAt = (event) => { setPointer(event); const hits = raycaster.intersectObjects(deviceLayer.children, true); for (const h of hits) { let o = h.object; while (o && !o.userData.device) o = o.parent; if (o) return o.userData.device; } return null; };
    const move = (event) => {
      if (viewModeRef.current === 'floor') { const d = deviceAt(event); setHoveredDevice(d ? d.id : null); setHoveredFloor(null); renderer.domElement.style.cursor = d ? 'pointer' : 'grab'; }
      else { const floor = floorAt(event); setHoveredFloor(floor); setHoveredDevice(null); renderer.domElement.style.cursor = floor ? 'pointer' : 'grab'; }
    };
    const click = (event) => {
      if (viewModeRef.current === 'floor') { const d = deviceAt(event); if (d && onSelectDeviceRef.current) onSelectDeviceRef.current(d); }
      else { const floor = floorAt(event); if (floor) onSelectFloor(floor, { x: event.clientX, y: event.clientY }); }
    };
    renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('click', click);
    let frame; const animate = () => { frame = requestAnimationFrame(animate); controls.update(); if (deviceLayer.visible) deviceLayer.traverse((o) => { if (o.userData.spin) o.rotation.y += 0.012; }); renderer.render(scene, camera); }; animate();
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('click', click); cancelAnimationFrame(frame); controls.dispose(); renderer.dispose(); if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  }, [timeOfDay, wireframeMode, onSelectFloor]);

  // Camera framing + floor isolation + device network layer for overview vs single-floor scene.
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const floors = floorsRef.current;
    const layer = deviceLayerRef.current;
    if (!camera || !controls) return;

    const clearLayer = () => {
      if (!layer) return;
      for (let i = layer.children.length - 1; i >= 0; i -= 1) {
        const ch = layer.children[i]; layer.remove(ch);
        ch.traverse((o) => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.(); } });
      }
      deviceGroupsRef.current = []; linksRef.current = [];
    };

    if (viewMode === 'floor') {
      const fy = (selectedFloor - 1) * FLOOR_HEIGHT;
      camera.position.set(2.5, fy + 5.4, 18.5);
      controls.target.set(0, fy + 2.8, 0);
      floors?.children.forEach((group) => {
        group.visible = group.userData.floorNumber === selectedFloor;
        // Strip furniture, roof and front wall so the network map is clearly visible.
        group.traverse((o) => { if (o.userData?.isFurniture || o.userData?.isRoof || o.userData?.isFront) o.visible = false; });
      });
      // Build the interactive device / network map for this floor.
      clearLayer();
      const { devices, links } = getFloorDevices(selectedFloor, FLOOR_HEIGHT);
      devices.forEach((d) => { const obj = createDeviceObject(d); layer.add(obj); deviceGroupsRef.current.push(obj); });
      links.forEach((lk) => {
        const curve = new THREE.LineCurve3(new THREE.Vector3(...lk.from), new THREE.Vector3(...lk.to));
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 1, 0.022, 6, false),
          new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        tube.userData = { isLink: true, deviceId: lk.fromId, hubId: lk.hubId, baseOpacity: 0.5 };
        layer.add(tube); linksRef.current.push(tube);
      });
      layer.visible = true;
    } else {
      camera.position.set(27, 19, 35);
      controls.target.set(0, 13, 0);
      floors?.children.forEach((group) => {
        group.visible = true;
        group.traverse((o) => { if (o.userData?.isFurniture || o.userData?.isRoof || o.userData?.isFront) o.visible = true; });
      });
      if (layer) layer.visible = false;
      clearLayer();
    }
    controls.update();
  }, [viewMode, selectedFloor]);

  // Highlight selected / hovered device + its connection, and toggle endpoint labels.
  useEffect(() => {
    deviceGroupsRef.current.forEach((g) => {
      const id = g.userData.device.id;
      const sel = id === selectedDevice; const hov = id === hoveredDevice;
      const factor = sel ? 2.4 : hov ? 1.7 : 1;
      g.scale.setScalar(sel ? 1.18 : hov ? 1.08 : 1);
      g.traverse((o) => { if (o.isMesh && o.userData.deviceMesh) o.material.emissiveIntensity = (o.userData.baseIntensity || 0.85) * factor; });
      if (g.userData.label) g.userData.label.visible = g.userData.alwaysLabel || sel || hov;
    });
    linksRef.current.forEach((t) => {
      const active = t.userData.deviceId === selectedDevice;
      t.material.opacity = active ? 0.95 : t.userData.baseOpacity;
      t.material.color.setHex(active ? 0x9becff : 0x66e0ff);
    });
  }, [selectedDevice, hoveredDevice]);

  useEffect(() => {
    floorsRef.current?.children.forEach((floor) => {
      const active = viewMode !== 'floor' && floor.userData.floorNumber === selectedFloor;
      const hover = viewMode !== 'floor' && floor.userData.floorNumber === hoveredFloor;
      floor.traverse((child) => {
        if (child.userData?.isFloorOutline) { child.material.color.setHex(active ? 0xffbd62 : hover ? 0x5be3ef : 0xffb454); child.material.opacity = active ? 1 : hover ? 0.8 : 0.06; return; }
        if (!child.isMesh || !child.userData.originalMaterial) return;
        child.material = child.userData.originalMaterial; child.material.wireframe = wireframeMode;
        child.material.emissive.setHex(active ? 0xf58a2a : hover ? 0x1b8a9d : 0x000000);
        child.material.emissiveIntensity = active ? 0.6 : hover ? 0.28 : child.material.color.getHex() === 0x1d8095 ? 0.65 : 0.0;
      });
    });
  }, [selectedFloor, hoveredFloor, wireframeMode, viewMode]);

  return <div className="relative h-full w-full overflow-hidden" data-testid="building-canvas-container">
    <div ref={mountRef} className="h-full w-full" data-testid="building-renderer" />
    <div className="absolute bottom-5 left-5 pointer-events-none flex items-center gap-3 border border-cyan-300/20 bg-[#071018]/85 px-4 py-3 backdrop-blur-xl" data-testid="scene-help-overlay">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
      <div>
        <p className="font-medium text-white">{viewMode === 'floor' ? 'Network device map' : 'Modern office tower'}</p>
        <p className="text-xs text-slate-400">{viewMode === 'floor' ? 'Click a glowing device to inspect · drag to orbit' : 'Click a floor to light its outline · drag to orbit'}</p>
      </div>
    </div>
    {viewMode === 'overview' && hoveredFloor && hoveredFloor !== selectedFloor && <div className="absolute left-1/2 top-24 -translate-x-1/2 border border-cyan-200/50 bg-cyan-200 px-3 py-1.5 text-xs font-semibold text-slate-950" data-testid="hovered-floor-indicator">Floor {hoveredFloor} · select</div>}
  </div>;
}
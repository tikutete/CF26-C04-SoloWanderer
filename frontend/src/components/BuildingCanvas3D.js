import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FLOOR_COUNT = 5;
const FLOOR_HEIGHT = 5.6;

const material = (color, options = {}) => new THREE.MeshStandardMaterial({
  color, roughness: options.roughness ?? 0.5, metalness: options.metalness ?? 0.2,
  emissive: options.emissive ?? 0x000000, emissiveIntensity: options.emissiveIntensity ?? 0,
  transparent: options.transparent ?? false, opacity: options.opacity ?? 1,
  wireframe: options.wireframe ?? false, side: options.side ?? THREE.FrontSide
});

export default function BuildingCanvas3D({ selectedFloor, onSelectFloor, timeOfDay, wireframeMode, viewMode = 'overview' }) {
  const mountRef = useRef(null);
  const floorsRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [hoveredFloor, setHoveredFloor] = useState(null);

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
      add(new THREE.BoxGeometry(width + 0.8, 0.34, depth + 0.8), frameMetal, [0, y + FLOOR_HEIGHT - 0.12, 0]);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => add(new THREE.BoxGeometry(0.55, FLOOR_HEIGHT, 0.55), baseMetal, [x * (width / 2 - 0.25), y + FLOOR_HEIGHT / 2, z * (depth / 2 - 0.25)]));
      add(new THREE.BoxGeometry(width - 0.8, FLOOR_HEIGHT - 0.7, 0.45), baseMetal, [0, y + FLOOR_HEIGHT / 2, -depth / 2 + 0.25]);
      // One completely glazed front elevation.
      add(new THREE.BoxGeometry(width - 0.8, FLOOR_HEIGHT - 0.7, 0.12), glass, [0, y + FLOOR_HEIGHT / 2, depth / 2 - 0.06]);
      for (let column = -2; column <= 2; column += 1) add(new THREE.BoxGeometry(0.1, FLOOR_HEIGHT - 0.6, 0.2), frameMetal, [column * 2.65, y + FLOOR_HEIGHT / 2, depth / 2]);
      // Five visible computers per floor, with deterministic variety in desk layout.
      const layout = index % 3;
      const computerXs = layout === 0 ? [-5, -2.5, 0, 2.5, 5] : layout === 1 ? [-4.7, -2.35, 0, 2.35, 4.7] : [-5, -2.5, 0, 2.5, 5];
      const deskY = y + 1.55 + (index % 2) * 0.18;
      const deskRows = layout === 0 ? [2.35, -0.05, -2.45] : layout === 1 ? [2.5, 0.05, -2.4] : [2.2, 0, -2.3];
      // Three rows of five stations: fifteen illuminated PCs on every floor.
      deskRows.forEach((computerDepth, row) => computerXs.forEach((x, workstation) => {
        const screenMaterial = (workstation + row + index) % 4 === 0 ? warmScreen : screen;
        add(new THREE.BoxGeometry(2.05, 0.14, 0.9), baseMetal, [x, deskY, computerDepth]);
        add(new THREE.BoxGeometry(0.88, 0.56, 0.06), screenMaterial, [x, deskY + 0.42, computerDepth - 0.22]);
        add(new THREE.BoxGeometry(0.08, 0.5, 0.08), frameMetal, [x, deskY + 0.12, computerDepth - 0.22]);
        add(new THREE.BoxGeometry(0.72, 0.04, 0.3), frameMetal, [x + (workstation % 2 ? 0.28 : -0.28), deskY + 0.1, computerDepth + 0.08]);
        // Every station gets a chair, with alternating arrangements each floor.
        const chairX = x + (layout === 1 ? 0.18 : -0.12);
        const chairZ = computerDepth + (row === 0 ? 1.0 : row === 1 ? 0.88 : 0.78);
        add(new THREE.BoxGeometry(0.92, 0.12, 0.72), frameMetal, [chairX, deskY - 0.62, chairZ]);
        add(new THREE.BoxGeometry(0.1, 0.58, 0.1), frameMetal, [chairX - 0.32, deskY - 0.88, chairZ]);
        add(new THREE.BoxGeometry(0.1, 0.58, 0.1), frameMetal, [chairX + 0.32, deskY - 0.88, chairZ]);
      }));
      // Small biophilic pockets and changing floor layouts make each level feel occupied.
      const plantX = index % 2 === 0 ? -5.8 : 5.8;
      const plantZ = layout === 2 ? -3.8 : -2.8;
      const plantPot = material(index % 2 ? 0xe0a05c : 0xc96c4c, { roughness: 0.7 });
      const plantLeaf = material(index % 2 ? 0x5ca26a : 0x3b8e77, { roughness: 0.8, emissive: 0x10291e, emissiveIntensity: 0.2 });
      add(new THREE.CylinderGeometry(0.48, 0.6, 0.72, 12), plantPot, [plantX, y + 0.66, plantZ]);
      add(new THREE.SphereGeometry(0.82 + (index % 2) * 0.15, 12, 8), plantLeaf, [plantX, y + 1.62, plantZ]);
      if (index % 2 === 1) add(new THREE.BoxGeometry(1.2, 0.65, 0.85), baseMetal, [-plantX * 0.55, y + 0.58, -3.6]);
      // Bright, unambiguous highlight frame around every clickable floor.
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 1, FLOOR_HEIGHT + 0.08, depth + 1)), new THREE.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.06 }));
      outline.position.y = y + FLOOR_HEIGHT / 2; outline.userData = { floorNumber: number, isFloorOutline: true }; group.add(outline);
      floors.add(group);
    }

    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const floorAt = (event) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(floors.children, true)[0]; return hit?.object?.userData?.floorNumber ?? null; };
    const move = (event) => { const floor = floorAt(event); setHoveredFloor(floor); renderer.domElement.style.cursor = floor ? 'pointer' : 'grab'; };
    const click = (event) => { const floor = floorAt(event); if (floor) onSelectFloor(floor, { x: event.clientX, y: event.clientY }); };
    renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('click', click);
    let frame; const animate = () => { frame = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }; animate();
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('click', click); cancelAnimationFrame(frame); controls.dispose(); renderer.dispose(); if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  }, [timeOfDay, wireframeMode, onSelectFloor]);

  // Camera framing + floor isolation for overview vs single-floor scene (jump-cut while iris is black).
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const floors = floorsRef.current;
    if (!camera || !controls) return;
    if (viewMode === 'floor') {
      const floorY = (selectedFloor - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
      camera.position.set(2.5, floorY + 2.4, 15.5);
      controls.target.set(0, floorY, 0);
      floors?.children.forEach((group) => { group.visible = group.userData.floorNumber === selectedFloor; });
    } else {
      camera.position.set(27, 19, 35);
      controls.target.set(0, 13, 0);
      floors?.children.forEach((group) => { group.visible = true; });
    }
    controls.update();
  }, [viewMode, selectedFloor]);

  useEffect(() => {
    floorsRef.current?.children.forEach((floor) => {
      const active = floor.userData.floorNumber === selectedFloor; const hover = floor.userData.floorNumber === hoveredFloor;
      floor.traverse((child) => {
        if (child.userData?.isFloorOutline) { child.material.color.setHex(active ? 0xffbd62 : hover ? 0x5be3ef : 0xffb454); child.material.opacity = active ? 1 : hover ? 0.8 : 0.06; return; }
        if (!child.isMesh || !child.userData.originalMaterial) return;
        child.material = child.userData.originalMaterial; child.material.wireframe = wireframeMode;
        child.material.emissive.setHex(active ? 0xf58a2a : hover ? 0x1b8a9d : 0x000000);
        child.material.emissiveIntensity = active ? 0.6 : hover ? 0.28 : child.material.color.getHex() === 0x1d8095 ? 0.65 : 0.0;
      });
    });
  }, [selectedFloor, hoveredFloor, wireframeMode]);

  return <div className="relative h-full w-full overflow-hidden" data-testid="building-canvas-container">
    <div ref={mountRef} className="h-full w-full" data-testid="building-renderer" />
    <div className="absolute bottom-5 left-5 pointer-events-none flex items-center gap-3 border border-cyan-300/20 bg-[#071018]/85 px-4 py-3 backdrop-blur-xl" data-testid="scene-help-overlay"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" /><div><p className="font-medium text-white">Modern office tower</p><p className="text-xs text-slate-400">Click a floor to light its outline · drag to orbit</p></div></div>
    {hoveredFloor && hoveredFloor !== selectedFloor && <div className="absolute left-1/2 top-24 -translate-x-1/2 border border-cyan-200/50 bg-cyan-200 px-3 py-1.5 text-xs font-semibold text-slate-950" data-testid="hovered-floor-indicator">Floor {hoveredFloor} · select</div>}
  </div>;
}
import React, { useState, useRef, useCallback } from 'react';
import { Target, ArrowLeft } from 'lucide-react';
import BuildingCanvas3D from './components/BuildingCanvas3D';
import FloorInspectorPanel from './components/FloorInspectorPanel';
import ControlsToolbar from './components/ControlsToolbar';
import ArchitecturalSpecsModal from './components/ArchitecturalSpecsModal';
import IrisTransition from './components/IrisTransition';
import LeftTabsRail from './components/LeftTabsRail';
import NetworkView from './components/NetworkView';
import SandboxView from './components/SandboxView';
import TerminalWindow from './components/TerminalWindow';

export default function App() {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const timeOfDay = 'day'; // locked to day
  const wireframeMode = false;
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview | floor
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeTab, setActiveTab] = useState('scene'); // scene | network
  const [terminalDevice, setTerminalDevice] = useState(null);
  const [autoDefense, setAutoDefense] = useState(true); // Auto-Defense ON by default
  const [compromisedIps, setCompromisedIps] = useState([]); // attack path, in order
  const [attackLog, setAttackLog] = useState([]); // ordered attack events for the defense engine

  const handleAttack = useCallback(({ step, ip }) => {
    setAttackLog((prev) => [...prev, { step, ip, t: Date.now() }]);
    if (ip) setCompromisedIps((prev) => (prev.includes(ip) ? prev : [...prev, ip]));
  }, []);
  const handleResetPath = useCallback(() => { setCompromisedIps([]); setAttackLog([]); }, []);

  const irisRef = useRef(null);
  const clickPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Fired when a floor is clicked in the 3D scene — records the approximate screen origin for the iris.
  const handleSelectFloor = useCallback((floor, pos) => {
    setSelectedFloor(floor);
    setSelectedDevice(null);
    if (pos) clickPosRef.current = pos;
  }, []);

  const handleSelectDevice = useCallback((device) => setSelectedDevice(device), []);

  const enterFloor = () => {
    const { x, y } = clickPosRef.current;
    irisRef.current?.play({ x, y, onCovered: () => { setViewMode('floor'); setSelectedDevice(null); } });
  };

  const exitFloor = () => {
    irisRef.current?.play({ onCovered: () => { setViewMode('overview'); setSelectedDevice(null); } });
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans text-slate-100 select-none" data-testid="building-generator-app">
      {/* Top Toolbar */}
      <ControlsToolbar autoDefense={autoDefense} onToggleDefense={() => setAutoDefense((v) => !v)} />

      {/* Main Content: 3D Viewport + Side Inspector Panel */}
      <div className="relative flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden">
        {/* 3D Canvas Viewport */}
        <div className="flex-1 h-full relative">
          <BuildingCanvas3D
            selectedFloor={selectedFloor}
            onSelectFloor={handleSelectFloor}
            timeOfDay={timeOfDay}
            wireframeMode={wireframeMode}
            viewMode={viewMode}
            selectedDevice={selectedDevice?.id ?? null}
            onSelectDevice={handleSelectDevice}
          />

          {/* Explore prompt (overview) */}
          {viewMode === 'overview' && (
            <button
              onClick={enterFloor}
              data-testid="explore-floor-btn"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 group flex items-center gap-2.5 rounded-full border border-cyan-300/40 bg-[#04121a]/90 px-6 py-3.5 font-mono text-sm font-semibold uppercase tracking-widest text-cyan-100 shadow-[0_0_30px_-6px_rgba(0,229,255,0.6)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/80 hover:bg-[#062230]/95 hover:shadow-[0_0_44px_-4px_rgba(0,229,255,0.85)] active:scale-95"
            >
              <Target className="h-4 w-4 text-cyan-300 transition-transform duration-500 group-hover:rotate-90" />
              <span>Explore Floor {selectedFloor}</span>
            </button>
          )}

          {/* Return control (floor view) */}
          {viewMode === 'floor' && (
            <button
              onClick={exitFloor}
              data-testid="back-to-building-btn"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-cyan-300/50 bg-[#04121a]/90 px-6 py-3.5 font-mono text-sm font-semibold uppercase tracking-widest text-cyan-100 shadow-[0_0_30px_-6px_rgba(0,229,255,0.6)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/90 hover:bg-[#062230]/95 hover:shadow-[0_0_44px_-4px_rgba(0,229,255,0.85)] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 text-cyan-300" />
              <span>Return to Building View</span>
            </button>
          )}
        </div>

        {/* Floor Inspector & Details Sidebar */}
        <FloorInspectorPanel
          selectedFloor={selectedFloor}
          onSelectFloor={handleSelectFloor}
          onOpenSpecs={() => setIsSpecsOpen(true)}
          viewMode={viewMode}
          selectedDevice={selectedDevice}
          onClearDevice={() => setSelectedDevice(null)}
          onOpenTerminal={(d) => setTerminalDevice(d)}
        />
      </div>

      {/* Architectural Specs Modal */}
      <ArchitecturalSpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
        selectedFloor={selectedFloor}
      />

      {/* Cinematic iris transition overlay (reusable) */}
      <IrisTransition ref={irisRef} />

      {/* Left hover-reveal tabs + Network View overlay */}
      <LeftTabsRail active={activeTab} onSelect={setActiveTab} />
      {activeTab === 'network' && (
        <NetworkView
          onClose={() => setActiveTab('scene')}
          compromisedIps={compromisedIps}
          autoDefense={autoDefense}
          onResetPath={handleResetPath}
          attackLog={attackLog}
        />
      )}
      {activeTab === 'sandbox' && (
        <SandboxView onClose={() => setActiveTab('scene')} />
      )}

      {/* Device terminal window */}
      {terminalDevice && (
        <TerminalWindow
          device={terminalDevice}
          onClose={() => setTerminalDevice(null)}
          onAttack={handleAttack}
          autoDefense={autoDefense}
        />
      )}
    </div>
  );
}

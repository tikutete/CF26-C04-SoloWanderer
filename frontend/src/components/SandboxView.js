import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X, FlaskConical, Bug, Bot, ChevronLeft, Sparkles } from 'lucide-react';
import {
  buildLayout, getFloorHubNode, COLOR, ICON, CENTER_X, TOP, LABEL_X,
} from '../data/networkLayout';
import { TACTICS, TACTIC_COLOR } from '../data/mitreAttacks';
import SandboxSabrePanel from './SandboxSabrePanel';

function Chip({ x, y, type, title, testid, big, injection, inPath }) {
  const base = COLOR[type] || '#9fb2c0';
  const injColor = injection ? (TACTIC_COLOR[injection.tactic.id] || '#cf6bff') : null;
  const c = inPath ? '#ff3b3b' : injColor || base;
  const Icon = ICON[type] || (() => null);
  const size = big ? 52 : 40;
  return (
    <div
      data-testid={testid}
      data-injected={injection ? 'true' : 'false'}
      data-inpath={inPath ? 'true' : 'false'}
      title={title}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl border bg-[#0b1620] transition-transform hover:scale-110 cursor-pointer ${inPath ? 'sabre-compromised z-10' : ''}`}
      style={{ left: x, top: y, width: size, height: size, borderColor: c, boxShadow: `0 0 14px -4px ${c}` }}
    >
      {inPath && <span className="pointer-events-none absolute inset-0 rounded-xl border-2 border-red-500/70 animate-ping" />}
      {injection && !inPath && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-xl border-2 animate-pulse" style={{ borderColor: c }} />
          <span
            className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wider text-black shadow"
            style={{ backgroundColor: c }}
          >
            {injection.tech.tid}
          </span>
        </>
      )}
      <Icon style={{ color: c }} width={big ? 26 : 20} height={big ? 26 : 20} />
    </div>
  );
}

export default function SandboxView({ onClose }) {
  const { nodes, edges, labels, core, width, height } = useMemo(buildLayout, []);
  const [mode, setMode] = useState('injector'); // injector | llm

  // id -> full node (with x,y). Include the core switch.
  const nodeById = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { m[n.id] = n; });
    if (core) m[core.id] = core;
    return m;
  }, [nodes, core]);

  const [injections, setInjections] = useState({}); // nodeId -> injection
  const [selecting, setSelecting] = useState(null); // { node, stage:'type'|'subtype', tactic }
  const [pathSteps, setPathSteps] = useState([]);
  const [traced, setTraced] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [revealCount, setRevealCount] = useState(0);

  const clearPath = useCallback(() => {
    setPathSteps([]); setTraced(false); setTracing(false); setRevealCount(0);
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (mode !== 'injector') return;
    setSelecting({ node, stage: 'type', tactic: null });
  }, [mode]);

  const pickTactic = useCallback((tactic) => {
    setSelecting((s) => (s ? { ...s, stage: 'subtype', tactic } : s));
  }, []);

  const pickTechnique = useCallback((tactic, tech) => {
    setSelecting((s) => {
      if (!s) return s;
      setInjections((prev) => ({
        ...prev,
        [s.node.id]: {
          nodeId: s.node.id,
          node: { name: s.node.name, ip: s.node.ip, floor: s.node.floor, type: s.node.type },
          tactic: { id: tactic.id, name: tactic.name },
          tech: { n: tech.n, name: tech.name, tid: tech.tid },
        },
      }));
      return null;
    });
    clearPath();
  }, [clearPath]);

  const removeInjection = useCallback((nodeId) => {
    setInjections((prev) => { const n = { ...prev }; delete n[nodeId]; return n; });
    clearPath();
  }, [clearPath]);

  const injectionList = useMemo(() => Object.values(injections), [injections]);

  // Compute the propagation path: injected devices (floor-ascending) -> each floor's
  // Wi-Fi hub above the highest injected floor -> Core Switch (Floor 5, top objective).
  const computePath = useCallback(() => {
    if (injectionList.length === 0) return [];
    const sorted = [...injectionList].sort((a, b) => a.node.floor - b.node.floor);
    const highest = Math.max(...sorted.map((i) => i.node.floor));
    const steps = [];
    sorted.forEach((inj, idx) => {
      const full = nodeById[inj.nodeId];
      steps.push({
        name: inj.node.name, ip: inj.node.ip, floor: inj.node.floor, type: inj.node.type,
        role: idx === 0 ? 'origin' : 'injected', tactic: inj.tactic, tech: inj.tech,
        x: full?.x, y: full?.y,
      });
    });
    for (let f = highest + 1; f <= 4; f += 1) {
      const hub = getFloorHubNode(nodes, core, f);
      if (hub) steps.push({ name: hub.name, ip: hub.ip, floor: f, type: hub.type, role: 'hop', x: hub.x, y: hub.y });
    }
    if (core && steps[steps.length - 1]?.ip !== core.ip) {
      steps.push({ name: core.name || 'Core Switch', ip: core.ip || '10.0.5.1', floor: 5, type: 'coreswitch', role: 'target', x: core.x, y: core.y });
    } else if (steps.length) {
      steps[steps.length - 1].role = 'target';
    }
    return steps;
  }, [injectionList, nodeById, nodes, core]);

  const handleTrace = useCallback(() => {
    const steps = computePath();
    if (steps.length === 0) return;
    setSelecting(null);
    setPathSteps(steps);
    setTraced(true);
    setTracing(true);
    setRevealCount(0);
  }, [computePath]);

  const handleReset = useCallback(() => {
    setInjections({});
    setSelecting(null);
    clearPath();
  }, [clearPath]);

  // Progressive reveal of the path nodes/lines.
  useEffect(() => {
    if (!tracing) return undefined;
    if (revealCount >= pathSteps.length) { setTracing(false); return undefined; }
    const id = setTimeout(() => setRevealCount((c) => c + 1), 650);
    return () => clearTimeout(id);
  }, [tracing, revealCount, pathSteps.length]);

  const revealedIps = useMemo(
    () => new Set(pathSteps.slice(0, revealCount).map((s) => s.ip)),
    [pathSteps, revealCount],
  );

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#070d13]" data-testid="sandbox-view">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-500/20 bg-slate-900/80 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="h-5 w-5 text-red-300" />
          <div>
            <h2 className="font-tech text-base font-bold tracking-widest text-white">SANDBOX VIEW</h2>
            <p className="text-[11px] text-slate-400">Model attacks on the live topology · inject MITRE techniques on devices · trace propagation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1">
            <button
              onClick={() => setMode('injector')}
              data-testid="mode-injector-btn"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === 'injector' ? 'bg-red-500/25 text-red-200' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              <Bug className="h-3.5 w-3.5" /> Threat Injector
            </button>
            <button
              onClick={() => setMode('llm')}
              data-testid="mode-llm-btn"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === 'llm' ? 'bg-cyan-500/25 text-cyan-200' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              <Bot className="h-3.5 w-3.5" /> LLM Tester
            </button>
          </div>
          <button onClick={onClose} data-testid="sandbox-view-close" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 overflow-auto"
        style={{
          backgroundColor: '#0b1219',
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        data-testid="sandbox-canvas"
      >
        <div className="relative" style={{ width, height }}>
          <svg width={width} height={height} className="absolute inset-0">
            {labels.map((l) => (
              <text key={`lbl-${l.f}`} x={LABEL_X} y={l.y + 4} fill="#5b7183" fontSize="12" fontFamily="monospace" fontWeight="bold">{`FLOOR ${l.f}`}</text>
            ))}
            {edges.map((e, idx) => (
              <line
                key={idx}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={e.backbone ? '#38a0ff' : '#66e0ff'}
                strokeWidth={e.backbone ? 2.4 : 1.3}
                strokeOpacity={e.backbone ? 0.9 : 0.5}
                strokeLinecap="round"
              />
            ))}

            {/* Traced propagation path (progressive, red) */}
            {pathSteps.slice(0, revealCount).map((s, i) => {
              if (i === 0) return null;
              const p = pathSteps[i - 1];
              if (s.x == null || p.x == null) return null;
              return (
                <line
                  key={`path-line-${i}`}
                  x1={p.x} y1={p.y} x2={s.x} y2={s.y}
                  stroke="#ff3b3b" strokeWidth={2.4} className="sabre-dash"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(255,59,59,0.95))' }}
                  data-testid={`path-line-${i}`}
                />
              );
            })}
            {pathSteps.slice(0, revealCount).map((s, i) => (
              s.x != null ? (
                <circle key={`path-ring-${i}`} cx={s.x} cy={s.y} r={26} fill="none" stroke="#ff6b6b" strokeWidth={1.8} className="sabre-dash sabre-ring" data-testid={`path-ring-${i}`} />
              ) : null
            ))}
          </svg>

          {core && (
            <Chip
              x={core.x} y={core.y} type="coreswitch" big
              title={`${core.name || 'Core Switch'}\n${core.ip || '10.0.5.1'}`}
              testid="sbx-node-core"
              injection={injections[core.id]}
              inPath={revealedIps.has(core.ip || '10.0.5.1')}
            />
          )}
          {nodes.map((d) => (
            <div key={d.id} onClick={() => handleNodeClick(d)} className={mode === 'injector' ? '' : 'pointer-events-none'} style={{ position: 'absolute', left: 0, top: 0 }}>
              <Chip
                x={d.x} y={d.y} type={d.type}
                title={`${d.name}\n${d.ip}\n${d.relationship}`}
                testid={`sbx-node-${d.id}`}
                injection={injections[d.id]}
                inPath={revealedIps.has(d.ip)}
              />
            </div>
          ))}
          {/* clickable core */}
          {core && mode === 'injector' && (
            <div onClick={() => handleNodeClick(core)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: core.x, top: core.y, width: 52, height: 52 }} data-testid="sbx-core-hit" />
          )}

          {/* Selection popover */}
          {selecting && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSelecting(null)} data-testid="popover-backdrop" />
              <SelectionPopover
                selecting={selecting}
                width={width}
                onPickTactic={pickTactic}
                onPickTechnique={pickTechnique}
                onBack={() => setSelecting((s) => ({ ...s, stage: 'type', tactic: null }))}
                onClose={() => setSelecting(null)}
                onRemove={injections[selecting.node.id] ? () => { removeInjection(selecting.node.id); setSelecting(null); } : null}
              />
            </>
          )}
        </div>

        {/* LLM Tester placeholder overlay */}
        {mode === 'llm' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#070d13]/60" data-testid="llm-placeholder">
            <div className="pointer-events-auto max-w-md rounded-2xl border border-cyan-400/30 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10">
                <Sparkles className="h-6 w-6 text-cyan-300" />
              </div>
              <h3 className="font-tech text-lg font-bold tracking-widest text-white">LLM TESTER</h3>
              <p className="mt-2 text-sm text-slate-300">
                An AI reasoning layer to challenge SABRE&apos;s reconstructions is coming next. Switch back to
                <span className="text-red-300 font-semibold"> Threat Injector</span> to model attacks manually.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right SABRE panel (Threat Injector mode only) */}
      {mode === 'injector' && (
        <SandboxSabrePanel
          injections={injectionList}
          pathSteps={pathSteps}
          canTrace={injectionList.length > 0}
          traced={traced}
          tracing={tracing}
          onTrace={handleTrace}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

function SelectionPopover({ selecting, width, onPickTactic, onPickTechnique, onBack, onClose, onRemove }) {
  const { node, stage, tactic } = selecting;
  // Place near the node but keep it on-screen within the canvas.
  const flipLeft = node.x > width - 320;
  const left = flipLeft ? node.x - 288 : node.x + 34;
  const top = Math.max(TOP, node.y - 30);
  return (
    <div
      className="absolute z-50 w-[272px] rounded-xl border border-red-500/40 bg-[#0d1117] shadow-2xl"
      style={{ left, top }}
      data-testid="selection-popover"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-700/70 px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {stage === 'subtype' && (
            <button onClick={onBack} data-testid="popover-back" className="text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          )}
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-white">{node.name}</p>
            <p className="font-mono text-[9px] text-slate-400">{node.ip} · F{node.floor}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="max-h-[300px] overflow-y-auto p-2">
        {stage === 'type' ? (
          <div key="type" className="flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
            <p className="px-1 pb-1 font-mono text-[10px] uppercase tracking-widest text-red-300/70">Select attack type</p>
            {TACTICS.map((t) => (
              <button
                key={t.id}
                onClick={() => onPickTactic(t)}
                data-testid={`tactic-${t.id}`}
                className="flex items-center justify-between rounded-lg border border-transparent px-2.5 py-1.5 text-left text-[12px] text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TACTIC_COLOR[t.id] }} />
                  {t.name}
                </span>
                <span className="font-mono text-[9px] text-slate-500">{t.id}</span>
              </button>
            ))}
          </div>
        ) : (
          <div key="subtype" className="flex flex-col gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
            <p className="px-1 pb-1 font-mono text-[10px] uppercase tracking-widest" style={{ color: TACTIC_COLOR[tactic.id] }}>
              {tactic.name} · select subtype
            </p>
            {tactic.techniques.map((tech) => (
              <button
                key={`${tactic.id}-${tech.n}`}
                onClick={() => onPickTechnique(tactic, tech)}
                data-testid={`tech-${tactic.id}-${tech.n}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-[12px] text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800"
              >
                <span><span className="text-slate-500">{tech.n}.</span> {tech.name}</span>
                <span className="font-mono text-[9px] text-slate-500">{tech.tid}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {onRemove && (
        <div className="border-t border-slate-700/70 p-2">
          <button onClick={onRemove} data-testid="popover-remove" className="w-full rounded-lg border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white">
            Remove injected threat
          </button>
        </div>
      )}
    </div>
  );
}

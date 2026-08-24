import React, { useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

const formatTs = (d) => {
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
};

const isAlert = (msg) => /FAIL/i.test(msg);
const floorTint = { F1: 'text-sky-300', F2: 'text-cyan-300', F3: 'text-teal-300', F4: 'text-indigo-300', F5: 'text-fuchsia-300' };

export default function TelemetryFeed() {
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const idxRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/sabre_telemetry.txt')
      .then((r) => r.text())
      .then((t) => setLines(t.split('\n').map((l) => l.trim()).filter(Boolean)))
      .catch(() => setLines([]));
  }, []);

  useEffect(() => {
    if (!lines.length) return undefined;
    let cancelled = false;
    const tick = () => {
      const i = idxRef.current % lines.length;
      const [floor, device, msg] = lines[i].split('|').map((s) => s.trim());
      const entry = { ts: formatTs(new Date()), floor, device, msg, key: `${i}-${Date.now()}` };
      setCurrent(entry);
      setHistory((h) => [entry, ...h].slice(0, 400));
      idxRef.current = (idxRef.current + 1) % lines.length;
      timerRef.current = setTimeout(() => { if (!cancelled) tick(); }, 300 + Math.random() * 700);
    };
    tick();
    return () => { cancelled = true; clearTimeout(timerRef.current); };
  }, [lines]);

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4 shadow-inner" data-testid="telemetry-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          </span>
          <p className="text-xs uppercase tracking-widest text-cyan-400/90 font-mono font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Live Telemetry
          </p>
        </div>
      </div>

      {/* Current message */}
      <div className="mt-3 min-h-[42px] rounded-lg bg-black/50 border border-slate-800/80 px-3 py-2 font-mono text-xs" data-testid="telemetry-current">
        {current ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-snug">
            <span className="text-slate-500">[{current.ts}]</span>
            <span className={`font-bold ${floorTint[current.floor] || 'text-cyan-300'}`}>{current.floor}</span>
            <span className="text-slate-300">{current.device}</span>
            <span className={isAlert(current.msg) ? 'text-red-400 font-semibold' : 'text-emerald-300'}>{current.msg}</span>
          </div>
        ) : (
          <span className="text-slate-500">Awaiting telemetry stream…</span>
        )}
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        data-testid="toggle-detailed-telemetry-btn"
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-200 transition-colors hover:bg-cyan-500/20"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        {expanded ? 'Hide Detailed Telemetry' : 'Show Detailed Telemetry'}
      </button>

      {expanded && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg bg-black/50 border border-slate-800/80 p-2 font-mono text-[11px] space-y-1" data-testid="telemetry-detailed">
          {history.map((e) => (
            <div key={e.key} className="flex flex-wrap items-center gap-x-2 leading-snug border-b border-slate-800/40 pb-1">
              <span className="text-slate-500">[{e.ts}]</span>
              <span className={`font-bold ${floorTint[e.floor] || 'text-cyan-300'}`}>{e.floor}</span>
              <span className="text-slate-300">{e.device}</span>
              <span className={isAlert(e.msg) ? 'text-red-400 font-semibold' : 'text-emerald-300'}>{e.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

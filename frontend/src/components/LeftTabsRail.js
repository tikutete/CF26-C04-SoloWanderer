import React from 'react';
import { Box, Network } from 'lucide-react';

const TABS = [
  { id: 'scene', label: '3D Building', icon: Box },
  { id: 'network', label: 'Network View', icon: Network },
];

export default function LeftTabsRail({ active, onSelect }) {
  return (
    <div className="group absolute left-0 top-24 bottom-6 z-40 flex" data-testid="left-tabs-rail">
      {/* hover trigger strip */}
      <div className="my-auto h-24 w-2.5 rounded-r-lg bg-cyan-400/40 transition-colors group-hover:bg-cyan-400/70" data-testid="tabs-hover-strip" />
      <div className="w-0 overflow-hidden transition-all duration-300 ease-out group-hover:w-56">
        <div className="ml-1 flex h-full flex-col gap-2 rounded-2xl border border-cyan-400/20 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl">
          <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-cyan-400/70">Views</p>
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                data-testid={`tab-${t.id}`}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  on ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100' : 'border-transparent text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

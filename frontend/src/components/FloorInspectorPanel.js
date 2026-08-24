import React from 'react';
import { Building2, Layers, ShieldCheck, Cpu, ArrowUpRight, CheckCircle2, Sparkles, Network, MapPin, Hash, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const FLOOR_DETAILS = {
  1: {
    name: "Lobby / Reception",
    height: "0m - 6.5m",
    style: "Public Edge & Visitor Services",
    materials: "Badge Reader · Guest WiFi AP · Lobby Kiosk",
    tenant: "Likely Attacker Entry Point",
    powerDraw: "42 kW",
    stability: "Entry Surface",
    description: "The first contact zone: an entrance badge reader, guest wireless access point, public kiosk, and camera coverage that frame the building’s initial attack surface."
  },
  2: {
    name: "Open Office / General Staff",
    height: "6.5m - 13.0m",
    style: "Employee Workstations & Shared Peripherals",
    materials: "Laptops · Printer · Access Switch · Badge Reader",
    tenant: "Initial Foothold Zone",
    powerDraw: "65 kW",
    stability: "Compromise Surface",
    description: "A busy staff floor with workstations, laptops, a network printer, switch, and badge reader—the likely foothold after an employee laptop is compromised."
  },
  3: {
    name: "Departmental Floor / HR & Sales",
    height: "13.0m - 19.5m",
    style: "Department Workspaces & Shared Data",
    materials: "Workstations · Departmental File Share",
    tenant: "Discovery & Scanning Zone",
    powerDraw: "38 kW",
    stability: "Lateral Movement",
    description: "The attacker’s laptop begins probing here, mapping more workstations and a departmental file share while searching for naming patterns, credentials, and routes deeper into the organization."
  },
  4: {
    name: "Executive Floor",
    height: "19.5m - 26.0m",
    style: "Restricted Leadership Workspace",
    materials: "Executive Workstations · Conference Displays",
    tenant: "Secondary Target / Red Herring",
    powerDraw: "110 kW",
    stability: "Badge Restricted",
    description: "A smaller, badge-restricted zone with executive workstations and conference-room displays. It may be the prize—or a deliberate distraction from the infrastructure below."
  },
  5: {
    name: "Server Room / IT",
    height: "26.0m - 32.5m+",
    style: "Core Infrastructure & Control Plane",
    materials: "Domain Controller · Finance Server · File Server · Firewall",
    tenant: "Critical Final Target",
    powerDraw: "55 kW",
    stability: "Mission Critical",
    description: "The dramatic final hop: domain controller, finance server, file server, core switch, and firewall form the real target at the top of the attack path."
  }
};

export default function FloorInspectorPanel({ selectedFloor, onSelectFloor, onOpenSpecs, viewMode = 'overview', selectedDevice = null, onClearDevice }) {
  const details = FLOOR_DETAILS[selectedFloor] || FLOOR_DETAILS[1];

  if (viewMode === 'floor' && selectedDevice) {
    return (
      <div
        className="w-full lg:w-96 bg-slate-900/90 backdrop-blur-2xl border-l border-cyan-400/25 p-6 flex flex-col justify-between shadow-2xl z-20 overflow-y-auto"
        data-testid="device-inspector-panel"
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-400/80 font-mono font-semibold">Device Inspector</p>
                <h2 className="text-xl font-serif font-bold text-white tracking-wide" data-testid="device-name">{selectedDevice.name}</h2>
              </div>
            </div>
            <button
              onClick={onClearDevice}
              data-testid="device-close-btn"
              className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-6 space-y-4">
            <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 px-3 py-1 text-xs font-mono" data-testid="device-kind">
              {selectedDevice.kind}
            </Badge>

            <div className="bg-slate-950/60 rounded-2xl p-5 border border-cyan-400/20 space-y-4 shadow-inner">
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" /> IP Address
                </p>
                <p className="text-lg font-mono font-bold text-cyan-300" data-testid="device-ip">{selectedDevice.ip}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-400" /> Network Relationship
                </p>
                <p className="text-sm text-slate-200 leading-relaxed font-light" data-testid="device-relationship">{selectedDevice.relationship}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Physical Location
                </p>
                <p className="text-sm text-slate-200 font-medium" data-testid="device-location">{selectedDevice.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-800">
          <p className="text-[11px] text-center text-slate-500">
            SABRE • Click another device to inspect it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full lg:w-96 bg-slate-900/90 backdrop-blur-2xl border-l border-amber-500/20 p-6 flex flex-col justify-between shadow-2xl z-20 overflow-y-auto"
      data-testid="floor-inspector-panel"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-500/80 font-mono font-semibold">Floor Inspector</p>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">Floor {selectedFloor} of 5</h2>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs">
            Active
          </Badge>
        </div>

        {/* Floor Selector Pills */}
        <div className="py-6">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-3">
            Select Tower Level
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = selectedFloor === num;
              return (
                <button
                  key={num}
                  onClick={() => onSelectFloor(num)}
                  data-testid={`floor-tab-${num}`}
                  className={`py-3 rounded-lg font-mono text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span className="text-xs opacity-70">Lvl</span>
                  <span>{num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floor Details Card */}
        <div className="bg-slate-950/60 rounded-2xl p-5 border border-amber-500/20 space-y-4 shadow-inner">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                {details.height}
              </span>
              <h3 className="text-lg font-bold text-white mt-2 font-serif">{details.name}</h3>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-light">
            {details.description}
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400" /> Style</span>
              <span className="text-slate-200 font-medium">{details.style}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Materials</span>
              <span className="text-slate-200 font-medium">{details.materials}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-amber-400" /> Power Load</span>
              <span className="text-slate-200 font-medium">{details.powerDraw}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Structural Stability</span>
              <span className="text-emerald-400 font-mono font-bold">{details.stability}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 mt-6 border-t border-slate-800 flex flex-col gap-3">
        <Button
          onClick={onOpenSpecs}
          data-testid="open-specs-btn"
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-6 rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <span>Full Architectural Blueprint</span>
          <ArrowUpRight className="w-4 h-4" />
        </Button>
        <p className="text-[11px] text-center text-slate-500">
          SABRE • Spatial Attack Behaviour Reconstruction Engine
        </p>
      </div>
    </div>
  );
}

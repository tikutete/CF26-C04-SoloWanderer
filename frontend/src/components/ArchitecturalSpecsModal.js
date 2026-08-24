import React from 'react';
import { X, Building2, Shield, Cpu, Zap, Download, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

export default function ArchitecturalSpecsModal({ isOpen, onClose, selectedFloor }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" data-testid="specs-modal">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-500 font-mono">Master Blueprint</p>
              <h2 className="text-xl font-serif font-bold text-white">SABRE Attack Path Model</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="close-specs-modal"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300">
          <div>
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Architectural Concept</h3>
            <p className="text-sm leading-relaxed text-slate-300 font-light">
              This five-floor procedural model reconstructs a plausible attacker journey through a modern office tower—from public entry surface and employee foothold to discovery, executive access, and the protected IT core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Shield className="w-4 h-4" />
                <span>Materials & Composition</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-400">
                <li>• Transparent workstation-facing facade</li>
                <li>• Fifteen illuminated PCs per floor</li>
                <li>• Badge readers, switches, displays, and servers</li>
                <li>• Camera, firewall, and access-control surfaces</li>
              </ul>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Cpu className="w-4 h-4" />
                <span>Procedural Parameters</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-400">
                <li>• Total Height: 32.5 meters (5 Floors + Spire)</li>
                <li>• 75 visible workstations across the tower</li>
                <li>• Floor 2 foothold → Floor 5 final target</li>
                <li>• Illumination: Sunset ray-traced emulation</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Inspection Mode Enabled</h4>
              <p className="text-xs text-amber-200/80 mt-1">
                Currently inspecting Floor <span className="font-bold underline">{selectedFloor}</span>. Click any floor on the 3D tower or use the side panel selector to switch floors instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
          <Button
            onClick={onClose}
            data-testid="specs-modal-done"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2 rounded-xl"
          >
            Return to 3D View
          </Button>
        </div>

      </div>
    </div>
  );
}

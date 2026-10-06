import React from 'react';
import { X, Crosshair, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import vintageArtUrl from '../assets/images/spitfire_vintage_art_1791149114486.jpg';

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  isGameActive: boolean;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({
  isOpen,
  onClose,
  onStart,
  isGameActive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with artwork banner */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-stone-950">
          <img
            src={vintageArtUrl}
            alt="Spitfire City Bomber Flight Briefing"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter saturate-110 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors border border-white/10"
            aria-label="Close Briefing"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title Lockup */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">
              RAF Flight Command · Tactical Manual
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk'] tracking-tight mt-0.5">
              Spitfire City Bomber
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-300 text-sm font-['Outfit']">
          <div className="text-stone-300 leading-relaxed">
            Take command of a slow-gliding Spitfire over dense occupied cities. With compressed horizontal space, master the two-button flight system to eliminate enemy targets while safeguarding civilian quarters.
          </div>

          {/* Tactical Control Scheme */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-800/70 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-['Cabinet_Grotesk'] text-sm">
                <Crosshair className="w-4 h-4 text-amber-400" />
                Button A · Drop Bomb [SPACE]
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Releases bombs in a <strong className="text-stone-200">steep parabolic arc</strong>. Demolishes enemy bunkers, silos, and radar trucks on direct impact.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-800/70 border border-sky-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold font-['Cabinet_Grotesk'] text-sm">
                <RotateCcw className="w-4 h-4 text-sky-400" />
                Button B · Loop [HOLD W]
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Executes continuous 360° vertical loop. <strong className="text-stone-200">Halts forward glide</strong>, dodges AA tracer bursts, and shakes off tracking missiles!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-800/70 border border-rose-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-['Cabinet_Grotesk'] text-sm">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Button C · Gunfire [HOLD F / C]
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Fires rapid quad <strong className="text-stone-200">.303 Browning machine guns</strong>. Shoots down airborne missiles and disables rooftop radar dishes & missile silos. Heavy bunkers and AA guns require <strong className="text-amber-300">Bombs</strong> to demolish.
              </p>
            </div>
          </div>

          {/* Damage & Threat Intel */}
          <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700/60 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Damage & Combat Dynamics
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block">Ground AA Gunfire (10 HP Damage)</strong>
                  <span className="text-stone-400">
                    Bunkers spray glowing tracer rounds that deal smaller chipping damage to your 100% Hull Integrity. Standing Loops dodge through tracer fire!
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300 block">Tracking Missiles (50 HP Damage)</strong>
                  <span className="text-stone-400">
                    Catastrophic blast damage. Evade with timed Standing Loops or shoot them down with forward machine gunfire!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rules: Enemy vs Civilian */}
          <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700/60 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Rules of Engagement
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300 block">Designated Enemy Targets</strong>
                  <span className="text-stone-400">
                    Bunkers with rotating radar dishes, silos, and red target chevrons. Destroy them to stop missile barrages (+250 pts).
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300 block">Civilian Structures (Strict Avoidance)</strong>
                  <span className="text-stone-400">
                    Townhouses, clocktowers, and cottages. Collateral hits incur severe score penalties (-150 pts). Zero collateral unlocks the Gold Medal!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onStart();
              onClose();
            }}
            className="px-6 py-2.5 text-sm font-bold font-['Cabinet_Grotesk'] uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md active:scale-95"
          >
            {isGameActive ? "Resume Sortie" : "Take to the Skies"}
          </button>
        </div>
      </div>
    </div>
  );
};

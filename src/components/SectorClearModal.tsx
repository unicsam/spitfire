import React from 'react';
import { Award, ArrowRight, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import { MissionStats, SectorConfig } from '../types/game';

interface SectorClearModalProps {
  stats: MissionStats;
  sector: SectorConfig;
  highScore: number;
  onNextSector: () => void;
  onReplaySector: () => void;
}

export const SectorClearModal: React.FC<SectorClearModalProps> = ({
  stats,
  sector,
  highScore,
  onNextSector,
  onReplaySector,
}) => {
  const isZeroCollateral = stats.civilianHit === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-b from-amber-950/40 to-stone-900 border-b border-stone-800 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            <Award className="w-8 h-8" />
          </div>
          <span className="block text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">
            Mission Accomplished
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk'] tracking-tight mt-1">
            {sector.name} Cleared!
          </h2>
          <p className="text-xs text-stone-400 font-['Outfit'] mt-1">
            All designated enemy military structures have been neutralized.
          </p>
        </div>

        {/* Stats Breakdown */}
        <div className="p-6 space-y-4 font-['Outfit']">
          {/* Zero Collateral Medal Highlight */}
          {isZeroCollateral ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-300 font-['Cabinet_Grotesk'] uppercase tracking-wider">
                  Zero Collateral Precision Medal Awarded
                </div>
                <div className="text-xs text-emerald-200/80">
                  Every civilian building was spared! +600 Precision Bonus added.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-red-300 font-['Cabinet_Grotesk'] uppercase tracking-wider">
                  Collateral Casualties Recorded
                </div>
                <div className="text-xs text-red-200/80">
                  {stats.civilianHit} civilian structures suffered damage. Work on steep bomb drop timing!
                </div>
              </div>
            </div>
          )}

          {/* Breakdown table */}
          <div className="space-y-2 text-xs divide-y divide-stone-800">
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Enemy Targets Neutralized</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {stats.enemyNeutralized} / {stats.enemyTotal}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Missiles Evaded via Loop</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">
                {stats.missilesEvaded}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Total Sector Score</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                {stats.score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-400">
              <span>Personal Best High Score</span>
              <span className="font-mono tabular-nums text-stone-300">
                {Math.max(highScore, stats.score).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={onReplaySector}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replay Sector
          </button>
          <button
            onClick={onNextSector}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold font-['Cabinet_Grotesk'] uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md active:scale-95"
          >
            <span>Next Sector</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

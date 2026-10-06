import React, { useEffect } from 'react';
import { RotateCcw, AlertOctagon, Target, ArrowLeft } from 'lucide-react';
import { MissionStats, SectorConfig } from '../types/game';
import { sound } from '../audio/soundEngine';

interface MissionFailedModalProps {
  stats: MissionStats;
  sector: SectorConfig;
  onRetry: () => void;
  onRestartAll: () => void;
}

export const MissionFailedModal: React.FC<MissionFailedModalProps> = ({
  stats,
  sector,
  onRetry,
  onRestartAll,
}) => {
  useEffect(() => {
    sound.stopAll();
  }, []);
  const missedCount = Math.max(0, stats.enemyTotal - stats.enemyNeutralized);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-b from-amber-950/40 to-stone-900 border-b border-stone-800 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <span className="block text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">
            Airspace Boundary Exceeded
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk'] tracking-tight mt-1">
            Sortie Incomplete
          </h2>
          <p className="text-xs text-stone-400 font-['Outfit'] mt-1">
            You exited the {sector.name.split(':')[0]} perimeter, but enemy fortifications survived.
          </p>
        </div>

        {/* Stats Breakdown */}
        <div className="p-6 space-y-4 font-['Outfit']">
          {/* Missed bases warning box */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center gap-3">
            <Target className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300 font-['Cabinet_Grotesk'] uppercase tracking-wider">
                {missedCount} Enemy {missedCount === 1 ? 'Target' : 'Targets'} Survived
              </div>
              <div className="text-xs text-amber-200/80">
                All designated military structures must be neutralized to secure the airspace.
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-stone-800">
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Targets Neutralized</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {stats.enemyNeutralized} / {stats.enemyTotal}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Civilian Collateral</span>
              <span className={`font-mono font-bold tabular-nums ${stats.civilianHit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {stats.civilianHit} Hit
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Sector Score</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                {stats.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={onRestartAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Start Over
          </button>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold font-['Cabinet_Grotesk'] uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Sector</span>
          </button>
        </div>
      </div>
    </div>
  );
};

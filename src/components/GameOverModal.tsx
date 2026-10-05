import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { MissionStats } from '../types/game';

interface GameOverModalProps {
  stats: MissionStats;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-b from-red-950/40 to-stone-900 border-b border-stone-800 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <span className="block text-xs uppercase tracking-widest text-red-400 font-mono font-semibold">
            Spitfire Downed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk'] tracking-tight mt-1">
            Sortie Ended
          </h2>
          <p className="text-xs text-stone-400 font-['Outfit'] mt-1">
            Remember: Execute your Standing Loop when tracking missiles approach!
          </p>
        </div>

        {/* Stats Breakdown */}
        <div className="p-6 space-y-3 font-['Outfit']">
          <div className="space-y-2 text-xs divide-y divide-stone-800">
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Final Score</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                {stats.score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Enemy Targets Neutralized</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {stats.enemyNeutralized}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-stone-300">
              <span>Missiles Evaded</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">
                {stats.missilesEvaded}
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
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-center">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold font-['Cabinet_Grotesk'] uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

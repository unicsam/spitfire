import React from 'react';
import { Volume2, VolumeX, Pause, Play, HelpCircle } from 'lucide-react';
import { MissionStats, SectorConfig } from '../types/game';

interface HUDProps {
  stats: MissionStats;
  sector: SectorConfig;
  lives: number;
  hullHealth?: number;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenBriefing: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  sector,
  lives,
  hullHealth = 100,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onOpenBriefing,
}) => {
  const remainingTargets = Math.max(0, stats.enemyTotal - stats.enemyNeutralized);

  return (
    <header className="w-full bg-stone-900 border-b border-stone-800 text-stone-200 select-none z-20">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tight text-amber-400 font-['Cabinet_Grotesk'] uppercase">
            Spitfire City Bomber
          </span>

          {/* Spitfire Armor Roundels & Hull Integrity Gauge */}
          <div className="flex items-center gap-2 ml-1" title={`Spitfire Planes: ${lives}/3 | Hull Armor: ${hullHealth}%`}>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((heartIndex) => (
                <div
                  key={heartIndex}
                  className={`w-3.5 h-3.5 rounded-full border border-stone-900 flex items-center justify-center transition-all ${
                    heartIndex <= lives
                      ? 'bg-amber-400 ring-1.5 ring-sky-700/60 scale-100'
                      : 'bg-stone-700 opacity-30 scale-90'
                  }`}
                >
                  <div className={`w-1 h-1 rounded-full ${heartIndex <= lives ? 'bg-red-600' : 'bg-transparent'}`} />
                </div>
              ))}
            </div>

            {/* Hull Armor Integrity Mini-Gauge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
              <span className="text-[9px] font-bold tracking-wider uppercase text-stone-400">HULL</span>
              <div className="w-14 h-1.5 bg-stone-800 rounded-sm overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-150 ${
                    hullHealth > 50
                      ? 'bg-emerald-500'
                      : hullHealth > 25
                      ? 'bg-amber-400'
                      : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hullHealth))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-stone-200 tabular-nums">
                {hullHealth}%
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Clean unboxed metadata with typographic separators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-['Outfit'] text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Sector</span>
            <span className="font-semibold text-stone-200">{sector.name.split(':')[0]}</span>
          </div>

          <span aria-hidden="true" className="text-stone-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Approach</span>
            <span className="font-mono font-bold text-sky-400 tabular-nums">
              Pass {stats.approachRun} / {stats.maxApproachRuns}
            </span>
          </div>

          <span aria-hidden="true" className="text-stone-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Targets</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">
              {stats.enemyNeutralized} / {stats.enemyTotal}
            </span>
          </div>

          <span aria-hidden="true" className="text-stone-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Perimeter</span>
            <span className="font-mono font-bold text-stone-300 tabular-nums">
              {Math.round(stats.sectorProgress * 100)}%
            </span>
          </div>

          <span aria-hidden="true" className="text-stone-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Collateral</span>
            <span className={`font-mono font-bold tabular-nums ${stats.civilianHit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {stats.civilianHit === 0 ? '0 (Clean)' : `${stats.civilianHit} Hit`}
            </span>
          </div>

          <span aria-hidden="true" className="text-stone-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 uppercase tracking-wider text-[10px]">Score</span>
            <span className="font-mono font-bold text-stone-100 tabular-nums text-sm">
              {stats.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Zone 3: Primary Actions (Mute, Pause, Briefing) */}
        <div className="flex items-center gap-2">
          {/* Mobile target tally */}
          <div className="flex md:hidden items-center gap-2 text-xs font-mono mr-1">
            <span className="text-sky-300">P{stats.approachRun}/{stats.maxApproachRuns}</span>
            <span className="text-amber-400 font-bold">{remainingTargets} Left</span>
          </div>

          <button
            onClick={onOpenBriefing}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/60"
            title="Flight Manual & Briefing"
            aria-label="Mission Briefing"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/60"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onTogglePause}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/60"
            title={isPaused ? "Resume Flight" : "Pause Flight"}
            aria-label="Toggle Pause"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

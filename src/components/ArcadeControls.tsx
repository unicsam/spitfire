import React from 'react';
import { Crosshair, RotateCcw, Zap } from 'lucide-react';

interface ArcadeControlsProps {
  onDropBomb: () => void;
  onFireGuns?: () => void;
  onFireGunsStart?: () => void;
  onFireGunsEnd?: () => void;
  onStandingLoopStart: () => void;
  onStandingLoopEnd: () => void;
  bombCooldown: number;
  isLooping: boolean;
  disabled: boolean;
}

export const ArcadeControls: React.FC<ArcadeControlsProps> = ({
  onDropBomb,
  onFireGuns,
  onFireGunsStart,
  onFireGunsEnd,
  onStandingLoopStart,
  onStandingLoopEnd,
  bombCooldown,
  isLooping,
  disabled,
}) => {
  const isBombReady = bombCooldown <= 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 select-none">
      {/* Button A: Drop Bomb */}
      <button
        onClick={onDropBomb}
        disabled={disabled || !isBombReady}
        className={`group relative flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98] ${
          isBombReady && !disabled
            ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-stone-950 shadow-lg shadow-amber-950/40 cursor-pointer active:translate-y-0.5'
            : 'bg-stone-800/80 border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
        }`}
        aria-label="Drop Bomb"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-stone-900/30 flex items-center justify-center border border-white/20">
            <Crosshair className={`w-5 h-5 ${isBombReady ? 'text-stone-950 group-hover:scale-110' : 'text-stone-500'} transition-transform`} />
          </div>
          <div className="text-left">
            <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase font-['Cabinet_Grotesk'] leading-none">
              Button A · Bomb
            </div>
            <div className="text-[10px] text-stone-900/80 font-medium font-['Outfit'] mt-1">
              {isLooping ? 'Acrobatic Vector Drop' : 'Steep Parabolic Arc'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden md:inline-block px-2 py-0.5 text-xs font-bold font-mono bg-stone-900/40 text-stone-950 rounded border border-white/20">
            SPACE
          </span>
          {!isBombReady && (
            <span className="text-xs font-mono tabular-nums text-amber-300 font-bold">
              {(bombCooldown).toFixed(1)}s
            </span>
          )}
        </div>
      </button>

      {/* Button B: Standing Loop */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          onStandingLoopStart();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onStandingLoopEnd();
        }}
        onPointerLeave={() => {
          onStandingLoopEnd();
        }}
        onPointerCancel={() => {
          onStandingLoopEnd();
        }}
        disabled={disabled}
        className={`group relative flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98] ${
          !disabled
            ? isLooping
              ? 'bg-sky-600 hover:bg-sky-500 border-sky-200 text-white shadow-lg shadow-sky-900/60 ring-2 ring-sky-400/50 cursor-pointer active:translate-y-0.5'
              : 'bg-sky-600 hover:bg-sky-500 border-sky-300 text-white shadow-lg shadow-sky-950/40 cursor-pointer active:translate-y-0.5'
            : 'bg-stone-800/80 border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
        }`}
        aria-label="Hold to Perform Standing Loop"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center border border-white/20">
            <RotateCcw className={`w-5 h-5 ${isLooping ? 'animate-spin' : 'group-hover:-rotate-45'} transition-transform`} />
          </div>
          <div className="text-left">
            <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase font-['Cabinet_Grotesk'] leading-none">
              Button B · Loop
            </div>
            <div className="text-[10px] text-sky-100 font-medium font-['Outfit'] mt-1">
              {isLooping ? 'Rolling · Release to Level' : 'Hold to Roll · Dodge Fire'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden md:inline-block px-2 py-0.5 text-xs font-bold font-mono bg-black/30 text-white rounded border border-white/20">
            W / UP
          </span>
        </div>
      </button>

      {/* Button C: Machine Gunfire */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          onFireGunsStart?.();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onFireGunsEnd?.();
        }}
        onPointerLeave={() => {
          onFireGunsEnd?.();
        }}
        onPointerCancel={() => {
          onFireGunsEnd?.();
        }}
        onClick={onFireGuns}
        disabled={disabled}
        className={`group relative flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98] ${
          !disabled
            ? 'bg-rose-700 hover:bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950/40 cursor-pointer active:translate-y-0.5'
            : 'bg-stone-800/80 border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
        }`}
        aria-label="Hold to Fire Quad .303 Browning Machine Guns"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-black/25 flex items-center justify-center border border-white/20">
            <Zap className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-left">
            <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase font-['Cabinet_Grotesk'] leading-none">
              Button C · Gunfire
            </div>
            <div className="text-[10px] text-rose-100 font-medium font-['Outfit'] mt-1">
              Quad .303 · Shred Missiles & Disarm Pods
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden md:inline-block px-2 py-0.5 text-xs font-bold font-mono bg-black/30 text-white rounded border border-white/20">
            HOLD [F] / [C]
          </span>
        </div>
      </button>
    </div>
  );
};

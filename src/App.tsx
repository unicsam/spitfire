import React, { useState } from 'react';
import { useSpitfireGame } from './game/useSpitfireGame';
import { HUD } from './components/HUD';
import { ArcadeControls } from './components/ArcadeControls';
import { BriefingModal } from './components/BriefingModal';
import { SectorClearModal } from './components/SectorClearModal';
import { MissionFailedModal } from './components/MissionFailedModal';
import { GameOverModal } from './components/GameOverModal';
import { Play, HelpCircle, Shield, Target } from 'lucide-react';
import vintageArtUrl from './assets/images/spitfire_vintage_art_1791149114486.jpg';

export default function App() {
  const {
    canvasRef,
    gameState,
    stats,
    planeLives,
    hullHealth,
    bombCooldownRemaining,
    isLoopingState,
    isMuted,
    highScore,
    currentSectorConfig,
    dropBomb,
    fireMachineGun,
    startMachineGun,
    stopMachineGun,
    performStandingLoop,
    startStandingLoop,
    stopStandingLoop,
    startGame,
    nextSector,
    restartSector,
    restartFromBeginning,
    togglePause,
    toggleSoundMute,
  } = useSpitfireGame();

  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col items-center justify-between select-none">
      {/* Top HUD Bar */}
      <HUD
        stats={stats}
        sector={currentSectorConfig}
        lives={planeLives}
        hullHealth={hullHealth}
        isMuted={isMuted}
        isPaused={gameState === 'PAUSED'}
        onToggleMute={toggleSoundMute}
        onTogglePause={togglePause}
        onOpenBriefing={() => setIsBriefingOpen(true)}
      />

      {/* Main Game Screen Canvas Container */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-2 relative">
        <div className="w-full max-w-5xl relative aspect-[16/9] max-h-[70vh] rounded-2xl overflow-hidden border-2 sm:border-4 border-stone-800 shadow-2xl bg-stone-900 flex items-center justify-center">
          {/* Virtual Canvas (960x540 native resolution) */}
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full object-contain block"
          />

          {/* Title Screen Overlay */}
          {gameState === 'TITLE' && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
              {/* Emblem / Badge */}
              <div className="relative mb-3 w-28 h-28 rounded-2xl overflow-hidden shadow-xl border-2 border-amber-500/40">
                <img
                  src={vintageArtUrl}
                  alt="Spitfire Bomber Emblem"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">
                Royal Air Force · Tactical Command
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white font-['Cabinet_Grotesk'] tracking-tight mt-1 mb-2">
                Spitfire City Bomber
              </h1>
              <p className="max-w-md text-xs sm:text-sm text-stone-300 font-['Outfit'] mb-6 leading-relaxed">
                Pilot a vintage Spitfire in a compressed-distance city corridor. Time steep parabolic bomb arcs onto enemy targets while strictly sparing civilian quarters.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={startGame}
                  className="flex items-center gap-2.5 px-7 py-3 text-sm font-black font-['Cabinet_Grotesk'] uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-stone-950" />
                  <span>Start Sortie</span>
                </button>

                <button
                  onClick={() => setIsBriefingOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 text-xs font-bold font-['Cabinet_Grotesk'] uppercase tracking-wider bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl transition-all cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Flight Manual</span>
                </button>
              </div>

              {/* Quick Mechanics Hint */}
              <div className="mt-6 flex items-center gap-6 text-[11px] font-['Outfit'] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Button A: Parabolic Bomb Drop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Button B: Evasive Standing Loop</span>
                </div>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">
                Tactical Hold
              </span>
              <h2 className="text-3xl font-black text-white font-['Cabinet_Grotesk'] tracking-tight mt-1 mb-4">
                Flight Suspended
              </h2>
              <button
                onClick={togglePause}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold font-['Cabinet_Grotesk'] uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>Resume Sortie</span>
              </button>
            </div>
          )}
        </div>

        {/* Tactical Arcade Controls */}
        <ArcadeControls
          onDropBomb={dropBomb}
          onFireGuns={fireMachineGun}
          onFireGunsStart={startMachineGun}
          onFireGunsEnd={stopMachineGun}
          onStandingLoopStart={startStandingLoop}
          onStandingLoopEnd={stopStandingLoop}
          bombCooldown={bombCooldownRemaining}
          isLooping={isLoopingState}
          disabled={gameState !== 'PLAYING'}
        />
      </main>

      {/* Quiet Footer with Hotkey Discipline */}
      <footer className="w-full bg-stone-900 border-t border-stone-800/80 px-4 py-2 select-none">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-[11px] font-['Outfit'] text-stone-400">
          <div className="flex items-center gap-4">
            <span><kbd className="font-mono px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200">SPACE</kbd> Drop Bomb</span>
            <span><kbd className="font-mono px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200">HOLD [F] / [C]</kbd> Machine Guns</span>
            <span><kbd className="font-mono px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200">HOLD W / UP</kbd> Standing Loop</span>
            <span><kbd className="font-mono px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200">P</kbd> Pause</span>
            <span><kbd className="font-mono px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200">M</kbd> Mute</span>
          </div>

          <div className="flex items-center gap-2 text-stone-400">
            <span>Spitfire Mk. I</span>
            <span aria-hidden="true">·</span>
            <span>Tactical Arcade System</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        onStart={startGame}
        isGameActive={gameState === 'PLAYING' || gameState === 'PAUSED'}
      />

      {gameState === 'SECTOR_CLEAR' && (
        <SectorClearModal
          stats={stats}
          sector={currentSectorConfig}
          highScore={highScore}
          onNextSector={nextSector}
          onReplaySector={restartSector}
        />
      )}

      {gameState === 'MISSION_FAILED' && (
        <MissionFailedModal
          stats={stats}
          sector={currentSectorConfig}
          onRetry={restartSector}
          onRestartAll={restartFromBeginning}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          highScore={highScore}
          onRestart={restartFromBeginning}
        />
      )}
    </div>
  );
}

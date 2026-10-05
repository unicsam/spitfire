export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'SECTOR_CLEAR' | 'MISSION_FAILED' | 'GAME_OVER';

export type BuildingType = 'CIVILIAN' | 'ENEMY';

export interface Building {
  id: string;
  type: BuildingType;
  x: number;          // World X coordinate
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  name: string;
  themeStyle: {
    baseColor: string;
    trimColor: string;
    roofType: 'flat' | 'gable' | 'mansard' | 'dome' | 'silo' | 'radar';
    hasAntenna?: boolean;
    hasRadar?: boolean;
    hasHazardStripes?: boolean;
    windowRows: number;
    windowCols: number;
  };
  missileCooldown: number; // Cooldown before launching next missile
  radarAngle?: number;
  isRadarUnit?: boolean;
  isJammed?: boolean;
  radarTrackAngle?: number;
  linkedRadarId?: string;
  aaGunCooldown?: number;
  aaBurstCount?: number;
  aaBurstTimer?: number;
}

export interface Bomb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  age: number;
  alive: boolean;
  trajectoryHistory: { x: number; y: number }[];
}

export interface Missile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  fuel: number;       // Remaining lifespan (seconds)
  alive: boolean;
  sourceBuildingId: string;
  overshot: boolean;  // Did the player evade it with a loop?
  isHaywire?: boolean; // Fired in wrong direction with scrambled guidance
  wobblePhase?: number;
  wobbleSpeed?: number;
  smokeTimer: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;    // true = Spitfire .303 machine gun, false = enemy AA flak gunfire
  damage: number;       // Smaller damage (e.g. 10 for enemy bullet, 15 for player bullet)
  alive: boolean;
  life: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  maxLife: number;
  life: number;
  type: 'smoke' | 'fire' | 'spark' | 'debris' | 'shockwave';
  alpha: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  isPenalty?: boolean;
}

export interface SpitfirePlane {
  x: number;            // World X
  y: number;            // Base altitude Y
  baseY: number;        // Cruising altitude
  angle: number;        // Rotation in radians
  speed: number;        // Horizontal flight speed
  direction: 1 | -1;    // 1 = Flying East (Right), -1 = Flying West (Left)
  isTurning180: boolean;// In automatic 180 combat turn
  turnProgress: number; // 0 to 1
  turnDuration: number; // Duration of turn in seconds
  isLooping: boolean;   // In Standing Loop
  loopProgress: number; // 0 to 1
  loopCenterX: number;  // Anchor point of the loop
  loopCenterY: number;
  loopRadius: number;
  propellerAngle: number;
  lives: number;
  hullHealth: number;    // Current plane hull armor (0 to 100)
  maxHullHealth: number; // 100
  invulnerableTime: number; // Flashing after hit
  bombCooldown: number;
  standingLoopCooldown: number;
  machineGunCooldown: number;
  isCrashing?: boolean;    // Fatal dive towards ground / targets
  crashVx?: number;
  crashVy?: number;
  crashAngle?: number;
}

export interface MissionStats {
  sectorIndex: number;
  score: number;
  enemyNeutralized: number;
  enemyTotal: number;
  civilianHit: number;
  civilianTotal: number;
  missilesEvaded: number;
  bombsDropped: number;
  directHits: number;
  approachRun: number;
  maxApproachRuns: number;
  sectorProgress: number; // 0 to 1
}

export interface SectorConfig {
  sectorNumber: number;
  name: string;
  subtitle: string;
  briefing: string;
  cityLength: number;
  enemyTargetsCount: number;
  civilianBuildingsCount: number;
  missileFireRateFactor: number;
  maxApproachRuns?: number;
  skyTheme: 'dawn' | 'noon' | 'sunset' | 'night' | 'stormy' | 'dusk' | 'overcast' | 'midnight_crimson';
}

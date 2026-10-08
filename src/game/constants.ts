export const CANVAS_VIRTUAL_WIDTH = 960;
export const CANVAS_VIRTUAL_HEIGHT = 540;

// World & Flight Constants - Spacious, balanced flight path with ample upper sky headroom
export const PLANE_CRUISE_Y = 150;     // Safe, comfortable altitude
export const PLANE_CRUISE_SPEED = 115; // Smooth, readable glide
export const PLANE_LOOP_RADIUS = 35;   // Tight aerobatic loop (apex at y=80, 80px below ceiling)
export const PLANE_LOOP_DURATION = 1.4; // Seconds to complete full 360 circle
export const GROUND_Y = 490;           // Street level

// Bomb Physics (Exaggerated Parabolic Arc)
export const BOMB_INITIAL_FORWARD_BOOST = 1.15; // Exaggerated forward carry
export const BOMB_GRAVITY = 320;                // Graceful, readable downward curve
export const BOMB_COOLDOWN = 0.45;              // Minimum time between bomb drops
export const BOMB_SPLASH_RADIUS = 20;           // Tight, controlled near-miss tolerance for street impacts

// Missile Mechanics (Miniature Tactical Rockets & Silos)
export const MISSILE_SPEED = 180;              // Measured, readable speed
export const MISSILE_TURN_RATE = 0.8;         // Max steering angle per sec (rad/s)
export const MISSILE_FUEL_DURATION = 8.2;      // Lifespan
export const MISSILE_DETECTION_RANGE = 3080;    // Proximity detection range for silos to engage
export const MISSILE_TRACKING_EVADE_RANGE = 130;// Proximity range to trigger Standing Loop missile evasion

// Missile Launch Cooldown & Rates (Time in seconds between missile launches)
export const MISSILE_COOLDOWN_RADAR_BASE = 4.8;    // Base reload interval for Mobile Radar Stations
export const MISSILE_COOLDOWN_SILO_BASE = 6.2;     // Base reload interval for standard enemy bunker silos
export const MISSILE_COOLDOWN_HAYWIRE_BASE = 3.8;  // Reload interval when radar is jammed/haywire
export const MISSILE_COOLDOWN_VARIANCE = 2.2;      // Random jitter added to missile reload cooldowns
export const MISSILE_INITIAL_DELAY_RADAR_MIN = 3.8;// Initial delay for radar station before first missile
export const MISSILE_INITIAL_DELAY_RADAR_MAX = 6.3;// Max initial delay for radar station
export const MISSILE_INITIAL_DELAY_SILO_MIN = 4.5; // Initial delay for bunker silo before first missile
export const MISSILE_INITIAL_DELAY_SILO_MAX = 7.5; // Max initial delay for bunker silo

// Enemy Anti-Aircraft (AA) Flak Artillery (Ground Pits & Rooftop Mounts)
export const AA_GUN_RANGE = 460;                  // Radial maximum engagement range
export const AA_GUN_HORIZONTAL_RANGE = 460;       // Max horizontal distance along ground to engage
export const AA_GUN_FIRE_RATE = 0.085;            // Burst fire cadence: duration between consecutive shots in a burst (seconds)
export const AA_GUN_BURST_INTERVAL = 0.085;       // Alias for duration per shot in an active burst
export const AA_GUN_BURST_MIN_SHOTS = 3;          // Minimum tracer shells per firing burst
export const AA_GUN_BURST_MAX_SHOTS = 5;          // Maximum tracer shells per firing burst
export const AA_GUN_COOLDOWN_BASE = 1.4;          // Base reload cooldown between burst barrages (seconds)
export const AA_GUN_COOLDOWN_VARIANCE = 1.6;      // Random variance added between burst barrages
export const AA_GUN_INITIAL_DELAY_MIN = 1.2;      // Min starting cooldown before first AA burst in sector
export const AA_GUN_INITIAL_DELAY_MAX = 3.0;      // Max starting cooldown before first AA burst in sector
export const ENEMY_BULLET_SPEED = 260;            // Observable anti-aircraft tracer shell speed
export const ENEMY_BULLET_DAMAGE = 2;             // Observable anti-aircraft tracer chipping damage

// Player Spitfire Weaponry & Armor (Intense Gunfire & Strafing)
export const PLANE_MAX_HULL = 100;
export const PLAYER_BULLET_DAMAGE = 25;           // Strafe damage: 4 direct hits demolishes enemy installations!
export const PLAYER_BULLET_SPEED = 540;           // High-velocity .303 Browning stream
export const MACHINE_GUN_COOLDOWN = 0.065;        // Player Browning machine gun cadence (seconds between rounds)
export const ENEMY_MISSILE_DAMAGE = 25;           // Catastrophic heavy blast damage (25% of hull)

// Scoring
export const SCORE_ENEMY_DESTROYED = 250;
export const SCORE_MISSILE_EVADED = 100;
export const SCORE_MISSILE_INTERCEPTED = 350; // Extra bonus points for hitting a missile with a bomb!
export const SCORE_MISSILE_HIT = 350;         // Backwards compatibility alias
export const PENALTY_CIVILIAN_HIT = 150;
export const BONUS_SECTOR_CLEAR = 500;
export const BONUS_PERFECT_CIVILIAN = 600;

// Palettes & Theming
export const PALETTE = {
  plane: {
    body: '#4a6741',       // British dark green camouflage
    camoBrown: '#5c4533',   // Earth brown pattern
    belly: '#9aaab3',      // Sky grey undersurface
    roundelBlue: '#153a6b',
    roundelWhite: '#ffffff',
    roundelRed: '#ba2626',
    roundelYellow: '#eab308',
    cockpit: '#b2e2f8',
    propeller: '#282b30',
  },
  enemy: {
    main: '#292524',        // Dark bunker slate
    trim: '#dc2626',        // Alert red
    highlight: '#f59e0b',   // Hazard amber
    siren: '#ef4444',
  },
  civilian: {
    brick: '#b45309',       // Warm terracotta
    brownstone: '#78350f',
    plaster: '#f5efe6',
    roofSlate: '#475569',
    windowWarm: '#fef08a',  // Cozy lit window
  },
};

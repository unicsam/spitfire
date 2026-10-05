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

// Missile Mechanics (Miniature Tactical Rockets)
export const MISSILE_SPEED = 135;              // Measured, readable speed
export const MISSILE_TURN_RATE = 1.35;         // Max steering angle per sec (rad/s)
export const MISSILE_FUEL_DURATION = 5.2;      // Lifespan
export const MISSILE_DETECTION_RANGE = 480;    // Proximity detection

// Hull Armor & Gunfire System (Smaller Damage)
export const PLANE_MAX_HULL = 100;
export const ENEMY_BULLET_DAMAGE = 10;          // Smaller chipping damage (10% of hull)
export const ENEMY_MISSILE_DAMAGE = 50;         // Catastrophic heavy blast damage (50% of hull)
export const PLAYER_BULLET_DAMAGE = 20;
export const PLAYER_BULLET_SPEED = 480;         // High-velocity .303 Browning stream
export const ENEMY_BULLET_SPEED = 240;          // Observable anti-aircraft tracer shell speed
export const MACHINE_GUN_COOLDOWN = 0.11;       // Rapid staccato burst rate
export const AA_GUN_RANGE = 380;                // Flak & machine gun range

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

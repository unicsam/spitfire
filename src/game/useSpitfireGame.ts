import { useState, useRef, useEffect, useCallback } from 'react';
import {
  GameState,
  Building,
  Bomb,
  Missile,
  Bullet,
  Particle,
  FloatingText,
  SpitfirePlane,
  MissionStats,
  SectorConfig
} from '../types/game';
import {
  PLANE_CRUISE_Y,
  PLANE_CRUISE_SPEED,
  PLANE_LOOP_RADIUS,
  PLANE_LOOP_DURATION,
  GROUND_Y,
  CANVAS_VIRTUAL_WIDTH,
  BOMB_INITIAL_FORWARD_BOOST,
  BOMB_GRAVITY,
  BOMB_COOLDOWN,
  BOMB_SPLASH_RADIUS,
  MISSILE_SPEED,
  MISSILE_TURN_RATE,
  MISSILE_FUEL_DURATION,
  MISSILE_DETECTION_RANGE,
  PLANE_MAX_HULL,
  ENEMY_BULLET_DAMAGE,
  ENEMY_MISSILE_DAMAGE,
  PLAYER_BULLET_DAMAGE,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  MACHINE_GUN_COOLDOWN,
  AA_GUN_RANGE,
  SCORE_ENEMY_DESTROYED,
  SCORE_MISSILE_EVADED,
  SCORE_MISSILE_HIT,
  PENALTY_CIVILIAN_HIT,
  BONUS_SECTOR_CLEAR,
  BONUS_PERFECT_CIVILIAN
} from './constants';
import { SECTORS, generateSectorBuildings } from './cityGenerator';
import { sound } from '../audio/soundEngine';
import { GameRenderer } from './renderer';

export function useSpitfireGame() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0);
  const [stats, setStats] = useState<MissionStats>({
    sectorIndex: 0,
    score: 0,
    enemyNeutralized: 0,
    enemyTotal: 4,
    civilianHit: 0,
    civilianTotal: 16,
    missilesEvaded: 0,
    bombsDropped: 0,
    directHits: 0,
    approachRun: 1,
    maxApproachRuns: 2,
    sectorProgress: 0,
  });

  const [planeLives, setPlaneLives] = useState(3);
  const [hullHealth, setHullHealth] = useState(PLANE_MAX_HULL);
  const [bombCooldownRemaining, setBombCooldownRemaining] = useState(0);
  const [isLoopingState, setIsLoopingState] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // References for Game Loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const approachRunRef = useRef<number>(1);

  const planeRef = useRef<SpitfirePlane>({
    x: 180,
    y: PLANE_CRUISE_Y,
    baseY: PLANE_CRUISE_Y,
    angle: 0,
    speed: PLANE_CRUISE_SPEED,
    direction: 1,
    isTurning180: false,
    turnProgress: 0,
    turnDuration: 1.6,
    isLooping: false,
    loopProgress: 0,
    loopCenterX: 180,
    loopCenterY: PLANE_CRUISE_Y - PLANE_LOOP_RADIUS,
    loopRadius: PLANE_LOOP_RADIUS,
    propellerAngle: 0,
    lives: 3,
    hullHealth: PLANE_MAX_HULL,
    maxHullHealth: PLANE_MAX_HULL,
    invulnerableTime: 0,
    bombCooldown: 0,
    standingLoopCooldown: 0,
    machineGunCooldown: 0,
  });

  const buildingsRef = useRef<Building[]>([]);
  const bombsRef = useRef<Bomb[]>([]);
  const missilesRef = useRef<Missile[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const gameTimeRef = useRef<number>(0);
  const cameraXRef = useRef<number>(0);
  const loopCameraAnchorRef = useRef<number>(0);
  const isLoopHeldRef = useRef<boolean>(false);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameIdRef = useRef<number | null>(null);

  // High score in local storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('spitfire_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });

  const currentSectorConfig: SectorConfig = SECTORS[currentSectorIndex % SECTORS.length];

  // Initialize a Sector
  const initSector = useCallback((sectorIdx: number, preserveScore: number = 0) => {
    const config = SECTORS[sectorIdx % SECTORS.length];
    const generated = generateSectorBuildings(config);
    buildingsRef.current = generated;
    bombsRef.current = [];
    missilesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    const enemyCount = generated.filter(b => b.type === 'ENEMY').length;
    const civilianCount = generated.filter(b => b.type === 'CIVILIAN').length;

    planeRef.current = {
      x: 180,
      y: PLANE_CRUISE_Y,
      baseY: PLANE_CRUISE_Y,
      angle: 0,
      speed: PLANE_CRUISE_SPEED,
      direction: 1,
      isTurning180: false,
      turnProgress: 0,
      turnDuration: 1.6,
      isLooping: false,
      loopProgress: 0,
      loopCenterX: 180,
      loopCenterY: PLANE_CRUISE_Y - PLANE_LOOP_RADIUS,
      loopRadius: PLANE_LOOP_RADIUS,
      propellerAngle: 0,
      lives: 3,
      hullHealth: PLANE_MAX_HULL,
      maxHullHealth: PLANE_MAX_HULL,
      invulnerableTime: 0,
      bombCooldown: 0,
      standingLoopCooldown: 0,
      machineGunCooldown: 0,
      isCrashing: false,
    };

    cameraXRef.current = 0;
    approachRunRef.current = 1;
    setPlaneLives(3);
    setHullHealth(PLANE_MAX_HULL);
    setCurrentSectorIndex(sectorIdx);
    setStats({
      sectorIndex: sectorIdx,
      score: preserveScore,
      enemyNeutralized: 0,
      enemyTotal: enemyCount,
      civilianHit: 0,
      civilianTotal: civilianCount,
      missilesEvaded: 0,
      bombsDropped: 0,
      directHits: 0,
      approachRun: 1,
      maxApproachRuns: config.maxApproachRuns ?? 2,
      sectorProgress: 0,
    });
  }, []);

  // Action A: Drop Bomb
  const dropBomb = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const plane = planeRef.current;
    if (plane.bombCooldown > 0 || plane.isTurning180) return;

    let bombVx: number;
    let bombVy: number;
    const angle = plane.angle;
    const dir = plane.direction;

    if (plane.isLooping) {
      // Instantaneous velocity during aerobatic loop
      const phi = plane.loopProgress * Math.PI * 2;
      const omega = (Math.PI * 2) / PLANE_LOOP_DURATION;
      const loopVx = dir * plane.loopRadius * omega * Math.cos(phi);
      const loopVy = -plane.loopRadius * omega * Math.sin(phi);

      // Ejection velocity outward along plane belly
      const ejectSpeed = 40;
      const ejectVx = -Math.sin(angle) * ejectSpeed * dir;
      const ejectVy = Math.cos(angle) * ejectSpeed;

      bombVx = loopVx + ejectVx;
      bombVy = loopVy + ejectVy;
    } else {
      bombVx = dir * plane.speed * BOMB_INITIAL_FORWARD_BOOST;
      bombVy = 20;
    }

    // Spawn position adjusted to plane's current orientation
    const spawnX = plane.x + Math.cos(angle) * (4 * dir) - Math.sin(angle) * 8;
    const spawnY = plane.y + Math.sin(angle) * 4 + Math.cos(angle) * 8;

    const newBomb: Bomb = {
      id: `bomb-${Date.now()}-${Math.random()}`,
      x: spawnX,
      y: spawnY,
      vx: bombVx,
      vy: bombVy,
      rotation: Math.atan2(bombVy, bombVx),
      vRot: 0.5,
      age: 0,
      alive: true,
      trajectoryHistory: [{ x: spawnX, y: spawnY }],
    };

    bombsRef.current.push(newBomb);
    plane.bombCooldown = BOMB_COOLDOWN;
    setBombCooldownRemaining(BOMB_COOLDOWN);
    setStats(prev => ({ ...prev, bombsDropped: prev.bombsDropped + 1 }));
    sound.playBombDrop();
  }, [gameState]);

  // Action B: Standing Loop (Hold to continuous roll)
  const startStandingLoop = useCallback(() => {
    isLoopHeldRef.current = true;
    if (gameState !== 'PLAYING') return;
    const plane = planeRef.current;
    if (plane.isTurning180 || plane.isLooping) return;

    plane.isLooping = true;
    plane.loopProgress = 0;
    plane.loopCenterX = plane.x;
    plane.loopCenterY = plane.baseY - PLANE_LOOP_RADIUS;
    plane.loopRadius = PLANE_LOOP_RADIUS;
    plane.standingLoopCooldown = 0;
    loopCameraAnchorRef.current = cameraXRef.current;

    setIsLoopingState(true);
    sound.updateEnginePitch(true);
  }, [gameState]);

  const stopStandingLoop = useCallback(() => {
    isLoopHeldRef.current = false;
  }, []);

  const performStandingLoop = useCallback(() => {
    startStandingLoop();
  }, [startStandingLoop]);

  const fireMachineGun = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const plane = planeRef.current;
    if (plane.isTurning180 || plane.machineGunCooldown > 0) return;

    plane.machineGunCooldown = MACHINE_GUN_COOLDOWN;
    const dir = plane.direction;
    const angles = plane.angle;
    const cosA = Math.cos(angles);
    const sinA = Math.sin(angles);

    // Twin Browning .303 machine gun stream from port and starboard wing roots
    [-5, 5].forEach((offsetY) => {
      const muzzleX = plane.x + cosA * (dir * 22) - sinA * offsetY;
      const muzzleY = plane.y + sinA * (dir * 22) + cosA * offsetY;
      const bulletVx = dir * PLAYER_BULLET_SPEED * cosA;
      const bulletVy = dir * PLAYER_BULLET_SPEED * sinA;

      bulletsRef.current.push({
        id: `bullet-p-${Date.now()}-${Math.random()}`,
        x: muzzleX,
        y: muzzleY,
        vx: bulletVx,
        vy: bulletVy,
        isPlayer: true,
        damage: PLAYER_BULLET_DAMAGE,
        alive: true,
        life: 1.0,
        color: '#fef08a',
      });
    });

    sound.playMachineGun();
  }, [gameState]);

  // Particle helper
  const spawnExplosion = useCallback((x: number, y: number, isLarge: boolean = false) => {
    const count = isLarge ? 24 : 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (isLarge ? 110 : 70);
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        color: ['#ff4400', '#ff9900', '#ffee00', '#ffffff', '#777777'][Math.floor(Math.random() * 5)],
        size: 2.5 + Math.random() * (isLarge ? 5 : 3.5),
        maxLife: 0.45 + Math.random() * 0.35,
        life: 0.45 + Math.random() * 0.35,
        type: 'fire',
        alpha: 1,
      });
    }

    // Shockwave (tight, precise visual)
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: isLarge ? 42 : 28,
      maxLife: 0.28,
      life: 0.28,
      type: 'shockwave',
      alpha: 0.8,
    });
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string, isPenalty: boolean = false) => {
    floatingTextsRef.current.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      life: 1.2,
      maxLife: 1.2,
      isPenalty,
    });
  }, []);

  // Initiate Dramatic Falling Crash Dive (instead of blasting plane in air)
  const initiateFatalCrash = useCallback((plane: SpitfirePlane, sourceX: number, sourceY: number) => {
    plane.lives = 0;
    setPlaneLives(0);
    plane.hullHealth = 0;
    setHullHealth(0);
    plane.isCrashing = true;
    plane.isLooping = false;
    plane.isTurning180 = false;
    plane.crashVy = 35;
    plane.crashVx = plane.direction * plane.speed * 0.85;
    plane.invulnerableTime = 0;

    sound.stopEngine();
    sound.playCrashDiveScream();
    sound.playExplosion(false);
    rendererRef.current?.triggerScreenShake(12, 0.4);

    for (let i = 0; i < 18; i++) {
      particlesRef.current.push({
        x: sourceX,
        y: sourceY,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        color: Math.random() > 0.5 ? '#ea580c' : '#1c1917',
        size: 3 + Math.random() * 4,
        maxLife: 0.6,
        life: 0.6,
        type: 'fire',
        alpha: 0.9,
      });
    }

    addFloatingText("MAYDAY! DIVE IMPACT! AIM FOR ENEMY TARGETS!", plane.x, plane.y - 25, '#ef4444', true);
  }, [addFloatingText]);

  // Update Game Physics
  const updatePhysics = useCallback((dt: number) => {
    const plane = planeRef.current;
    gameTimeRef.current += dt;
    const nowTime = gameTimeRef.current;

    // Cooldown ticks
    if (plane.bombCooldown > 0) {
      plane.bombCooldown = Math.max(0, plane.bombCooldown - dt);
      setBombCooldownRemaining(plane.bombCooldown);
    }
    if (plane.standingLoopCooldown > 0) {
      plane.standingLoopCooldown = Math.max(0, plane.standingLoopCooldown - dt);
    }
    if (plane.invulnerableTime > 0) {
      plane.invulnerableTime = Math.max(0, plane.invulnerableTime - dt);
    }

    // Propeller spinning
    plane.propellerAngle += dt * 38;

    // 1. Plane Movement (Fatal Crash Dive, 180 Combat Turn, Standing Loop, or Cruising)
    if (plane.isCrashing) {
      // Allow slight player steering during the crash dive so they can aim onto enemy targets!
      let steerForward = 0;
      if (keysRef.current['arrowleft'] || keysRef.current['a']) {
        steerForward -= 70 * dt * plane.direction;
      }
      if (keysRef.current['arrowright'] || keysRef.current['d']) {
        steerForward += 70 * dt * plane.direction;
      }
      let steerVertical = 0;
      if (keysRef.current['arrowup'] || keysRef.current['w']) {
        steerVertical -= 50 * dt; // Shallow glide
      }
      if (keysRef.current['arrowdown'] || keysRef.current['s'] || keysRef.current[' ']) {
        steerVertical += 90 * dt; // Steep dive bomb!
      }

      plane.crashVx = (plane.crashVx ?? plane.direction * 100) + steerForward * plane.direction;
      plane.crashVy = Math.max(25, (plane.crashVy ?? 35) + (230 + steerVertical) * dt);

      plane.x += plane.crashVx * dt;
      plane.y += plane.crashVy * dt;
      plane.angle = Math.atan2(plane.crashVy, plane.crashVx);

      // Camera smoothly follows falling aircraft
      const targetCam = plane.direction === 1 ? plane.x - 220 : plane.x - 700;
      cameraXRef.current += (targetCam - cameraXRef.current) * Math.min(1, dt * 7);

      // Heavy trailing fire and smoke plume
      for (let s = 0; s < 2; s++) {
        particlesRef.current.push({
          x: plane.x + (Math.random() - 0.5) * 6,
          y: plane.y + (Math.random() - 0.5) * 6,
          vx: -plane.crashVx * 0.35 + (Math.random() - 0.5) * 25,
          vy: -plane.crashVy * 0.35 + (Math.random() - 0.5) * 25 - 6,
          color: ['#171717', '#262626', '#ea580c', '#f59e0b', '#78716c'][Math.floor(Math.random() * 5)],
          size: 3.5 + Math.random() * 4,
          maxLife: 0.65 + Math.random() * 0.35,
          life: 0.65 + Math.random() * 0.35,
          type: Math.random() > 0.5 ? 'fire' : 'smoke',
          alpha: 0.9,
        });
      }

      // Check Building Collision while crashing down
      let crashResolved = false;
      for (const bldg of buildingsRef.current) {
        if (bldg.destroyed) continue;
        const bldgTop = GROUND_Y - bldg.height;
        const hitX = plane.x >= bldg.x - 8 && plane.x <= bldg.x + bldg.width + 8;
        const hitY = plane.y >= bldgTop && plane.y <= GROUND_Y;

        if (hitX && hitY) {
          plane.isCrashing = false;
          crashResolved = true;
          spawnExplosion(plane.x, plane.y, true);
          sound.playExplosion(true);
          rendererRef.current?.triggerScreenShake(16, 0.6);

          if (bldg.type === 'ENEMY') {
            // HEROIC SACRIFICE / KAMIKAZE TARGET HIT!
            handleBuildingDestruction(bldg, true, false);
            addFloatingText("HEROIC CRASH IMPACT! +500", plane.x, bldgTop - 25, '#22c55e');
            setStats(prev => ({ ...prev, score: prev.score + 500 }));

            // Check if all enemy targets destroyed -> MISSION CLEARED!
            const remaining = buildingsRef.current.filter(b => b.type === 'ENEMY' && !b.destroyed).length;
            if (remaining === 0) {
              setTimeout(() => {
                setStats(prev => ({ ...prev, score: prev.score + BONUS_SECTOR_CLEAR }));
                sound.playVictoryFanfare();
                setGameState('SECTOR_CLEAR');
              }, 700);
              return;
            }
          } else {
            handleBuildingDestruction(bldg, true, false);
            addFloatingText("CRASH LANDING COLLATERAL!", plane.x, bldgTop - 25, '#ef4444', true);
          }

          setTimeout(() => {
            setGameState('GAME_OVER');
          }, 1100);
          return;
        }
      }

      if (crashResolved) return;

      // Check Ground Collision while crashing down
      if (plane.y >= GROUND_Y - 4) {
        plane.isCrashing = false;
        spawnExplosion(plane.x, GROUND_Y, true);
        sound.playExplosion(false);
        rendererRef.current?.triggerScreenShake(14, 0.5);
        addFloatingText("AIRCRAFT DESTROYED ON IMPACT", plane.x, GROUND_Y - 25, '#ef4444', true);

        // Ground crash blast catches adjacent enemy buildings!
        for (const bldg of buildingsRef.current) {
          if (bldg.destroyed) continue;
          const distToBldg = Math.abs(plane.x - (bldg.x + bldg.width / 2));
          if (distToBldg < (bldg.width / 2 + 30)) {
            if (bldg.type === 'ENEMY') {
              handleBuildingDestruction(bldg, true, false);
              addFloatingText("CRASH BLAST DESTROYED BASE! +500", plane.x, GROUND_Y - 35, '#22c55e');
              setStats(prev => ({ ...prev, score: prev.score + 500 }));

              const remaining = buildingsRef.current.filter(b => b.type === 'ENEMY' && !b.destroyed).length;
              if (remaining === 0) {
                setTimeout(() => {
                  setStats(prev => ({ ...prev, score: prev.score + BONUS_SECTOR_CLEAR }));
                  sound.playVictoryFanfare();
                  setGameState('SECTOR_CLEAR');
                }, 700);
                return;
              }
            }
            break;
          }
        }

        setTimeout(() => {
          setGameState('GAME_OVER');
        }, 1000);
        return;
      }
    } else if (plane.isTurning180) {
      plane.turnProgress += dt / plane.turnDuration;
      const p = plane.turnProgress;

      // Climbing arc up into the turn and swooping back to cruising level
      plane.y = plane.baseY - 45 * Math.sin(p * Math.PI);
      // Slight forward carry during reversal
      plane.x += Math.cos(p * Math.PI) * plane.speed * 0.35 * dt;

      // Smooth camera swing from Eastbound view (plane.x - 220) to Westbound view (plane.x - 720)
      const eastCam = plane.x - 220;
      const westCam = plane.x - 720;
      cameraXRef.current = eastCam + (westCam - eastCam) * p;

      // Vapor ribbon during turn
      if (Math.random() < 0.7) {
        particlesRef.current.push({
          x: plane.x,
          y: plane.y + 4,
          vx: (Math.random() - 0.5) * 10,
          vy: 10,
          color: '#ffffff',
          size: 2.2,
          maxLife: 0.4,
          life: 0.4,
          type: 'smoke',
          alpha: 0.6,
        });
      }

      if (plane.turnProgress >= 1) {
        plane.isTurning180 = false;
        plane.direction = -1; // Heading WEST!
        plane.turnProgress = 0;
        plane.y = plane.baseY;
        plane.angle = 0;
        approachRunRef.current = 2;
        setStats(prev => ({ ...prev, approachRun: 2 }));
        addFloatingText("APPROACH RUN 2/2 · SWEEPING WEST", plane.x, plane.y - 25, '#38bdf8');
        sound.updateEnginePitch(false);
      }
    } else if (plane.isLooping) {
      plane.loopProgress += dt / PLANE_LOOP_DURATION;

      if (plane.loopProgress >= 1) {
        if (isLoopHeldRef.current) {
          // Key or Button is STILL actively being held down right now!
          // Seamlessly roll again!
          plane.loopProgress = 0;
          plane.loopCenterX = plane.x;
          sound.updateEnginePitch(true);
        } else {
          // Button/key was released! Return to level cruising immediately!
          plane.isLooping = false;
          plane.loopProgress = 0;
          plane.x = plane.loopCenterX;
          plane.y = plane.baseY;
          plane.angle = 0;
          plane.standingLoopCooldown = 0;
          setIsLoopingState(false);
          sound.updateEnginePitch(false);
        }
      } else {
        const phi = plane.loopProgress * Math.PI * 2;
        const R = plane.loopRadius;
        const dir = plane.direction;

        // Circular loop: respects current heading direction
        plane.x = plane.loopCenterX + dir * R * Math.sin(phi);
        plane.y = (plane.baseY - R) + R * Math.cos(phi);

        // Strict clamp: never touch or exceed the upper sky boundary
        plane.y = Math.max(50, Math.min(plane.baseY, plane.y));

        // Smooth continuous 360-degree heading angle
        plane.angle = -phi;

        // Wingtip vapor particles
        if (Math.random() < 0.6) {
          particlesRef.current.push({
            x: plane.x - Math.cos(plane.angle) * (12 * dir),
            y: plane.y - Math.sin(plane.angle) * 12,
            vx: -Math.cos(plane.angle) * (8 * dir),
            vy: -Math.sin(plane.angle) * 8,
            color: '#ffffff',
            size: 2.0,
            maxLife: 0.35,
            life: 0.35,
            type: 'smoke',
            alpha: 0.5,
          });
        }
      }
      cameraXRef.current = loopCameraAnchorRef.current;
    } else {
      // Normal cruising: East (+X) or West (-X)
      plane.x += plane.direction * plane.speed * dt;
      plane.y = plane.baseY;
      plane.angle = 0;

      // Smooth camera framing:
      // Eastbound: plane framed at 220px from left
      // Westbound: plane framed at 220px from right (740px from left)
      const targetCam = plane.direction === 1
        ? plane.x - 220
        : plane.x - 720;
      cameraXRef.current += (targetCam - cameraXRef.current) * Math.min(1, dt * 6);
    }

    // Engine Battle Damage Smoke Plume (when plane is hit, low hull, or low life)
    const isPlaneDamaged = plane.hullHealth < 100 || plane.lives <= 1 || plane.invulnerableTime > 0;
    if (isPlaneDamaged) {
      const isCritical = plane.hullHealth <= 40 || plane.lives === 1;
      const isExtreme = plane.hullHealth <= 20 || plane.lives === 1;
      const smokeChance = isExtreme ? 0.95 : (isCritical ? 0.75 : 0.45);

      if (Math.random() < smokeChance) {
        const dir = plane.direction;
        const cosA = Math.cos(plane.angle);
        const sinA = Math.sin(plane.angle);
        const exhaustOffsetX = -dir * 18;
        const exhaustOffsetY = -2;
        const exX = plane.x + cosA * exhaustOffsetX - sinA * exhaustOffsetY;
        const exY = plane.y + sinA * exhaustOffsetX + cosA * exhaustOffsetY;

        particlesRef.current.push({
          x: exX + (Math.random() - 0.5) * 5,
          y: exY + (Math.random() - 0.5) * 5,
          vx: -dir * (plane.speed * 0.4 + Math.random() * 25),
          vy: (Math.random() - 0.5) * 16 - (isCritical ? 14 : 6),
          color: isExtreme
            ? (Math.random() > 0.4 ? '#171717' : (Math.random() > 0.4 ? '#262626' : '#ea580c'))
            : (isCritical
              ? (Math.random() > 0.5 ? '#292524' : '#44403c')
              : (Math.random() > 0.5 ? '#78716c' : '#a8a29e')),
          size: (isCritical ? 3.5 : 2.2) + Math.random() * 2.5,
          maxLife: isCritical ? 0.75 : 0.5,
          life: isCritical ? 0.75 : 0.5,
          type: (isExtreme && Math.random() > 0.6) ? 'spark' : 'smoke',
          alpha: isCritical ? 0.85 : 0.6,
        });
      }
    }

    // Building destruction handler with friendly-fire scoring rules
    const handleBuildingDestruction = (bldg: Building, causedByPlayer: boolean, isFriendlyFire: boolean = false) => {
      if (bldg.destroyed) return;
      bldg.destroyed = true;
      bldg.hp = 0;
      const bldgTop = GROUND_Y - bldg.height;

      if (bldg.type === 'ENEMY') {
        sound.playExplosion(true);
        const earnedScore = SCORE_ENEMY_DESTROYED;

        setStats(prev => {
          const newScore = prev.score + earnedScore;
          const newNeut = prev.enemyNeutralized + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            try { localStorage.setItem('spitfire_high_score', newScore.toString()); } catch {}
          }
          return {
            ...prev,
            score: newScore,
            enemyNeutralized: newNeut,
            directHits: prev.directHits + (causedByPlayer ? 1 : 0),
          };
        });

        if (bldg.isRadarUnit) {
          addFloatingText("RADAR HQ DESTROYED · AIR DEFENSES BLINDED!", bldg.x + bldg.width / 2, bldgTop - 25, '#38bdf8');
          // EMP shockwave spark burst
          for (let i = 0; i < 24; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 60 + Math.random() * 120;
            particlesRef.current.push({
              x: bldg.x + bldg.width / 2,
              y: bldgTop,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              color: Math.random() > 0.4 ? '#38bdf8' : '#facc15',
              size: 2.5,
              maxLife: 0.6,
              life: 0.6,
              type: 'spark',
              alpha: 0.9,
            });
          }

          // Scramble radar network of connected and nearby enemy installations
          for (const targetBldg of buildingsRef.current) {
            if (targetBldg.id === bldg.id || targetBldg.type !== 'ENEMY' || targetBldg.destroyed) continue;
            const isLinked = targetBldg.linkedRadarId === bldg.id || Math.abs(targetBldg.x - bldg.x) < 750;
            if (isLinked) {
              targetBldg.isJammed = true;
              targetBldg.missileCooldown = 1.0 + Math.random() * 1.5;
              addFloatingText("RADAR LOST · GUIDANCE SCRAMBLED!", targetBldg.x + targetBldg.width / 2, GROUND_Y - targetBldg.height - 15, '#f59e0b');

              for (let s = 0; s < 6; s++) {
                particlesRef.current.push({
                  x: targetBldg.x + targetBldg.width / 2 + (Math.random() - 0.5) * targetBldg.width,
                  y: GROUND_Y - targetBldg.height,
                  vx: (Math.random() - 0.5) * 40,
                  vy: -30 - Math.random() * 40,
                  color: '#f59e0b',
                  size: 2,
                  maxLife: 0.5,
                  life: 0.5,
                  type: 'spark',
                  alpha: 0.8,
                });
              }
            }
          }

          // In-flight missiles immediately lose lock and turn haywire
          for (const m of missilesRef.current) {
            if (m.sourceBuildingId === bldg.id || buildingsRef.current.some(b => b.id === m.sourceBuildingId && b.isJammed)) {
              m.isHaywire = true;
              m.overshot = true;
              m.wobblePhase = Math.random() * Math.PI * 2;
              m.wobbleSpeed = 14 + Math.random() * 8;
              m.angle += (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.7);
              m.vx = Math.cos(m.angle) * m.speed;
              m.vy = Math.sin(m.angle) * m.speed;
            }
          }
        } else {
          if (isFriendlyFire) {
            addFloatingText(`+${earnedScore} FRIENDLY FIRE HIT!`, bldg.x + bldg.width / 2, bldgTop - 15, '#22c55e');
          } else {
            addFloatingText(`+${earnedScore} TARGET DESTROYED!`, bldg.x + bldg.width / 2, bldgTop - 15, '#22c55e');
          }
        }

        // Check if all enemy targets in sector destroyed
        const remainingEnemies = buildingsRef.current.filter(b => b.type === 'ENEMY' && !b.destroyed).length;
        if (remainingEnemies === 0) {
          setTimeout(() => {
            let bonus = BONUS_SECTOR_CLEAR;
            const playerCivilianHitCount = stats.civilianHit;
            if (playerCivilianHitCount === 0) {
              bonus += BONUS_PERFECT_CIVILIAN;
            }
            setStats(prev => ({ ...prev, score: prev.score + bonus }));
            sound.playVictoryFanfare();
            setGameState('SECTOR_CLEAR');
          }, 600);
        }
      } else {
        // CIVILIAN BUILDING
        sound.playExplosion(false);
        if (causedByPlayer) {
          // PLAYER BOMB COLLATERAL HIT -> Deduct points and count against player
          sound.playCivilianStrikeWarning();
          setStats(prev => ({
            ...prev,
            score: Math.max(0, prev.score - PENALTY_CIVILIAN_HIT),
            civilianHit: prev.civilianHit + 1,
          }));
          addFloatingText(`-${PENALTY_CIVILIAN_HIT} COLLATERAL DAMAGE!`, bldg.x + bldg.width / 2, bldgTop - 15, '#ef4444', true);
        } else {
          // ENEMY MISSILE FRIENDLY FIRE / COLLATERAL:
          // Rule: DO NOT DEDUCT POINTS! Player gets no penalty for enemy's stray missiles!
          addFloatingText("ENEMY MISSILE COLLATERAL!", bldg.x + bldg.width / 2, bldgTop - 15, '#f59e0b');
        }
      }
    };

    // 2. Bombs Physics & Exaggerated Arc
    for (const b of bombsRef.current) {
      if (!b.alive) continue;
      b.age += dt;
      b.vy += BOMB_GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rotation = Math.atan2(b.vy, b.vx);

      // Trajectory trail history
      if (b.trajectoryHistory.length === 0 || Math.hypot(b.x - b.trajectoryHistory[b.trajectoryHistory.length - 1].x, b.y - b.trajectoryHistory[b.trajectoryHistory.length - 1].y) > 16) {
        b.trajectoryHistory.push({ x: b.x, y: b.y });
        if (b.trajectoryHistory.length > 20) b.trajectoryHistory.shift();
      }

      // 1. Check Building Direct Touch / Impact (Bomb MUST first touch the building to detonate)
      let bombImpacted = false;
      for (const bldg of buildingsRef.current) {
        if (bldg.destroyed) continue;
        const bldgTop = GROUND_Y - bldg.height;
        // Direct physical contact with the building (touching roof or side)
        const touchesBuilding = b.x >= bldg.x - 2 && b.x <= bldg.x + bldg.width + 2 && b.y >= bldgTop && b.y <= GROUND_Y;

        if (touchesBuilding) {
          b.alive = false;
          bombImpacted = true;
          spawnExplosion(b.x, b.y, true);
          rendererRef.current?.triggerScreenShake(7, 0.28);
          // Demolish the struck target precisely without wiping neighboring civilian buildings
          handleBuildingDestruction(bldg, true, false);
          break;
        }
      }

      if (bombImpacted) continue;

      // 2. Hit Ground Check (Bomb MUST first touch the ground / street before detonating)
      if (b.y >= GROUND_Y) {
        b.alive = false;
        spawnExplosion(b.x, GROUND_Y, true);
        sound.playExplosion(false);
        rendererRef.current?.triggerScreenShake(5, 0.22);

        // Ground Impact: Destroy single closest building if the bomb landed right next to its base (within BOMB_SPLASH_RADIUS = 20px)
        let closestBldg: Building | null = null;
        let minBldgDist = BOMB_SPLASH_RADIUS;

        for (const bldg of buildingsRef.current) {
          if (bldg.destroyed) continue;
          const closestX = Math.max(bldg.x, Math.min(b.x, bldg.x + bldg.width));
          const distToBldg = Math.abs(b.x - closestX);

          if (distToBldg <= minBldgDist) {
            minBldgDist = distToBldg;
            closestBldg = bldg;
          }
        }

        if (closestBldg) {
          handleBuildingDestruction(closestBldg, true, false);
        }
        continue;
      }
    }

    // 3. Radar Active Dish Tracking & Missile Launching
    for (const bldg of buildingsRef.current) {
      if (bldg.type !== 'ENEMY' || bldg.destroyed) continue;

      // Active swiveling radar dish points directly at the Spitfire in real-time
      if (bldg.isRadarUnit) {
        const dishX = bldg.x + bldg.width / 2;
        const dishY = GROUND_Y - bldg.height - 8;
        bldg.radarTrackAngle = Math.atan2(plane.y - dishY, plane.x - dishX);
      }

      // Distance to plane
      const distToPlane = Math.abs(plane.x - (bldg.x + bldg.width / 2));
      // Approaching or over: works for BOTH Eastbound (Pass 1) and Westbound (Pass 2)!
      const isApproachingOrOver = plane.direction === 1
        ? (plane.x < bldg.x + bldg.width + 160)
        : (plane.x > bldg.x - 160);

      if (distToPlane < MISSILE_DETECTION_RANGE && isApproachingOrOver) {
        bldg.missileCooldown -= dt;
        if (bldg.missileCooldown <= 0) {
          const isHaywire = !!bldg.isJammed;
          // Noticeably lower launching frequency for balanced, tactical gameplay
          const fireInterval = bldg.isRadarUnit ? 4.8 : (isHaywire ? 3.8 : 6.2);
          bldg.missileCooldown = (fireInterval / currentSectorConfig.missileFireRateFactor) + Math.random() * 2.2;

          const launchX = bldg.x + bldg.width / 2;
          const launchY = GROUND_Y - bldg.height - 10;

          let launchVx: number;
          let launchVy: number;
          let launchAngle: number;

          if (isHaywire) {
            // MISSILE FIRES IN THE WRONG DIRECTION!
            // Launch backwards/away from the plane with erratic spread!
            const wrongDir = -plane.direction;
            const spread = (Math.random() - 0.5) * 1.4;
            launchVx = wrongDir * (MISSILE_SPEED * (0.45 + Math.random() * 0.35)) + spread * 65;
            launchVy = -MISSILE_SPEED * (0.65 + Math.random() * 0.35);
            launchAngle = Math.atan2(launchVy, launchVx);

            missilesRef.current.push({
              id: `missile-${Date.now()}-${Math.random()}`,
              x: launchX,
              y: launchY,
              vx: launchVx,
              vy: launchVy,
              speed: MISSILE_SPEED * 0.88,
              angle: launchAngle,
              fuel: MISSILE_FUEL_DURATION * 0.95,
              alive: true,
              sourceBuildingId: bldg.id,
              overshot: true, // Blind guidance
              isHaywire: true,
              wobblePhase: Math.random() * Math.PI * 2,
              wobbleSpeed: 12 + Math.random() * 8,
              smokeTimer: 0,
            });

            sound.playMissileLaunch();
            addFloatingText("HAYWIRE MISSILE FIRED!", launchX, launchY - 20, '#f97316');
          } else {
            // Normal Guided Surface-to-Air Missile (aims toward incoming plane)
            const leadDir = plane.direction;
            launchVx = leadDir * (MISSILE_SPEED * 0.35);
            launchVy = -MISSILE_SPEED * 0.92;
            launchAngle = Math.atan2(launchVy, launchVx);

            missilesRef.current.push({
              id: `missile-${Date.now()}-${Math.random()}`,
              x: launchX,
              y: launchY,
              vx: launchVx,
              vy: launchVy,
              speed: MISSILE_SPEED,
              angle: launchAngle,
              fuel: MISSILE_FUEL_DURATION,
              alive: true,
              sourceBuildingId: bldg.id,
              overshot: false,
              isHaywire: false,
              smokeTimer: 0,
            });

            sound.playMissileLaunch();
            addFloatingText(bldg.isRadarUnit ? "RADAR SAM LAUNCHED!" : "MISSILE LAUNCHED!", launchX, launchY - 20, '#f59e0b');
          }
        }
      }
    }

    // 4. Missile Tracking & Overshoot Physics
    for (const m of missilesRef.current) {
      if (!m.alive) continue;
      m.fuel -= dt;
      if (m.fuel <= 0) {
        m.alive = false;
        spawnExplosion(m.x, m.y, false);
        continue;
      }

      // Tracking steering logic (or Haywire erratic corkscrew in wrong direction)
      if (m.isHaywire) {
        // Haywire flight: wobbles, corkscrews and tumbles away in the wrong direction!
        m.wobblePhase = (m.wobblePhase ?? 0) + (m.wobbleSpeed ?? 12) * dt;
        m.angle += Math.sin(m.wobblePhase) * 3.8 * dt;
      } else if (!m.overshot) {
        const dx = plane.x - m.x;
        const dy = plane.y - m.y;
        const targetAngle = Math.atan2(dy, dx);
        let angleDelta = targetAngle - m.angle;

        // Normalize delta to [-PI, PI]
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;

        // Check for Tactical Standing Loop Evasion:
        const dist = Math.hypot(dx, dy);
        if (plane.isLooping && dist < 130 && (Math.abs(angleDelta) > 1.1 || m.y < plane.y + 15)) {
          m.overshot = true;
          setStats(prev => {
            const newScore = prev.score + SCORE_MISSILE_EVADED;
            if (newScore > highScore) {
              setHighScore(newScore);
              try { localStorage.setItem('spitfire_high_score', newScore.toString()); } catch {}
            }
            return {
              ...prev,
              score: newScore,
              missilesEvaded: prev.missilesEvaded + 1,
            };
          });
          sound.playEvadedChime();
          addFloatingText(`+${SCORE_MISSILE_EVADED} EVADED!`, m.x, m.y - 14, '#38bdf8');
        } else {
          // Slow, deliberate tracking turn rate
          const maxTurn = MISSILE_TURN_RATE * dt;
          m.angle += Math.sign(angleDelta) * Math.min(Math.abs(angleDelta), maxTurn);
        }
      }

      // Advance missile
      m.vx = Math.cos(m.angle) * m.speed;
      m.vy = Math.sin(m.angle) * m.speed;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Exhaust smoke puffs (sputtering sparks if haywire)
      m.smokeTimer += dt;
      if (m.smokeTimer > 0.05) {
        m.smokeTimer = 0;
        particlesRef.current.push({
          x: m.x - Math.cos(m.angle) * 8,
          y: m.y - Math.sin(m.angle) * 8,
          vx: -Math.cos(m.angle) * 14 + (Math.random() - 0.5) * (m.isHaywire ? 16 : 6),
          vy: -Math.sin(m.angle) * 14 + (Math.random() - 0.5) * (m.isHaywire ? 16 : 6),
          color: m.isHaywire ? (Math.random() > 0.5 ? '#f97316' : '#78716c') : (m.overshot ? '#94a3b8' : '#e2e8f0'),
          size: (m.isHaywire ? 2.0 : 1.5) + Math.random() * 1.5,
          maxLife: 0.35,
          life: 0.35,
          type: m.isHaywire && Math.random() > 0.4 ? 'spark' : 'smoke',
          alpha: 0.65,
        });
      }

      // Collision with buildings (Erratic / returning missiles crashing into structures)
      let missileHitBuilding = false;
      for (const bldg of buildingsRef.current) {
        if (bldg.destroyed) continue;
        const bldgTop = GROUND_Y - bldg.height;
        const isSelfLaunchGrace = (m.sourceBuildingId === bldg.id && m.fuel > MISSILE_FUEL_DURATION - 0.25);
        if (isSelfLaunchGrace) continue;

        const inX = m.x >= bldg.x - 4 && m.x <= bldg.x + bldg.width + 4;
        const inY = m.y >= bldgTop && m.y <= GROUND_Y;

        if (inX && inY) {
          m.alive = false;
          missileHitBuilding = true;
          spawnExplosion(m.x, m.y, true);
          rendererRef.current?.triggerScreenShake(7, 0.25);
          handleBuildingDestruction(bldg, false, bldg.type === 'ENEMY');
          break;
        }
      }

      if (missileHitBuilding) continue;

      // Collision with ground (Missile slamming into street level)
      if (m.y >= GROUND_Y - 4) {
        m.alive = false;
        spawnExplosion(m.x, GROUND_Y - 4, false);
        sound.playExplosion(false);

        // Ground blast radius catches immediately adjacent structures
        for (const bldg of buildingsRef.current) {
          if (bldg.destroyed) continue;
          const distToBldgCenter = Math.abs(m.x - (bldg.x + bldg.width / 2));
          if (distToBldgCenter < (bldg.width / 2 + 18)) {
            handleBuildingDestruction(bldg, false, bldg.type === 'ENEMY');
            break;
          }
        }
        continue;
      }

      // Collision with bombs (can bomb blow up missile in air?)
      for (const b of bombsRef.current) {
        if (!b.alive) continue;
        if (Math.hypot(b.x - m.x, b.y - m.y) < 24) {
          b.alive = false;
          m.alive = false;
          spawnExplosion(m.x, m.y, true);
          sound.playExplosion(true);
          setStats(prev => ({ ...prev, score: prev.score + SCORE_MISSILE_HIT }));
          addFloatingText(`+${SCORE_MISSILE_HIT} INTERCEPTED!`, m.x, m.y - 12, '#fbbf24');

          // If the missile was just emerging from a silo or within splash range of a roof,
          // the bomb's explosion detonates and destroys the building below it!
          for (const bldg of buildingsRef.current) {
            if (bldg.destroyed) continue;
            const bldgTop = GROUND_Y - bldg.height;
            const isOverBuilding = m.x >= bldg.x - 14 && m.x <= bldg.x + bldg.width + 14;
            const distToRoof = Math.abs(m.y - bldgTop);
            if (isOverBuilding && distToRoof < 65) {
              handleBuildingDestruction(bldg, true, false);
              break;
            }
          }
          break;
        }
      }

      // Collision with Spitfire
      if (plane.invulnerableTime <= 0) {
        const hitDist = Math.hypot(plane.x - m.x, plane.y - m.y);
        if (hitDist < 18) {
          m.alive = false;
          spawnExplosion(plane.x, plane.y, true);
          sound.playExplosion(false);
          rendererRef.current?.triggerScreenShake(10, 0.35);

          // Heavy missile blast damage (50 HP)
          plane.hullHealth = Math.max(0, plane.hullHealth - ENEMY_MISSILE_DAMAGE);
          setHullHealth(plane.hullHealth);
          plane.invulnerableTime = 1.2;

          if (plane.hullHealth <= 0) {
            const nextLives = plane.lives - 1;
            plane.lives = nextLives;
            setPlaneLives(nextLives);
            addFloatingText("CRITICAL HIT · LIFE LOST!", plane.x, plane.y - 20, '#ef4444', true);

            if (nextLives <= 0) {
              // FATAL HIT: Don't blast in mid-air! Initiate dramatic falling crash dive!
              initiateFatalCrash(plane, plane.x, plane.y);
              return;
            } else {
              plane.hullHealth = PLANE_MAX_HULL;
              setHullHealth(PLANE_MAX_HULL);
              plane.invulnerableTime = 2.2;
            }
          } else {
            addFloatingText(`-50 HULL BLAST! (${plane.hullHealth}%)`, plane.x, plane.y - 20, '#ef4444', true);
          }
        }
      }
    }

    // 5. Enemy Anti-Aircraft (AA) Gunfire Simulation
    for (const bldg of buildingsRef.current) {
      if (bldg.type !== 'ENEMY' || bldg.destroyed) continue;

      const distToPlane = Math.abs(plane.x - (bldg.x + bldg.width / 2));
      // In range and not jammed
      if (distToPlane < AA_GUN_RANGE && !bldg.isJammed) {
        bldg.aaGunCooldown = (bldg.aaGunCooldown ?? 1.5) - dt;
        if (bldg.aaGunCooldown <= 0) {
          // Trigger a 3-round rapid tracer burst!
          bldg.aaBurstCount = 3;
          bldg.aaBurstTimer = 0.02;
          bldg.aaGunCooldown = 2.2 / currentSectorConfig.missileFireRateFactor + Math.random() * 1.6;
        }
      }

      // Process active burst
      if ((bldg.aaBurstCount ?? 0) > 0) {
        bldg.aaBurstTimer = (bldg.aaBurstTimer ?? 0) - dt;
        if (bldg.aaBurstTimer <= 0) {
          bldg.aaBurstCount = (bldg.aaBurstCount ?? 0) - 1;
          bldg.aaBurstTimer = 0.1; // 100ms interval between rounds in burst

          const gunX = bldg.x + bldg.width / 2 + (Math.random() - 0.5) * 8;
          const gunY = GROUND_Y - bldg.height - 4;

          // Aim at Spitfire flight path with lead prediction
          const targetX = plane.x + (plane.direction * plane.speed * 0.35) + (Math.random() - 0.5) * 35;
          const targetY = plane.y + (Math.random() - 0.5) * 20;
          const angle = Math.atan2(targetY - gunY, targetX - gunX);

          bulletsRef.current.push({
            id: `bullet-e-${Date.now()}-${Math.random()}`,
            x: gunX,
            y: gunY,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
            isPlayer: false,
            damage: ENEMY_BULLET_DAMAGE, // Smaller damage: 10 HP!
            alive: true,
            life: 2.2,
            color: '#ef4444',
          });

          sound.playAABullet();
        }
      }
    }

    // 6. Bullets Update & Hit Detection (Smaller Damage & Interceptions)
    if (plane.machineGunCooldown > 0) {
      plane.machineGunCooldown -= dt;
    }

    for (const b of bulletsRef.current) {
      if (!b.alive) continue;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.life <= 0 || b.y > GROUND_Y || b.y < -50) {
        b.alive = false;
        continue;
      }

      if (!b.isPlayer) {
        // ENEMY BULLET vs SPITFIRE (Smaller Damage: 10 HP)
        if (plane.invulnerableTime <= 0) {
          const hitDist = Math.hypot(plane.x - b.x, plane.y - b.y);
          if (hitDist < 16) {
            b.alive = false;
            if (plane.isLooping) {
              // Tactical loop acrobatics dodges / deflects tracers!
              addFloatingText("DODGED!", plane.x, plane.y - 12, '#38bdf8');
              setStats(prev => ({ ...prev, score: prev.score + 25 }));
            } else {
              // SMALLER DAMAGE CHIP (10 HP)
              plane.hullHealth = Math.max(0, plane.hullHealth - b.damage);
              setHullHealth(plane.hullHealth);
              rendererRef.current?.triggerScreenShake(2.5, 0.12);
              sound.playBulletHit();

              // Metal sparks flying off Spitfire fuselage
              for (let s = 0; s < 4; s++) {
                particlesRef.current.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 60,
                  vy: (Math.random() - 0.5) * 60,
                  color: '#facc15',
                  size: 1.5,
                  maxLife: 0.25,
                  life: 0.25,
                  type: 'spark',
                  alpha: 0.8,
                });
              }

              if (plane.hullHealth <= 0) {
                // Lost 1 life!
                const nextLives = plane.lives - 1;
                plane.lives = nextLives;
                setPlaneLives(nextLives);
                addFloatingText("HULL BREACHED · LIFE LOST!", plane.x, plane.y - 20, '#ef4444', true);

                if (nextLives <= 0) {
                  // FATAL HIT: Don't blast in mid-air! Initiate dramatic falling crash dive!
                  initiateFatalCrash(plane, plane.x, plane.y);
                  return;
                } else {
                  plane.hullHealth = PLANE_MAX_HULL;
                  setHullHealth(PLANE_MAX_HULL);
                  plane.invulnerableTime = 2.0;
                }
              } else {
                addFloatingText(`-${b.damage} HULL (${plane.hullHealth}%)`, plane.x, plane.y - 15, '#f59e0b');
              }
            }
          }
        }
      } else {
        // PLAYER BULLET vs INCOMING MISSILES & ENEMY TARGETS
        // 1. Intercept missiles in air with gunfire!
        for (const m of missilesRef.current) {
          if (!m.alive) continue;
          if (Math.hypot(m.x - b.x, m.y - b.y) < 18) {
            b.alive = false;
            m.alive = false;
            spawnExplosion(m.x, m.y, false);
            sound.playExplosion(false);
            setStats(prev => ({ ...prev, score: prev.score + 150 }));
            addFloatingText("+150 SHOT DOWN!", m.x, m.y - 12, '#38bdf8');
            break;
          }
        }

        // 2. Strafe enemy buildings/radar
        for (const bldg of buildingsRef.current) {
          if (bldg.destroyed) continue;
          if (b.x >= bldg.x && b.x <= bldg.x + bldg.width && b.y >= GROUND_Y - bldg.height && b.y <= GROUND_Y) {
            b.alive = false;
            for (let s = 0; s < 3; s++) {
              particlesRef.current.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 50,
                vy: -Math.random() * 50,
                color: '#facc15',
                size: 1.5,
                maxLife: 0.2,
                life: 0.2,
                type: 'spark',
                alpha: 0.7,
              });
            }
            break;
          }
        }
      }
    }

    // 7. Particles Update
    for (const p of particlesRef.current) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'fire' || p.type === 'debris') {
        p.vy += 80 * dt; // slight gravity
      }
    }
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // 6. Floating Texts Update
    for (const ft of floatingTextsRef.current) {
      ft.life -= dt;
      ft.y -= 25 * dt; // float upwards
    }
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

    // Cleanup dead entities (generous bounds so Pass 2 missiles don't prematurely vanish)
    bombsRef.current = bombsRef.current.filter(b => b.alive && b.y <= GROUND_Y + 10);
    missilesRef.current = missilesRef.current.filter(m =>
      m.alive && m.y > -350 && m.x > cameraXRef.current - 350 && m.x < cameraXRef.current + CANVAS_VIRTUAL_WIDTH + 350
    );

    // 7. City Perimeter & Approach Pass Control (Tight Turn-Around Post: No time wasted in empty air!)
    let firstBldgX = 400;
    let lastBldgX = 1800;
    if (buildingsRef.current.length > 0) {
      firstBldgX = buildingsRef.current[0].x;
      const lastBldg = buildingsRef.current[buildingsRef.current.length - 1];
      lastBldgX = lastBldg.x + lastBldg.width;
    }

    // Return turn post is placed tight right after the last building (140px clearance)!
    const turnPostEast = lastBldgX + 140;
    // Return post west is placed tight right before the first building (140px clearance)!
    const turnPostWest = Math.max(80, firstBldgX - 140);

    const citySpan = Math.max(400, turnPostEast - turnPostWest);
    const progress = plane.direction === 1
      ? Math.min(1, Math.max(0, (plane.x - turnPostWest) / citySpan))
      : Math.min(1, Math.max(0, (turnPostEast - plane.x) / citySpan));
    setStats(prev => ({ ...prev, sectorProgress: progress }));

    // Boundary for Pass 1 (Eastbound):
    if (plane.direction === 1 && plane.x >= turnPostEast && !plane.isTurning180) {
      const remainingEnemies = buildingsRef.current.filter(b => b.type === 'ENEMY' && !b.destroyed).length;
      if (remainingEnemies === 0) {
        // Sector clear!
        let bonus = BONUS_SECTOR_CLEAR;
        const civilianHitCount = buildingsRef.current.filter(b => b.type === 'CIVILIAN' && b.destroyed).length;
        if (civilianHitCount === 0) {
          bonus += BONUS_PERFECT_CIVILIAN;
        }
        setStats(prev => ({ ...prev, score: prev.score + bonus }));
        sound.playVictoryFanfare();
        setGameState('SECTOR_CLEAR');
      } else {
        // Automatic 180° Combat Turn immediately after clearing the city!
        plane.isTurning180 = true;
        plane.turnProgress = 0;
        plane.turnDuration = 1.35; // Brisk, snappy turn
        sound.updateEnginePitch(true);
        addFloatingText("180° COMBAT TURN · INITIATING RETURN PASS", plane.x, plane.y - 25, '#f59e0b');
        bombsRef.current = [];
        missilesRef.current = [];
      }
    }

    // Boundary for Pass 2 (Westbound):
    if (plane.direction === -1 && plane.x <= turnPostWest && !plane.isTurning180) {
      const remainingEnemies = buildingsRef.current.filter(b => b.type === 'ENEMY' && !b.destroyed).length;
      if (remainingEnemies === 0) {
        // Sector clear on return pass!
        let bonus = BONUS_SECTOR_CLEAR;
        const civilianHitCount = buildingsRef.current.filter(b => b.type === 'CIVILIAN' && b.destroyed).length;
        if (civilianHitCount === 0) {
          bonus += BONUS_PERFECT_CIVILIAN;
        }
        setStats(prev => ({ ...prev, score: prev.score + bonus }));
        sound.playVictoryFanfare();
        setGameState('SECTOR_CLEAR');
      } else {
        // Final pass exhausted and bases survived!
        sound.playCivilianStrikeWarning();
        sound.stopEngine();
        setGameState('MISSION_FAILED');
      }
    }

    // Update screen shake
    rendererRef.current?.updateShake(dt);
  }, [highScore, spawnExplosion, addFloatingText, currentSectorConfig]);

  // Main Render Loop
  const loop = useCallback((time: number) => {
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.08);
    lastTimeRef.current = time;

    if (gameState === 'PLAYING') {
      updatePhysics(dt);
    }

    const canvas = canvasRef.current;
    if (canvas && rendererRef.current) {
      rendererRef.current.clear();
      rendererRef.current.render(
        planeRef.current,
        cameraXRef.current,
        buildingsRef.current,
        bombsRef.current,
        missilesRef.current,
        bulletsRef.current,
        particlesRef.current,
        floatingTextsRef.current,
        currentSectorConfig,
        gameTimeRef.current
      );
    }

    animationFrameIdRef.current = requestAnimationFrame(loop);
  }, [gameState, updatePhysics, currentSectorConfig]);

  // Start Animation Frame
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [loop]);

  // Attach Canvas context on mount
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        rendererRef.current = new GameRenderer(ctx);
      }
    }
  }, []);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyF' || e.code === 'KeyC' || e.code === 'KeyJ' || e.code === 'KeyX' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        e.preventDefault();
        fireMachineGun();
      } else if (e.code === 'Space' || e.key === ' ' || e.code === 'KeyZ' || e.code === 'KeyA') {
        e.preventDefault();
        dropBomb();
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyS' || e.code === 'KeyL') {
        e.preventDefault();
        if (!e.repeat) {
          startStandingLoop();
        }
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          sound.stopEngine();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          sound.startEngine();
          setGameState('PLAYING');
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        const nextMute = sound.toggleMute();
        setIsMuted(nextMute);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyS' || e.code === 'KeyL') {
        stopStandingLoop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dropBomb, startStandingLoop, stopStandingLoop, fireMachineGun, gameState]);

  // Game Lifecycle Control Methods
  const startGame = useCallback(() => {
    initSector(0, 0);
    sound.startEngine();
    setGameState('PLAYING');
  }, [initSector]);

  const nextSector = useCallback(() => {
    const nextIdx = currentSectorIndex + 1;
    initSector(nextIdx, stats.score);
    sound.startEngine();
    setGameState('PLAYING');
  }, [currentSectorIndex, initSector, stats.score]);

  const restartSector = useCallback(() => {
    initSector(currentSectorIndex, stats.score);
    sound.startEngine();
    setGameState('PLAYING');
  }, [currentSectorIndex, initSector, stats.score]);

  const restartFromBeginning = useCallback(() => {
    initSector(0, 0);
    sound.startEngine();
    setGameState('PLAYING');
  }, [initSector]);

  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      sound.stopEngine();
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      sound.startEngine();
      setGameState('PLAYING');
    }
  }, [gameState]);

  const toggleSoundMute = useCallback(() => {
    const next = sound.toggleMute();
    setIsMuted(next);
  }, []);

  return {
    canvasRef,
    gameState,
    setGameState,
    stats,
    planeLives,
    hullHealth,
    bombCooldownRemaining,
    isLoopingState,
    isMuted,
    highScore,
    currentSectorConfig,
    currentSectorIndex,
    dropBomb,
    fireMachineGun,
    performStandingLoop,
    startStandingLoop,
    stopStandingLoop,
    startGame,
    nextSector,
    restartSector,
    restartFromBeginning,
    togglePause,
    toggleSoundMute,
  };
}

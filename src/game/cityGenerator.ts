import { Building, SectorConfig, GroundGun } from '../types/game';
import {
  GROUND_Y,
  MISSILE_INITIAL_DELAY_RADAR_MIN,
  MISSILE_INITIAL_DELAY_RADAR_MAX,
  MISSILE_INITIAL_DELAY_SILO_MIN,
  MISSILE_INITIAL_DELAY_SILO_MAX,
  AA_GUN_INITIAL_DELAY_MIN,
  AA_GUN_INITIAL_DELAY_MAX,
} from './constants';

export const SECTORS: SectorConfig[] = [
  {
    sectorNumber: 1,
    name: "Sector 1: Suburban Outskirts",
    subtitle: "Recon & Elimination",
    briefing: "Enemy anti-aircraft silos have deployed on the city outskirts. Neutralize all 4 designated enemy targets with precision bomb drops. Watch for light AA ground fire.",
    cityLength: 3200,
    enemyTargetsCount: 4,
    civilianBuildingsCount: 16,
    missileFireRateFactor: 0.75,
    skyTheme: 'dawn',
  },
  {
    sectorNumber: 2,
    name: "Sector 2: Industrial Docks & Naval Yard",
    subtitle: "Harbor Bombing Run",
    briefing: "Coastal radar hubs and missile stations are controlling the harbor. Forward distances are tight. Execute your Standing Loop to dodge tracking missiles and tracer bursts.",
    cityLength: 3800,
    enemyTargetsCount: 5,
    civilianBuildingsCount: 20,
    missileFireRateFactor: 0.85,
    skyTheme: 'noon',
  },
  {
    sectorNumber: 3,
    name: "Sector 3: Downtown Metro Center",
    subtitle: "Precision Urban Surgical Strike",
    briefing: "Fortified enemy bunkers are embedded right beside high-rise civilian apartments. Zero collateral damage will be rewarded with the Precision Medal.",
    cityLength: 4400,
    enemyTargetsCount: 6,
    civilianBuildingsCount: 24,
    missileFireRateFactor: 0.95,
    skyTheme: 'sunset',
  },
  {
    sectorNumber: 4,
    name: "Sector 4: The Citadel Stronghold",
    subtitle: "Night Fortress Infiltration",
    briefing: "Enemy towers launch rapid-fire tracking rockets under night cover. Master your flight stalling, bomb releases, and machine gun strafing.",
    cityLength: 5000,
    enemyTargetsCount: 7,
    civilianBuildingsCount: 26,
    missileFireRateFactor: 1.05,
    skyTheme: 'night',
  },
  {
    sectorNumber: 5,
    name: "Sector 5: Iron Valley Rail Depot",
    subtitle: "Strategic Supply Interdiction",
    briefing: "Thunderstorm front over the armored railway depot. Flak emplacements spray continuous 20mm tracer fire. Destroy the Mobile Radar Unit to scramble their guidance network.",
    cityLength: 5600,
    enemyTargetsCount: 8,
    civilianBuildingsCount: 26,
    missileFireRateFactor: 1.15,
    skyTheme: 'stormy',
  },
  {
    sectorNumber: 6,
    name: "Sector 6: Coastal Flak Fortress",
    subtitle: "Atlantic Wall Penetration",
    briefing: "Heavily fortified coastal bastion with overlapping radar command stations. Heavy anti-aircraft flak blankets the airspace at cruising altitude.",
    cityLength: 6200,
    enemyTargetsCount: 9,
    civilianBuildingsCount: 28,
    missileFireRateFactor: 1.25,
    skyTheme: 'dusk',
  },
  {
    sectorNumber: 7,
    name: "Sector 7: Chemical Complex & Testing Labs",
    subtitle: "Hazardous Research Demolition",
    briefing: "Deep industrial valley shrouded in toxic mist. Multiple mobile radar units coordinate rapid SAM batteries. Eliminate radar stations first to induce haywire missile launches.",
    cityLength: 6800,
    enemyTargetsCount: 10,
    civilianBuildingsCount: 28,
    missileFireRateFactor: 1.35,
    skyTheme: 'overcast',
  },
  {
    sectorNumber: 8,
    name: "Sector 8: Imperial High Command Bastion",
    subtitle: "Final Decisive Air Offensive",
    briefing: "The final supreme stronghold of the occupation force. Blood-red skies, dual searchlight arrays, and maximum flak density. All squadrons cleared for decisive strike!",
    cityLength: 7600,
    enemyTargetsCount: 12,
    civilianBuildingsCount: 30,
    missileFireRateFactor: 1.45,
    skyTheme: 'midnight_crimson',
  },
];

const CIVILIAN_NAMES = [
  "St. Jude's Belltower", "Rosewood Apartments", "Mercantile Bakery", "Old Mill Tavern",
  "Cobblestone Manor", "Grand City Library", "Green Cross Infirmary", "Riverdale Flats",
  "Boutique Patisserie", "Kensington Court", "Civic Conservatory", "Wellington Row",
  "Mayfair Haberdashery", "Highland Terraces", "St. Luke's Chapel", "Town Square Emporium"
];

const ENEMY_NAMES = [
  "V-1 Launch Silo", "Radar Listening Bunker", "Flak Command Post", "Armored War Depot",
  "Sub-Station Fortress", "Radio Jamming Tower", "Heavy Artillery Emplacement"
];

export function generateSectorBuildings(config: SectorConfig): Building[] {
  const buildings: Building[] = [];
  const startX = 380; // Snappy runway orientation without wasted dead space
  const availableLength = config.cityLength - 800;

  // Decide slots for enemy buildings fairly evenly spaced with civilian buffers
  const totalBuildings = config.enemyTargetsCount + config.civilianBuildingsCount;
  const enemyStep = Math.floor(totalBuildings / (config.enemyTargetsCount + 1));
  const enemyIndices = new Set<number>();

  for (let i = 1; i <= config.enemyTargetsCount; i++) {
    const idx = Math.min(totalBuildings - 2, Math.max(2, i * enemyStep + (i % 2 === 0 ? 1 : -1)));
    enemyIndices.add(idx);
  }

  let currentX = startX;
  let enemyCounter = 0;
  let civilianCounter = 0;
  let currentRadarId: string | undefined = undefined;

  for (let i = 0; i < totalBuildings; i++) {
    const isEnemy = enemyIndices.has(i);
    const spacing = 18 + Math.floor(Math.random() * 24); // Gap between buildings

    if (isEnemy) {
      enemyCounter++;
      // Designate early-warning Radar Command units (1st or 2nd enemy unit, and mid-sector unit for larger sectors)
      const isRadarUnit = enemyCounter === 1 || (config.enemyTargetsCount >= 6 && enemyCounter === 4);
      const bldgId = isRadarUnit ? `radar-unit-${i}-${Date.now()}` : `enemy-${i}-${Date.now()}`;

      if (isRadarUnit) {
        currentRadarId = bldgId;
        const width = 58;
        const height = 40; // Ground mobile tactical chassis
        buildings.push({
          id: bldgId,
          type: 'ENEMY',
          isRadarUnit: true,
          isJammed: false,
          x: currentX,
          width,
          height,
          hp: 1,
          maxHp: 1,
          destroyed: false,
          name: "Mobile Radar Station",
          themeStyle: {
            baseColor: '#1e293b',
            trimColor: '#38bdf8',
            roofType: 'radar',
            hasAntenna: true,
            hasRadar: true,
            hasHazardStripes: true,
            windowRows: 1,
            windowCols: 3,
          },
          missileCooldown: MISSILE_INITIAL_DELAY_RADAR_MIN + Math.random() * (MISSILE_INITIAL_DELAY_RADAR_MAX - MISSILE_INITIAL_DELAY_RADAR_MIN),
          aaGunCooldown: AA_GUN_INITIAL_DELAY_MIN + Math.random() * (AA_GUN_INITIAL_DELAY_MAX - AA_GUN_INITIAL_DELAY_MIN),
          aaBurstCount: 0,
          aaBurstTimer: 0,
          radarAngle: 0,
          radarTrackAngle: 0,
        });
        currentX += width + spacing;
      } else {
        const width = 56 + Math.floor(Math.random() * 18);
        const height = 80 + Math.floor(Math.random() * 45);
        const name = ENEMY_NAMES[(enemyCounter - 1) % ENEMY_NAMES.length];

        buildings.push({
          id: bldgId,
          type: 'ENEMY',
          isRadarUnit: false,
          isJammed: false,
          linkedRadarId: currentRadarId,
          x: currentX,
          width,
          height,
          hp: 1,
          maxHp: 1,
          destroyed: false,
          name,
          themeStyle: {
            baseColor: '#2b2927',
            trimColor: '#dc2626',
            roofType: i % 2 === 0 ? 'radar' : 'silo',
            hasAntenna: true,
            hasRadar: true,
            hasHazardStripes: true,
            windowRows: Math.max(1, Math.floor(height / 28)),
            windowCols: Math.max(1, Math.floor(width / 22)),
          },
          missileCooldown: MISSILE_INITIAL_DELAY_SILO_MIN + Math.random() * (MISSILE_INITIAL_DELAY_SILO_MAX - MISSILE_INITIAL_DELAY_SILO_MIN),
          aaGunCooldown: AA_GUN_INITIAL_DELAY_MIN + Math.random() * (AA_GUN_INITIAL_DELAY_MAX - AA_GUN_INITIAL_DELAY_MIN),
          aaBurstCount: 0,
          aaBurstTimer: 0,
          radarAngle: Math.random() * Math.PI,
        });
        currentX += width + spacing;
      }
    } else {
      // Civilian buildings using the new building assets (intact_01..06 and destroyed_01..06)
      const assetVariant = (civilianCounter % 6) + 1;
      // Proportions matching the PNG aspect ratios (approx 50-62px wide, 85-115px tall, safe below cruise altitude y=150)
      const variantSpecs: Record<number, { width: number; height: number }> = {
        1: { width: 54, height: 90 },   // 230 x 380 (ratio 1.65)
        2: { width: 56, height: 92 },   // 246 x 397 (ratio 1.61)
        3: { width: 58, height: 84 },   // 242 x 349 (ratio 1.44)
        4: { width: 52, height: 110 },  // 227 x 493 (ratio 2.17, taller high-rise)
        5: { width: 54, height: 92 },   // 222 x 376 (ratio 1.69)
        6: { width: 62, height: 78 },   // 260 x 324 (ratio 1.25, wider townhouse)
      };
      const spec = variantSpecs[assetVariant] ?? { width: 55, height: 90 };
      const width = spec.width;
      const height = spec.height;
      const name = CIVILIAN_NAMES[civilianCounter % CIVILIAN_NAMES.length];
      civilianCounter++;

      const roofTypes: ('gable' | 'mansard' | 'dome' | 'flat')[] = ['gable', 'mansard', 'flat', 'dome'];
      const roofType = roofTypes[i % roofTypes.length];
      const baseColors = ['#a04f2f', '#7c3a20', '#d8c29d', '#5d6778', '#8a4b38', '#b86a45'];
      const baseColor = baseColors[i % baseColors.length];

      buildings.push({
        id: `civ-${i}-${Date.now()}`,
        type: 'CIVILIAN',
        x: currentX,
        width,
        height,
        hp: 1,
        maxHp: 1,
        destroyed: false,
        name,
        assetVariant,
        themeStyle: {
          baseColor,
          trimColor: '#f1e6d0',
          roofType,
          hasAntenna: false,
          hasRadar: false,
          hasHazardStripes: false,
          windowRows: Math.max(1, Math.floor(height / 24)),
          windowCols: Math.max(1, Math.floor(width / 18)),
        },
        missileCooldown: 99999,
      });

      currentX += width + spacing;
    }
  }

  return buildings;
}

export function generateSectorGroundGuns(buildings: Building[], config?: SectorConfig): GroundGun[] {
  const guns: GroundGun[] = [];

  // 1. Single forward approach outpost in the open field (well before first building)
  guns.push({
    id: `gg-approach-${Date.now()}`,
    x: 210,
    y: GROUND_Y,
    width: 28,
    height: 18,
    destroyed: false,
    gunType: 'checkpoint_flak',
    cooldown: AA_GUN_INITIAL_DELAY_MIN + Math.random() * (AA_GUN_INITIAL_DELAY_MAX - AA_GUN_INITIAL_DELAY_MIN),
    burstCount: 0,
    burstTimer: 0,
    aimAngle: -Math.PI * 0.46,
    recoilOffset: 0,
    name: "Forward Outpost Flak Battery",
  });

  // 2. Rooftop AA Turrets safely mounted ONLY on Enemy Military Bunkers
  // (Zero civilian proximity risk: bombing the designated enemy target neutralizes the turret)
  let enemyRoofGunCount = 0;
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    if (b.type === 'ENEMY') {
      enemyRoofGunCount++;
      // Mount rooftop flak on select fortified enemy command installations
      if (enemyRoofGunCount % 2 === 1 || b.isRadarUnit) {
        const roofY = GROUND_Y - b.height;
        guns.push({
          id: `gg-roof-${b.id}`,
          x: b.x + b.width * 0.28,
          y: roofY,
          width: 22,
          height: 14,
          destroyed: false,
          gunType: 'bunker_roof_flak',
          cooldown: AA_GUN_INITIAL_DELAY_MIN + Math.random() * (AA_GUN_INITIAL_DELAY_MAX - AA_GUN_INITIAL_DELAY_MIN),
          burstCount: 0,
          burstTimer: 0,
          aimAngle: -Math.PI * 0.5,
          recoilOffset: 0,
          isRooftop: true,
          buildingId: b.id,
          name: "Rooftop Fortified Flak Turret",
        });
      }
    }
  }

  // 3. At most 1 isolated ground flak emplacement at an enemy depot clearing (at least 75px clear of civilians)
  for (let i = 0; i < buildings.length - 1; i++) {
    const b1 = buildings[i];
    const b2 = buildings[i + 1];
    const gapStart = b1.x + b1.width;
    const gapEnd = b2.x;
    const gapWidth = gapEnd - gapStart;

    // Only place in a wide military buffer gap between enemy facilities or after an enemy complex
    if (b1.type === 'ENEMY' && gapWidth >= 40) {
      guns.push({
        id: `gg-military-depot-${Date.now()}`,
        x: gapStart + gapWidth / 2,
        y: GROUND_Y,
        width: 26,
        height: 18,
        destroyed: false,
        gunType: 'concrete_emplacement',
        cooldown: AA_GUN_INITIAL_DELAY_MIN + Math.random() * (AA_GUN_INITIAL_DELAY_MAX - AA_GUN_INITIAL_DELAY_MIN),
        burstCount: 0,
        burstTimer: 0,
        aimAngle: -Math.PI * 0.5,
        recoilOffset: 0,
        name: "Military Depot 20mm Flak",
      });
      break; // Only 1 ground depot flak in the city!
    }
  }

  // 4. Single rear perimeter boundary gun in the open field past the final building
  if (buildings.length > 0) {
    const lastBldg = buildings[buildings.length - 1];
    const exitBase = lastBldg.x + lastBldg.width;

    guns.push({
      id: `gg-exit-${Date.now()}`,
      x: exitBase + 75,
      y: GROUND_Y,
      width: 28,
      height: 18,
      destroyed: false,
      gunType: 'sandbag_flak',
      cooldown: AA_GUN_INITIAL_DELAY_MIN + Math.random() * (AA_GUN_INITIAL_DELAY_MAX - AA_GUN_INITIAL_DELAY_MIN),
      burstCount: 0,
      burstTimer: 0,
      aimAngle: -Math.PI * 0.52,
      recoilOffset: 0,
      name: "Rear Perimeter Boundary Flak",
    });
  }

  return guns;
}

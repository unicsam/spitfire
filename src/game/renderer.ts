import { Building, Bomb, Missile, Bullet, Particle, FloatingText, SpitfirePlane, SectorConfig, GroundGun } from '../types/game';
import { GROUND_Y, PALETTE, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT } from './constants';

import intact01 from '../assets/buildings/intact_01.png';
import intact02 from '../assets/buildings/intact_02.png';
import intact03 from '../assets/buildings/intact_03.png';
import intact04 from '../assets/buildings/intact_04.png';
import intact05 from '../assets/buildings/intact_05.png';
import intact06 from '../assets/buildings/intact_06.png';

import destroyed01 from '../assets/buildings/destroyed_01.png';
import destroyed02 from '../assets/buildings/destroyed_02.png';
import destroyed03 from '../assets/buildings/destroyed_03.png';
import destroyed04 from '../assets/buildings/destroyed_04.png';
import destroyed05 from '../assets/buildings/destroyed_05.png';
import destroyed06 from '../assets/buildings/destroyed_06.png';

import mountainPanoramaSrc from '../assets/parallax/mountain_panorama.png';

const INTACT_SOURCES = [intact01, intact02, intact03, intact04, intact05, intact06];
const DESTROYED_SOURCES = [destroyed01, destroyed02, destroyed03, destroyed04, destroyed05, destroyed06];

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private shakeTime: number = 0;
  private shakeMagnitude: number = 0;
  private intactImages: HTMLImageElement[] = [];
  private destroyedImages: HTMLImageElement[] = [];
  private mountainPanoramaImg: HTMLImageElement | null = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.loadBuildingAssets();
    this.loadParallaxAssets();
  }

  private loadBuildingAssets() {
    this.intactImages = INTACT_SOURCES.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
    this.destroyedImages = DESTROYED_SOURCES.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  private loadParallaxAssets() {
    const img = new Image();
    img.src = mountainPanoramaSrc;
    this.mountainPanoramaImg = img;
  }

  public triggerScreenShake(magnitude: number = 6, duration: number = 0.25) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  public updateShake(dt: number) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) {
        this.shakeMagnitude = 0;
      }
    }
  }

  public clear() {
    this.ctx.clearRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
  }

  public render(
    plane: SpitfirePlane,
    cameraX: number,
    buildings: Building[],
    bombs: Bomb[],
    missiles: Missile[],
    bullets: Bullet[] = [],
    particles: Particle[] = [],
    floatingTexts: FloatingText[] = [],
    sector: SectorConfig,
    gameTime: number,
    groundGuns: GroundGun[] = []
  ) {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake
    if (this.shakeTime > 0) {
      const sx = (Math.random() - 0.5) * this.shakeMagnitude * (this.shakeTime / 0.25);
      const sy = (Math.random() - 0.5) * this.shakeMagnitude * (this.shakeTime / 0.25);
      ctx.translate(sx, sy);
    }

    // 1. Sky & Sun/Moon
    this.drawSky(sector, gameTime);

    // 2. Parallax Distant Layer
    this.drawDistantHills(cameraX, sector);

    // 3. Parallax Midground Layer
    this.drawMidgroundSkyline(cameraX, sector);

    // 4. Ground / Street Bed
    this.drawGround(cameraX);

    // 5. Buildings & Perimeter
    this.drawBuildings(buildings, cameraX, sector, gameTime);

    // 5.5 Ground & Rooftop Anti-Aircraft Flak Artillery
    this.drawGroundGuns(groundGuns, cameraX, gameTime);

    // 6. Bomb Trajectory Preview (Gentle tactical guide from plane)
    this.drawAimGuide(plane, cameraX);

    // 7. Bombs
    this.drawBombs(bombs, cameraX);

    // 8. Gunfire Bullets & Tracer Rounds
    this.drawBullets(bullets, cameraX);

    // 9. Missiles
    this.drawMissiles(missiles, cameraX, gameTime);

    // 10. The Spitfire
    this.drawSpitfire(plane, cameraX);

    // 11. Particles
    this.drawParticles(particles, cameraX);

    // 12. Floating Feedback Texts
    this.drawFloatingTexts(floatingTexts, cameraX);

    ctx.restore();
  }

  private drawBullets(bullets: Bullet[], cameraX: number) {
    const ctx = this.ctx;
    for (const b of bullets) {
      if (!b.alive) continue;
      const screenX = b.x - cameraX;
      const screenY = b.y;
      if (screenX < -20 || screenX > CANVAS_VIRTUAL_WIDTH + 20) continue;

      ctx.save();
      ctx.translate(screenX, screenY);
      const angle = Math.atan2(b.vy, b.vx);
      ctx.rotate(angle);

      if (b.isPlayer) {
        // Player .303 Browning High-Speed Tracer Stream
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.fillRect(-14, -2, 24, 4);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-10, -1, 18, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -0.75, 5, 1.5);
      } else {
        // Enemy Anti-Aircraft Flak Tracer Round (fiery red/orange with glowing core)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(-12, -2.5, 16, 5);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(1.5, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(-10, -1.5, 10, 3);
      }

      ctx.restore();
    }
  }

  private drawSky(sector: SectorConfig, gameTime: number) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);

    if (sector.skyTheme === 'dawn') {
      grad.addColorStop(0, '#f8b195');
      grad.addColorStop(0.4, '#f67280');
      grad.addColorStop(0.75, '#c06c84');
      grad.addColorStop(1, '#ffc68a');
    } else if (sector.skyTheme === 'noon') {
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(0.5, '#93c5fd');
      grad.addColorStop(0.9, '#dbeafe');
      grad.addColorStop(1, '#fef08a');
    } else if (sector.skyTheme === 'sunset') {
      grad.addColorStop(0, '#4a154b');
      grad.addColorStop(0.4, '#b83b5e');
      grad.addColorStop(0.7, '#e23e57');
      grad.addColorStop(1, '#f9ed69');
    } else if (sector.skyTheme === 'stormy') {
      // Iron Valley Thunderstorm Front
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.4, '#1e293b');
      grad.addColorStop(0.8, '#334155');
      grad.addColorStop(1, '#475569');
    } else if (sector.skyTheme === 'dusk') {
      // Coastal Deep Twilight
      grad.addColorStop(0, '#2e1065');
      grad.addColorStop(0.4, '#581c87');
      grad.addColorStop(0.75, '#7e22ce');
      grad.addColorStop(1, '#f472b6');
    } else if (sector.skyTheme === 'overcast') {
      // Misty Chemical Complex Haze
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#475569');
      grad.addColorStop(0.85, '#64748b');
      grad.addColorStop(1, '#fde68a');
    } else if (sector.skyTheme === 'midnight_crimson') {
      // Imperial High Command blood-red night
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.4, '#450a0a');
      grad.addColorStop(0.8, '#7f1d1d');
      grad.addColorStop(1, '#dc2626');
    } else {
      // Night
      grad.addColorStop(0, '#0a0d1a');
      grad.addColorStop(0.5, '#121829');
      grad.addColorStop(0.85, '#1e293b');
      grad.addColorStop(1, '#2c3e50');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

    // Weather Effects & Celestial Bodies
    if (sector.skyTheme === 'stormy') {
      // Distant lightning flash
      if (Math.sin(gameTime * 9) > 0.96) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
      }
    } else if (sector.skyTheme === 'night' || sector.skyTheme === 'midnight_crimson') {
      // Moon
      ctx.fillStyle = sector.skyTheme === 'midnight_crimson' ? '#fecaca' : '#fffbeb';
      ctx.beginPath();
      ctx.arc(800, 90, 32, 0, Math.PI * 2);
      ctx.fill();

      // Searchlight beams sweeping
      const beamAngle = Math.sin(gameTime * 0.8) * 0.35 + 0.2;
      ctx.save();
      ctx.translate(650, GROUND_Y);
      ctx.rotate(beamAngle);
      const beamGrad = ctx.createLinearGradient(0, 0, 0, -450);
      beamGrad.addColorStop(0, sector.skyTheme === 'midnight_crimson' ? 'rgba(248, 113, 113, 0.4)' : 'rgba(254, 240, 138, 0.35)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, 0);
      ctx.lineTo(80, -450);
      ctx.lineTo(-80, -450);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Warm sun
      const sunGrad = ctx.createRadialGradient(820, 85, 10, 820, 85, 60);
      sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.9)');
      sunGrad.addColorStop(0.5, 'rgba(254, 215, 170, 0.35)');
      sunGrad.addColorStop(1, 'rgba(254, 215, 170, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(820, 85, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawDistantHills(cameraX: number, sector: SectorConfig) {
    const ctx = this.ctx;
    const img = this.mountainPanoramaImg;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      // Parallax scroll factor (mountains drift smoothly at 0.15 camera speed)
      const scrollFactor = 0.15;
      const parX = cameraX * scrollFactor;

      // Render dimensions for the mountain panorama
      // Aspect ratio of mountain image: 1958 x 803 (~2.44)
      const renderHeight = 310;
      const renderWidth = (renderHeight / img.naturalHeight) * img.naturalWidth;
      const renderY = GROUND_Y - renderHeight + 25; // Sits naturally resting on ground/skyline

      // Subtle atmospheric tint matching night/dawn/sunset sectors
      if (sector.skyTheme === 'night' || sector.skyTheme === 'midnight_crimson') {
        ctx.globalAlpha = 0.65;
      } else if (sector.skyTheme === 'stormy' || sector.skyTheme === 'overcast') {
        ctx.globalAlpha = 0.85;
      } else {
        ctx.globalAlpha = 0.95;
      }

      // Calculate the start tile index based on parX
      const startTileIndex = Math.floor(parX / renderWidth) - 1;
      const endTileIndex = Math.ceil((parX + CANVAS_VIRTUAL_WIDTH) / renderWidth) + 1;

      for (let tileIdx = startTileIndex; tileIdx <= endTileIndex; tileIdx++) {
        const tileLeftX = tileIdx * renderWidth - parX;
        // Check if tile is within or near screen viewport
        if (tileLeftX + renderWidth < -50 || tileLeftX > CANVAS_VIRTUAL_WIDTH + 50) continue;

        // "flip horizontally every other layer":
        // For odd tile indices, flip horizontally so mountain ridges match up seamlessly and alternate!
        const isFlipped = Math.abs(tileIdx) % 2 === 1;

        ctx.save();
        if (isFlipped) {
          // Mirror horizontally around tile center
          ctx.translate(tileLeftX + renderWidth, renderY);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
        } else {
          ctx.drawImage(img, tileLeftX, renderY, renderWidth, renderHeight);
        }
        ctx.restore();
      }

      ctx.restore();
    } else {
      // Fallback vector hills while asset is loading
      const parX = (cameraX * 0.12) % 400;

      ctx.save();
      ctx.fillStyle = sector.skyTheme === 'night' ? '#161e31' : '#b7a89e';
      ctx.globalAlpha = 0.5;

      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      for (let x = -400; x <= CANVAS_VIRTUAL_WIDTH + 400; x += 120) {
        const actualX = x - parX;
        const peakY = 320 + Math.sin(x * 0.015) * 45;
        ctx.lineTo(actualX, peakY);
      }
      ctx.lineTo(CANVAS_VIRTUAL_WIDTH, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawMidgroundSkyline(cameraX: number, sector: SectorConfig) {
    const ctx = this.ctx;
    const parX = (cameraX * 0.35) % 800;

    ctx.save();
    ctx.fillStyle = sector.skyTheme === 'night' ? '#20293f' : '#8e827a';
    ctx.globalAlpha = 0.65;

    // Stylized silhouette rooftops & smokestacks
    for (let x = -800; x <= CANVAS_VIRTUAL_WIDTH + 800; x += 70) {
      const actualX = x - parX;
      const height = 90 + ((x * 37) % 65);
      ctx.fillRect(actualX, GROUND_Y - height, 48, height);
      // Smokestack spire
      if ((x / 70) % 3 === 0) {
        ctx.fillRect(actualX + 18, GROUND_Y - height - 30, 10, 30);
      }
    }
    ctx.restore();
  }

  private drawGround(cameraX: number) {
    const ctx = this.ctx;

    // Base Cobblestone & Pavement
    ctx.fillStyle = '#3d3835';
    ctx.fillRect(0, GROUND_Y, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT - GROUND_Y);

    // Curb edge line
    ctx.fillStyle = '#655e58';
    ctx.fillRect(0, GROUND_Y, CANVAS_VIRTUAL_WIDTH, 6);

    // Street markings / cobblestone dashes
    const offset = cameraX % 40;
    ctx.fillStyle = '#2c2724';
    for (let x = -40; x < CANVAS_VIRTUAL_WIDTH + 40; x += 40) {
      ctx.fillRect(x - offset, GROUND_Y + 12, 22, 5);
      ctx.fillRect(x - offset + 18, GROUND_Y + 28, 22, 5);
    }

    // Street lamps and trees
    const decorSpacing = 160;
    const decorOffset = cameraX % decorSpacing;
    for (let x = -decorSpacing; x < CANVAS_VIRTUAL_WIDTH + decorSpacing; x += decorSpacing) {
      const screenX = x - decorOffset;
      // Lamppost
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(screenX + 30, GROUND_Y - 38, 4, 38);
      ctx.beginPath();
      ctx.arc(screenX + 32, GROUND_Y - 40, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      // Warm street lamp glow
      const lampGlow = ctx.createRadialGradient(screenX + 32, GROUND_Y - 40, 2, screenX + 32, GROUND_Y - 40, 20);
      lampGlow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      lampGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(screenX + 32, GROUND_Y - 40, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBuildings(buildings: Building[], cameraX: number, sector: SectorConfig, gameTime: number) {
    const ctx = this.ctx;

    for (const b of buildings) {
      const screenX = b.x - cameraX;
      // Culled if offscreen
      if (screenX + b.width < -50 || screenX > CANVAS_VIRTUAL_WIDTH + 50) continue;

      const topY = GROUND_Y - b.height;

      if (b.destroyed) {
        // Destroyed ruin
        this.drawDestroyedBuilding(b, screenX, topY, gameTime);
        continue;
      }

      if (b.type === 'ENEMY') {
        if (b.isRadarUnit) {
          this.drawGroundRadarUnit(b, screenX, topY, gameTime);
        } else {
          this.drawEnemyBuilding(b, screenX, topY, gameTime);
        }
      } else {
        this.drawCivilianBuilding(b, screenX, topY);
      }
    }

    // Draw City Perimeter Airspace Boundary Checkpoint
    const perimScreenX = sector.cityLength - cameraX;
    if (perimScreenX >= -80 && perimScreenX <= CANVAS_VIRTUAL_WIDTH + 80) {
      this.drawPerimeterBoundary(perimScreenX, gameTime);
    }
  }

  private drawGroundGuns(groundGuns: GroundGun[], cameraX: number, gameTime: number) {
    const ctx = this.ctx;

    for (const gun of groundGuns) {
      const screenX = gun.x - cameraX;
      if (screenX < -60 || screenX > CANVAS_VIRTUAL_WIDTH + 60) continue;

      ctx.save();

      if (gun.destroyed) {
        // Destroyed flak emplacement
        // Scorched blast crater ring
        ctx.fillStyle = '#171513';
        ctx.beginPath();
        ctx.ellipse(screenX, gun.y - 2, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shattered sandbags / twisted wreckage
        ctx.fillStyle = '#44403c';
        ctx.fillRect(screenX - 10, gun.y - 6, 8, 5);
        ctx.fillRect(screenX + 3, gun.y - 5, 9, 4);

        // Bent barrel lying broken on ground
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenX - 2, gun.y - 3);
        ctx.lineTo(screenX + 14, gun.y - 2);
        ctx.stroke();

        // Delicate smoke wisp from ruined gun
        if (Math.sin(gameTime * 6 + gun.x) > 0) {
          ctx.fillStyle = 'rgba(120, 113, 108, 0.45)';
          ctx.beginPath();
          ctx.arc(screenX + (Math.sin(gameTime * 3) * 3), gun.y - 12 - (gameTime % 2) * 5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        continue;
      }

      const isRoof = !!gun.isRooftop;
      const baseY = gun.y;

      if (!isRoof) {
        // 1. Street Level Sandbag Revetment / Horseshoe Pit
        ctx.fillStyle = '#785434';
        ctx.strokeStyle = '#573c24';
        ctx.lineWidth = 1;

        // Horseshoe sandbag embankment
        ctx.beginPath();
        ctx.ellipse(screenX, baseY - 3, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Individual layered sandbags with highlights
        const bagColors = ['#8c6340', '#7a5535', '#6b492d'];
        for (let bx = -12; bx <= 12; bx += 6) {
          ctx.fillStyle = bagColors[Math.abs(Math.floor(bx / 6)) % bagColors.length];
          ctx.fillRect(screenX + bx - 2.5, baseY - 7, 5, 4);
          ctx.strokeStyle = '#4a321d';
          ctx.strokeRect(screenX + bx - 2.5, baseY - 7, 5, 4);
        }

        // Steel Turntable Platform
        ctx.fillStyle = '#334155';
        ctx.fillRect(screenX - 8, baseY - 9, 16, 4);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(screenX - 5, baseY - 12, 10, 4);
      } else {
        // Rooftop Gun Barbette Cupola
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(screenX, baseY, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.fillRect(screenX - 6, baseY - 8, 12, 8);
      }

      // 2. Rotating Armored Flak Turret & Twin Barrels
      const pivotY = isRoof ? baseY - 7 : baseY - 11;
      const recoil = gun.recoilOffset ?? 0;
      const aim = gun.aimAngle;

      ctx.save();
      ctx.translate(screenX, pivotY);

      // Angled Gun Shield (behind barrels)
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(6, -4);
      ctx.lineTo(4, 5);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gunner Sight Aperture
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-1.5, -2, 3, 1.5);

      // Rotate gun carriage along aimAngle
      ctx.rotate(aim);

      // Twin Gun Barrels with Recoil
      const barrelLen = 15;
      const barrelSpacing = 2.5;

      ctx.fillStyle = '#0f172a';
      // Upper barrel
      ctx.fillRect(-recoil, -barrelSpacing - 1, barrelLen, 2);
      // Lower barrel
      ctx.fillRect(-recoil, barrelSpacing - 1, barrelLen, 2);

      // Conical Flash Hiders at barrel tips
      ctx.fillStyle = '#334155';
      ctx.fillRect(barrelLen - recoil - 1, -barrelSpacing - 1.5, 3, 3);
      ctx.fillRect(barrelLen - recoil - 1, barrelSpacing - 1.5, 3, 3);

      // Breech block
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4 - recoil, -4, 5, 8);

      // Active Firing Starburst Muzzle Flash
      if (gun.burstCount > 0 && gun.burstTimer > 0.03) {
        const flashX = barrelLen - recoil + 3;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(flashX, -barrelSpacing, 4, 0, Math.PI * 2);
        ctx.arc(flashX, barrelSpacing, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(flashX + 2, -barrelSpacing, 2.5, 0, Math.PI * 2);
        ctx.arc(flashX + 2, barrelSpacing, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Ammo Box on Side
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(screenX + 7, baseY - 8, 4, 5);
      ctx.fillStyle = '#eab308'; // Brass clip
      ctx.fillRect(screenX + 6, baseY - 7, 2, 3);

      ctx.restore();
    }
  }

  private drawPerimeterBoundary(screenX: number, gameTime: number) {
    const ctx = this.ctx;

    ctx.save();
    // Vertical Airspace Boundary Beam reaching into sky
    const beamPulse = 0.35 + Math.sin(gameTime * 4) * 0.15;
    ctx.strokeStyle = `rgba(239, 68, 68, ${beamPulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, GROUND_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Military Checkpoint Observation Mast
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(screenX - 8, GROUND_Y - 90, 16, 90);

    // Hazard Stripes on Mast Base
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX - 8, GROUND_Y - 30, 16, 12);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(screenX - 4, GROUND_Y - 30, 4, 12);
    ctx.fillRect(screenX + 4, GROUND_Y - 30, 4, 12);

    // Observation Cabin at top
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX - 16, GROUND_Y - 110, 32, 20);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(screenX - 12, GROUND_Y - 105, 24, 8);

    // Rotating Siren Beacon at top
    const blink = Math.sin(gameTime * 10) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(screenX, GROUND_Y - 116, 6, 0, Math.PI * 2);
    ctx.fill();

    // Checkpoint Signpost
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(screenX - 40, GROUND_Y - 65, 80, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 8.5px "Cabinet Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("AIRSPACE PERIMETER", screenX, GROUND_Y - 53);

    ctx.restore();
  }

  private drawGroundRadarUnit(b: Building, screenX: number, topY: number, gameTime: number) {
    const ctx = this.ctx;
    const w = b.width;
    const cx = screenX + w / 2;

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(screenX - 2, GROUND_Y - 4, w + 4, 4);

    // 1. Reinforced Concrete Bunker Plinth Foundation (Solid stone/concrete, NO WHEELS)
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX, GROUND_Y - 14, w, 14);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(screenX + 2, GROUND_Y - 12, w - 4, 10);
    // Foundation expansion joints & blast anchors
    ctx.fillStyle = '#0f172a';
    for (let jx = screenX + 12; jx < screenX + w - 8; jx += 16) {
      ctx.fillRect(jx, GROUND_Y - 14, 2, 14);
    }

    // 2. Concrete Blast-Wall Bunker Structure
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(screenX + 4, GROUND_Y - 34, w - 8, 20);
    ctx.fill();
    ctx.stroke();

    // Heavy Armored Blast Door at center
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 7, GROUND_Y - 26, 14, 12);
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 5, GROUND_Y - 24, 10, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 1, GROUND_Y - 20, 2, 4);

    // Hazard Stripes on Bunker Upper Rim
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX + 4, GROUND_Y - 34, w - 8, 4);
    ctx.fillStyle = '#0f172a';
    for (let hx = screenX + 6; hx < screenX + w - 6; hx += 8) {
      ctx.fillRect(hx, GROUND_Y - 34, 3, 4);
    }

    // Dual SAM missile launch tubes mounted on bunker roof
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX + w - 18, GROUND_Y - 42, 14, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + w - 19, GROUND_Y - 41, 12, 2.5);
    ctx.fillRect(screenX + w - 19, GROUND_Y - 37, 12, 2.5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX + w - 21, GROUND_Y - 41, 3, 2.5);
    ctx.fillRect(screenX + w - 21, GROUND_Y - 37, 3, 2.5);

    // Elevated Concrete Pedestal Mounting for Radar Gantry
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 6, GROUND_Y - 44, 12, 10);

    // Active Swiveling Radar Dish (rotates to track the Spitfire!)
    const isRadarActive = !b.radarDisabled && !b.isJammed;
    const trackAngle = isRadarActive ? (b.radarTrackAngle ?? -Math.PI / 2) : -Math.PI * 0.15;
    const dishY = GROUND_Y - 36;

    ctx.save();
    ctx.translate(cx, dishY);
    ctx.rotate(trackAngle);

    // Tactical Radar Dish Frame
    ctx.strokeStyle = isRadarActive ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Antenna feed horn
    ctx.strokeStyle = isRadarActive ? '#ffffff' : '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();

    // Radar Active Emitter Blinking Beacon (or dark burnt out)
    if (isRadarActive) {
      const pingPulse = Math.sin(gameTime * 12) > 0;
      ctx.fillStyle = pingPulse ? '#38bdf8' : '#0284c7';
      ctx.beginPath();
      ctx.arc(9, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Sweeping radar scan cone towards Spitfire
      const scanAlpha = 0.12 + Math.sin(gameTime * 8) * 0.08;
      ctx.fillStyle = `rgba(56, 189, 248, ${scanAlpha})`;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.arc(9, 0, 150, -0.2, 0.2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(9, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Malfunction spark
      if (Math.sin(gameTime * 18) > 0.4) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(4, -3, 3, 3);
      }
    }

    ctx.restore();

    // HUD Target Callout with Cyan Radar HQ identifier
    this.drawTargetMarker(cx, topY - 26, gameTime, true, b.isJammed, b.radarDisabled, b.missilePodDisabled);

    ctx.restore();
  }

  private drawEnemyBuilding(b: Building, screenX: number, topY: number, gameTime: number) {
    const ctx = this.ctx;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(screenX - 4, topY + 4, b.width, b.height);

    // Bunker Main Body (Armored steel & concrete)
    ctx.fillStyle = b.isJammed ? '#332f2c' : b.themeStyle.baseColor;
    ctx.fillRect(screenX, topY, b.width, b.height);

    // Heavy Border
    ctx.strokeStyle = b.isJammed ? '#44403c' : '#171514';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, topY, b.width, b.height);

    // Armor Plate Panels / Rivets
    ctx.strokeStyle = '#3e3b38';
    ctx.lineWidth = 1;
    const panelHeight = 40;
    for (let py = topY + panelHeight; py < GROUND_Y; py += panelHeight) {
      ctx.beginPath();
      ctx.moveTo(screenX, py);
      ctx.lineTo(screenX + b.width, py);
      ctx.stroke();

      // Rivets
      ctx.fillStyle = '#78716c';
      ctx.fillRect(screenX + 4, py - 3, 3, 3);
      ctx.fillRect(screenX + b.width - 7, py - 3, 3, 3);
    }

    // Hazard Stripes on top rim
    if (b.themeStyle.hasHazardStripes) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(screenX, topY, b.width, 10);
      ctx.clip();
      ctx.fillStyle = b.isJammed ? '#78716c' : '#f59e0b';
      ctx.fillRect(screenX, topY, b.width, 10);
      ctx.fillStyle = '#1c1917';
      for (let sx = screenX - 20; sx < screenX + b.width + 20; sx += 12) {
        ctx.beginPath();
        ctx.moveTo(sx, topY + 10);
        ctx.lineTo(sx + 8, topY);
        ctx.lineTo(sx + 12, topY);
        ctx.lineTo(sx + 4, topY + 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Slit windows / gunports with red ominous glow (dark if jammed)
    ctx.fillStyle = b.isJammed ? '#1c1917' : '#ef4444';
    const slitW = 9;
    const slitH = 4;
    for (let row = 1; row <= b.themeStyle.windowRows; row++) {
      const wy = topY + 18 + row * 24;
      if (wy > GROUND_Y - 14) break;
      for (let col = 0; col < b.themeStyle.windowCols; col++) {
        const wx = screenX + 8 + col * 20;
        ctx.fillRect(wx, wy, slitW, slitH);
      }
    }

    // Roof Structure: Radar or Silo or Jammed/Disabled
    if (b.radarDisabled || b.isJammed) {
      const siloX = screenX + b.width / 2;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(siloX - 9, topY - 10, 18, 10);
      // Sparking electrical malfunction
      if (Math.sin(gameTime * 20) > 0.2) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(siloX + (Math.sin(gameTime * 15) * 6), topY - 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (b.themeStyle.roofType === 'radar') {
      // Rotating Radar Dish
      const dishX = screenX + b.width / 2;
      const dishY = topY - 10;

      // Base mast
      ctx.fillStyle = '#57534e';
      ctx.fillRect(dishX - 2, topY - 10, 4, 10);

      // Rotating dish
      const angle = (b.radarAngle ?? 0) + gameTime * 2.5;
      ctx.save();
      ctx.translate(dishX, dishY);
      ctx.scale(Math.cos(angle), 1);
      ctx.beginPath();
      ctx.arc(0, 0, 11, Math.PI * 0.8, Math.PI * 1.8);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    } else {
      // Missile Launch Silo Tube (Active or Disabled by Gunfire)
      const siloX = screenX + b.width / 2;
      if (b.missilePodDisabled) {
        // Disabled & Damaged Silo Tube: blackened metal, distorted rim, smoke wisp
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(siloX - 9, topY - 10, 18, 10);
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.ellipse(siloX, topY - 10, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Burnt out beacon (dark stone grey)
        ctx.fillStyle = '#262626';
        ctx.beginPath();
        ctx.arc(siloX + 11, topY - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Thin smoke wisp from scorched tube
        if (Math.sin(gameTime * 7) > 0) {
          ctx.fillStyle = 'rgba(120, 113, 108, 0.55)';
          ctx.beginPath();
          ctx.arc(siloX + Math.sin(gameTime * 4) * 3, topY - 15 - (gameTime % 2) * 5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Active Missile Launch Silo Tube
        ctx.fillStyle = '#44403c';
        ctx.fillRect(siloX - 10, topY - 14, 20, 14);
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.ellipse(siloX, topY - 14, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Launch warning beacon blinking
        const blink = Math.sin(gameTime * 8) > 0;
        ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(siloX + 11, topY - 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // TARGET HUD CALLOUT (Pulsing tactical chevron & label)
    this.drawTargetMarker(screenX + b.width / 2, topY - 26, gameTime, false, b.isJammed, b.radarDisabled, b.missilePodDisabled);
  }

  private drawTargetMarker(
    centerX: number,
    topY: number,
    gameTime: number,
    isRadar: boolean = false,
    isJammed: boolean = false,
    radarDisabled: boolean = false,
    missilePodDisabled: boolean = false
  ) {
    const ctx = this.ctx;
    const pulse = Math.sin(gameTime * 6) * 2.5;
    const y = topY + pulse;

    ctx.save();
    // Badge color
    const isOffline = radarDisabled || missilePodDisabled;
    ctx.fillStyle = isOffline ? '#78350f' : isJammed ? '#c2410c' : isRadar ? '#0284c7' : '#dc2626';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    // Diamond / Crosshair marker
    ctx.beginPath();
    ctx.moveTo(centerX, y - 6);
    ctx.lineTo(centerX + 6, y);
    ctx.lineTo(centerX, y + 6);
    ctx.lineTo(centerX - 6, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Downward target arrow pointing to the roof
    ctx.fillStyle = isOffline ? '#f59e0b' : isJammed ? '#f97316' : isRadar ? '#38bdf8' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(centerX - 4, y + 8);
    ctx.lineTo(centerX + 4, y + 8);
    ctx.lineTo(centerX, y + 13);
    ctx.closePath();
    ctx.fill();

    // Text: Status label
    ctx.font = '700 8.5px "Cabinet Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    let label = "TARGET · DROP BOMB";
    if (radarDisabled) {
      label = "RADAR OFFLINE · BOMB TO WIN";
    } else if (missilePodDisabled) {
      label = "POD OFFLINE · BOMB TO WIN";
    } else if (isJammed) {
      label = "RADAR BLIND";
    } else if (isRadar) {
      label = "RADAR HQ";
    }
    ctx.fillText(label, centerX, y - 9);

    ctx.restore();
  }

  private drawCivilianBuilding(b: Building, screenX: number, topY: number) {
    const ctx = this.ctx;

    // If an intact image asset is available for this variant, render the high-res building asset
    const variantIdx = b.assetVariant ? (b.assetVariant - 1) : 0;
    const img = this.intactImages[variantIdx];

    if (img && img.complete && img.naturalWidth > 0) {
      // Ground contact shadow strictly underneath the building base (no dark box behind transparent parts)
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(screenX + b.width / 2, GROUND_Y - 1, b.width * 0.48, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crisp image rendering with transparent background perfectly preserved
      ctx.drawImage(img, screenX, topY, b.width, b.height);
    } else {
      // Fallback vector facade
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(screenX - 3, topY + 4, b.width, b.height);

      ctx.fillStyle = b.themeStyle.baseColor;
      ctx.fillRect(screenX, topY, b.width, b.height);

      // Roof Styling
      if (b.themeStyle.roofType === 'gable') {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(screenX - 4, topY);
        ctx.lineTo(screenX + b.width / 2, topY - 26);
        ctx.lineTo(screenX + b.width + 4, topY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.fillRect(screenX + b.width - 18, topY - 32, 10, 20);
      } else if (b.themeStyle.roofType === 'mansard') {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(screenX - 3, topY);
        ctx.lineTo(screenX + 8, topY - 22);
        ctx.lineTo(screenX + b.width - 8, topY - 22);
        ctx.lineTo(screenX + b.width + 3, topY);
        ctx.closePath();
        ctx.fill();
      } else if (b.themeStyle.roofType === 'dome') {
        ctx.fillStyle = '#0f766e';
        ctx.beginPath();
        ctx.arc(screenX + b.width / 2, topY, b.width * 0.45, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + b.width / 2, topY - b.width * 0.45);
        ctx.lineTo(screenX + b.width / 2, topY - b.width * 0.45 - 14);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(screenX - 3, topY - 8, b.width + 6, 8);
      }

      // Windows with warm amber lighting
      const winW = 10;
      const winH = 14;
      ctx.fillStyle = '#fef08a';
      for (let row = 1; row <= b.themeStyle.windowRows; row++) {
        const wy = topY + 14 + row * 26;
        if (wy > GROUND_Y - 20) break;
        for (let col = 0; col < b.themeStyle.windowCols; col++) {
          const wx = screenX + 10 + col * 20;
          ctx.fillRect(wx, wy, winW, winH);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx, wy, winW, winH);
        }
      }

      // Front Door
      ctx.fillStyle = '#451a03';
      ctx.fillRect(screenX + b.width / 2 - 8, GROUND_Y - 22, 16, 22);
    }

    // Subtle Spared / Civilian indicator (small shield, very clean)
    ctx.font = '600 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("CIVILIAN", screenX + b.width / 2, GROUND_Y - 4);
  }

  private drawDestroyedBuilding(b: Building, screenX: number, topY: number, gameTime: number) {
    const ctx = this.ctx;
    const ruinHeight = Math.max(34, b.height * 0.45);
    const ruinY = GROUND_Y - ruinHeight;

    // 0. Volumetric Heavy Billowing Wartime Smoke Columns ascending into the sky
    const smokeTime = gameTime * 1.8;
    const centerX = screenX + b.width / 2;
    const plumes = [
      { xOffset: -b.width * 0.16, phase: 0.2, scale: 1.05, maxH: 145 },
      { xOffset: b.width * 0.22, phase: 2.3, scale: 0.85, maxH: 120 },
    ];

    for (const plume of plumes) {
      const px = centerX + plume.xOffset;
      const py = ruinY + 8;
      const smokeGrad = ctx.createLinearGradient(px, py, px + 25, py - plume.maxH);
      smokeGrad.addColorStop(0, 'rgba(23, 21, 19, 0.78)');
      smokeGrad.addColorStop(0.3, 'rgba(41, 37, 36, 0.6)');
      smokeGrad.addColorStop(0.7, 'rgba(87, 83, 78, 0.32)');
      smokeGrad.addColorStop(1, 'rgba(120, 113, 108, 0)');

      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.moveTo(px - 14 * plume.scale, py);

      // Left undulating billowing boundary
      const steps = 5;
      const stepH = plume.maxH / steps;
      for (let s = 1; s <= steps; s++) {
        const currY = py - s * stepH;
        const widthExpansion = (14 + s * 8) * plume.scale;
        const drift = Math.sin(smokeTime + plume.phase + s * 0.8) * (6 + s * 4) + (s * 4);
        ctx.lineTo(px - widthExpansion + drift, currY);
      }

      // Billowing mushroom cap at top of column
      const topDrift = Math.sin(smokeTime + plume.phase + 4) * 22 + 18;
      ctx.quadraticCurveTo(
        px + topDrift, py - plume.maxH - 14,
        px + (24 * plume.scale) + topDrift, py - plume.maxH + 6
      );

      // Right undulating billowing boundary
      for (let s = steps; s >= 1; s--) {
        const currY = py - s * stepH;
        const widthExpansion = (14 + s * 7) * plume.scale;
        const drift = Math.sin(smokeTime + plume.phase + s * 0.8) * (6 + s * 4) + (s * 4);
        ctx.lineTo(px + widthExpansion + drift, currY);
      }

      ctx.lineTo(px + 14 * plume.scale, py);
      ctx.closePath();
      ctx.fill();
    }

    // 1. Smoldering Ambient Fire Glow Gradient over the ruin
    const fireGlow = ctx.createRadialGradient(
      screenX + b.width / 2, ruinY + 10, 4,
      screenX + b.width / 2, ruinY + 10, b.width * 0.85
    );
    fireGlow.addColorStop(0, 'rgba(234, 88, 12, 0.45)');
    fireGlow.addColorStop(0.55, 'rgba(180, 83, 9, 0.16)');
    fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireGlow;
    ctx.fillRect(screenX - 25, ruinY - 35, b.width + 50, ruinHeight + 40);

    // If civilian building with a destroyed asset image, render the high-detail destroyed ruin asset
    const variantIdx = b.assetVariant ? (b.assetVariant - 1) : 0;
    const destImg = this.destroyedImages[variantIdx];

    if (b.type === 'CIVILIAN' && destImg && destImg.complete && destImg.naturalWidth > 0) {
      // Calculate realistic ruin height based on destroyed asset aspect ratio
      const destAspect = destImg.naturalHeight / destImg.naturalWidth;
      const destRenderWidth = b.width * 1.15;
      const destRenderHeight = destRenderWidth * destAspect;
      const destX = screenX - (destRenderWidth - b.width) / 2;
      const destY = GROUND_Y - destRenderHeight;

      // Drop shadow under wreckage
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(screenX + b.width / 2, GROUND_Y - 2, destRenderWidth * 0.45, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(destImg, destX, destY, destRenderWidth, destRenderHeight);
    } else {
      // 2. Blackened & Scorched Jagged Masonry Wall Ruin (Fallback / Enemy Ruins)
      ctx.fillStyle = '#171513';
      ctx.beginPath();
      ctx.moveTo(screenX - 2, GROUND_Y);
      ctx.lineTo(screenX, ruinY + 14);
      ctx.lineTo(screenX + b.width * 0.16, ruinY + 6);
      ctx.lineTo(screenX + b.width * 0.28, ruinY + 18);
      ctx.lineTo(screenX + b.width * 0.46, ruinY + 2); // broken corner pinnacle
      ctx.lineTo(screenX + b.width * 0.62, ruinY + 16);
      ctx.lineTo(screenX + b.width * 0.78, ruinY + 5);
      ctx.lineTo(screenX + b.width + 2, ruinY + 18);
      ctx.lineTo(screenX + b.width + 4, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Heavy charred outline with fractured cracks
      ctx.strokeStyle = '#0c0a09';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Exposed Twisted Metal I-Beams & Rebar protruding from wreckage
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(screenX + b.width * 0.3, ruinY + 15);
      ctx.lineTo(screenX + b.width * 0.25, ruinY - 10);
      ctx.lineTo(screenX + b.width * 0.2, ruinY - 14);
      ctx.moveTo(screenX + b.width * 0.7, ruinY + 12);
      ctx.lineTo(screenX + b.width * 0.75, ruinY - 8);
      ctx.stroke();

      // 4. Exposed Charred Brick Layers & Soot Stains
      ctx.fillStyle = '#78350f';
      for (let by = ruinY + 16; by < GROUND_Y - 10; by += 8) {
        ctx.fillRect(screenX + 4, by, 8, 4);
        ctx.fillRect(screenX + b.width - 12, by + 3, 7, 4);
      }

      // 5. Blown-out charred window frames with red glowing interior
      const winW = 7;
      const winH = 9;
      for (let wy = ruinY + 18; wy < GROUND_Y - 16; wy += 18) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(screenX + 12, wy, winW, winH);
        ctx.fillRect(screenX + b.width - 20, wy, winW, winH);
        ctx.fillStyle = 'rgba(234, 88, 12, 0.65)';
        ctx.fillRect(screenX + 13, wy + winH - 3, winW - 2, 2.5);
      }

      // 6. Active Smoldering Fire Tongues licking from rubble
      const flicker1 = Math.sin(gameTime * 9 + screenX) * 4;
      const flicker2 = Math.cos(gameTime * 11 + screenX) * 5;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(screenX + b.width * 0.35, ruinY + 14);
      ctx.lineTo(screenX + b.width * 0.42, ruinY - 6 + flicker1);
      ctx.lineTo(screenX + b.width * 0.48, ruinY + 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(screenX + b.width * 0.55, ruinY + 16);
      ctx.lineTo(screenX + b.width * 0.62, ruinY - 4 + flicker2);
      ctx.lineTo(screenX + b.width * 0.68, ruinY + 14);
      ctx.closePath();
      ctx.fill();

      // 7. Crumbled Angular Masonry & Shattered Concrete Slabs
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(screenX - 4, GROUND_Y);
      ctx.lineTo(screenX + 2, GROUND_Y - 9);
      ctx.lineTo(screenX + 11, GROUND_Y - 12);
      ctx.lineTo(screenX + 19, GROUND_Y - 5);
      ctx.lineTo(screenX + 24, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(screenX + b.width * 0.35, GROUND_Y);
      ctx.lineTo(screenX + b.width * 0.44, GROUND_Y - 10);
      ctx.lineTo(screenX + b.width * 0.54, GROUND_Y - 8);
      ctx.lineTo(screenX + b.width * 0.65, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(screenX + b.width - 24, GROUND_Y);
      ctx.lineTo(screenX + b.width - 15, GROUND_Y - 11);
      ctx.lineTo(screenX + b.width - 4, GROUND_Y - 6);
      ctx.lineTo(screenX + b.width + 4, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.fillRect(screenX + 5, GROUND_Y - 6, 6, 3);
      ctx.fillRect(screenX + b.width * 0.46, GROUND_Y - 7, 7, 4);
      ctx.fillRect(screenX + b.width - 15, GROUND_Y - 5, 5, 3);

      ctx.fillStyle = '#f97316';
      ctx.fillRect(screenX + 10, GROUND_Y - 8, b.width - 20, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 16, GROUND_Y - 7, b.width * 0.4, 1.5);
    }

    // 8. Stenciled Status Marker
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = b.type === 'ENEMY' ? '#22c55e' : '#ef4444';
    ctx.fillText(b.type === 'ENEMY' ? "TARGET DESTROYED" : "CIVILIAN COLLATERAL", screenX + b.width / 2, ruinY - 16);
  }

  private drawAimGuide(plane: SpitfirePlane, cameraX: number) {
    if (plane.isDestroyed || plane.isCrashing || plane.bombCooldown > 0.05 || plane.isTurning180) return;

    const ctx = this.ctx;
    const dir = plane.direction ?? 1;
    const angle = plane.angle;
    const localRackX = 4 * Math.cos(angle) - 8 * Math.sin(angle);
    const localRackY = 4 * Math.sin(angle) + 8 * Math.cos(angle);
    const startX = (plane.x + dir * localRackX) - cameraX;
    const startY = plane.y + localRackY;

    let simVx: number;
    let simVy: number;

    if (plane.isLooping) {
      const phi = plane.loopProgress * Math.PI * 2;
      const omega = (Math.PI * 2) / 1.4;
      const loopVx = dir * plane.loopRadius * omega * Math.cos(phi);
      const loopVy = -plane.loopRadius * omega * Math.sin(phi);
      const ejectSpeed = 40;
      simVx = loopVx - Math.sin(angle) * ejectSpeed * dir;
      simVy = loopVy + Math.cos(angle) * ejectSpeed;
    } else {
      simVx = dir * plane.speed * 1.15;
      simVy = 20;
    }

    ctx.save();
    ctx.strokeStyle = plane.isLooping ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);

    let simX = startX;
    let simY = startY;
    const dt = 0.05;

    ctx.beginPath();
    ctx.moveTo(simX, simY);

    for (let t = 0; t < 2.0; t += dt) {
      simVy += 320 * dt;
      simX += simVx * dt;
      simY += simVy * dt;

      if (simY >= GROUND_Y) {
        ctx.lineTo(simX, GROUND_Y);
        break;
      }
      ctx.lineTo(simX, simY);
    }
    ctx.stroke();

    // Small impact target crosshair on ground
    if (simY >= GROUND_Y && simX >= -50 && simX <= CANVAS_VIRTUAL_WIDTH + 50) {
      ctx.setLineDash([]);
      ctx.strokeStyle = plane.isLooping ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255, 235, 59, 0.4)';
      ctx.beginPath();
      ctx.ellipse(simX, GROUND_Y, 12, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawSpitfire(plane: SpitfirePlane, cameraX: number) {
    if (plane.isDestroyed) return;

    const ctx = this.ctx;
    const screenX = plane.x - cameraX;
    const screenY = plane.y;

    // Invulnerability flicker
    if (plane.invulnerableTime > 0 && Math.floor(plane.invulnerableTime * 15) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Crash Dive vs 180 Combat Reversal Turn vs Normal Flight Orientation
    if (plane.isCrashing) {
      ctx.rotate(plane.angle);
      ctx.scale(plane.direction * 0.8, 0.8);
    } else if (plane.isTurning180) {
      const p = plane.turnProgress;
      const bank = Math.sin(p * Math.PI);
      const hScale = Math.cos(p * Math.PI) * 0.8;
      const vScale = 0.8 * (1 - 0.25 * bank);
      ctx.scale(hScale, vScale);
      ctx.rotate(-bank * 0.55);
    } else {
      ctx.scale(plane.direction * 0.8, 0.8);
      ctx.rotate(plane.angle);
    }

    // Engine flames if crashing down
    if (plane.isCrashing) {
      ctx.fillStyle = Math.random() > 0.4 ? '#ea580c' : '#facc15';
      ctx.beginPath();
      ctx.ellipse(24, 0, 16 + Math.random() * 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // If Looping: Draw white condensation vapor ribbon
    if (plane.isLooping) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // --- SPITFIRE FUSELAGE & WINGS (Clean Cartoon Vector) ---
    // Underbelly (Sky Grey)
    ctx.fillStyle = PALETTE.plane.belly;
    ctx.beginPath();
    ctx.ellipse(0, 4, 32, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Upper Fuselage (British Camouflage Green)
    ctx.fillStyle = PALETTE.plane.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Earth Brown Camo Pattern Splashes
    ctx.fillStyle = PALETTE.plane.camoBrown;
    ctx.beginPath();
    ctx.ellipse(-10, -3, 14, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -2, 10, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tail Fin (Vertical Stabilizer)
    ctx.fillStyle = PALETTE.plane.body;
    ctx.beginPath();
    ctx.moveTo(-28, -2);
    ctx.lineTo(-38, -18);
    ctx.lineTo(-24, -18);
    ctx.lineTo(-18, -2);
    ctx.closePath();
    ctx.fill();

    // Tail Fin Flash (Red, White, Blue vertical stripes)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-32, -16, 3, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-29, -16, 3, 10);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-26, -16, 3, 10);

    // Elliptical Main Wing (Spitfire Signature Shape)
    ctx.fillStyle = PALETTE.plane.body;
    ctx.beginPath();
    ctx.ellipse(2, 6, 20, 11, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.plane.camoBrown;
    ctx.beginPath();
    ctx.ellipse(5, 7, 10, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Iconic RAF Roundel on Wing/Fuselage
    const roundelX = -4;
    const roundelY = 0;
    // Outer Yellow ring
    ctx.fillStyle = PALETTE.plane.roundelYellow;
    ctx.beginPath();
    ctx.arc(roundelX, roundelY, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Blue ring
    ctx.fillStyle = PALETTE.plane.roundelBlue;
    ctx.beginPath();
    ctx.arc(roundelX, roundelY, 6, 0, Math.PI * 2);
    ctx.fill();
    // White ring
    ctx.fillStyle = PALETTE.plane.roundelWhite;
    ctx.beginPath();
    ctx.arc(roundelX, roundelY, 4, 0, Math.PI * 2);
    ctx.fill();
    // Red center
    ctx.fillStyle = PALETTE.plane.roundelRed;
    ctx.beginPath();
    ctx.arc(roundelX, roundelY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit Bubble & Aviator
    ctx.fillStyle = 'rgba(178, 226, 248, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-2, -7, 11, 6, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pilot Goggles & Aviator Cap
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(-2, -6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -7, 2, 2);

    // Battle Damage Scorch Marks & Shrapnel (when hit or low life)
    if (plane.hullHealth <= 60 || plane.lives <= 1) {
      ctx.fillStyle = 'rgba(28, 25, 23, 0.75)';
      // Engine cowling scorch
      ctx.beginPath();
      ctx.ellipse(10, 1, 13, 6, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Wing shrapnel holes
      ctx.beginPath();
      ctx.arc(-8, 6, 2.5, 0, Math.PI * 2);
      ctx.arc(8, 8, 2, 0, Math.PI * 2);
      ctx.fill();

      if (plane.hullHealth <= 30 || plane.lives === 1) {
        // Flickering engine fire / ember glow inside manifold
        ctx.fillStyle = Math.random() > 0.3 ? '#ea580c' : '#facc15';
        ctx.beginPath();
        ctx.arc(4, 1, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Yellow Propeller Nose Cone (Spinner)
    ctx.fillStyle = PALETTE.plane.roundelYellow;
    ctx.beginPath();
    ctx.ellipse(34, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spinning Propeller Disc Motion Blur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(36, 0, 3, 26, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Propeller Blades Spinning
    const pAngle = plane.propellerAngle;
    ctx.save();
    ctx.translate(36, 0);
    ctx.rotate(pAngle);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-1.5, -24, 3, 48);
    // Yellow Tips
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-1.5, -24, 3, 6);
    ctx.fillRect(-1.5, 18, 3, 6);
    ctx.restore();

    ctx.restore();
  }

  private drawBombs(bombs: Bomb[], cameraX: number) {
    const ctx = this.ctx;

    for (const b of bombs) {
      if (!b.alive) continue;
      const screenX = b.x - cameraX;
      const screenY = b.y;

      // Draw steep trajectory history dotted trail
      if (b.trajectoryHistory.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        for (let i = 0; i < b.trajectoryHistory.length; i++) {
          const ptX = b.trajectoryHistory[i].x - cameraX;
          const ptY = b.trajectoryHistory[i].y;
          if (i === 0) ctx.moveTo(ptX, ptY);
          else ctx.lineTo(ptX, ptY);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Bomb (compact toy scale)
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(b.rotation);

      // Bomb Body (Olive drab)
      ctx.fillStyle = '#2d3319';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Hazard Band
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-1.5, -3.5, 2.5, 7);

      // Tail Fins
      ctx.fillStyle = '#1a1f0f';
      ctx.fillRect(-7, -5, 3.5, 10);

      // Nose Fuse
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(6.5, -1, 2, 2);

      ctx.restore();
    }
  }

  private drawMissiles(missiles: Missile[], cameraX: number, gameTime: number) {
    const ctx = this.ctx;

    for (const m of missiles) {
      if (!m.alive) continue;
      const screenX = m.x - cameraX;
      const screenY = m.y;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(m.angle);

      // Rocket Exhaust Plume (delicate miniature plume)
      const flicker = Math.random() * 2.5;
      const plumeGrad = ctx.createLinearGradient(-10 - flicker, 0, 0, 0);
      plumeGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      plumeGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.8)');
      plumeGrad.addColorStop(1, 'rgba(254, 240, 138, 1)');

      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.moveTo(-10 - flicker, 0);
      ctx.lineTo(-2, -2.5);
      ctx.lineTo(-2, 2.5);
      ctx.closePath();
      ctx.fill();

      // Miniature Missile Body (Yellow/black hazard striped if haywire)
      ctx.fillStyle = m.isHaywire ? '#facc15' : '#e2e8f0';
      ctx.fillRect(-2, -2, 11, 4);

      // Nosecone
      ctx.fillStyle = m.isHaywire ? '#ea580c' : '#dc2626';
      ctx.beginPath();
      ctx.moveTo(9, -2);
      ctx.lineTo(14, 0);
      ctx.lineTo(9, 2);
      ctx.closePath();
      ctx.fill();

      // Black Hazard Stripe
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2.5, -2, 2, 4);
      if (m.isHaywire) {
        ctx.fillRect(6, -2, 2, 4);
      }

      // Small Stabilizer Fins
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, -4.5, 2.5, 2.5);
      ctx.fillRect(-2, 2, 2.5, 2.5);

      ctx.restore();

      // In-flight Status Indicator
      if (m.isHaywire) {
        ctx.font = '800 8.5px "Cabinet Grotesk", sans-serif';
        ctx.fillStyle = '#f97316';
        ctx.textAlign = 'center';
        ctx.fillText("HAYWIRE!", screenX, screenY - 11);
      } else if (m.overshot) {
        ctx.font = '700 8.5px "Outfit", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText("EVADED!", screenX, screenY - 10);
      }
    }
  }

  private drawParticles(particles: Particle[], cameraX: number) {
    const ctx = this.ctx;

    for (const p of particles) {
      const screenX = p.x - cameraX;
      const alpha = Math.max(0, p.alpha * (p.life / p.maxLife));

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'shockwave') {
        const radius = Math.max(0.1, p.size * Math.max(0, 1 - p.life / p.maxLife));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'smoke') {
        // Realistic billowing smoke puff: expands naturally as it ascends!
        const expansion = Math.max(0.5, 1 + Math.max(0, 1 - p.life / p.maxLife) * 1.6);
        const currentRadius = Math.max(0.1, p.size * expansion);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const safeSize = Math.max(0.1, p.size);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, safeSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawFloatingTexts(floatingTexts: FloatingText[], cameraX: number) {
    const ctx = this.ctx;

    for (const ft of floatingTexts) {
      const screenX = ft.x - cameraX;
      const progress = ft.life / ft.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.min(1, progress * 1.5);
      ctx.font = ft.isPenalty ? '800 15px "Cabinet Grotesk", sans-serif' : '800 16px "Cabinet Grotesk", sans-serif';
      ctx.textAlign = 'center';

      // Outline for readability
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, screenX, ft.y);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, screenX, ft.y);

      ctx.restore();
    }
  }
}

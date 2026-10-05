import { Building, Bomb, Missile, Bullet, Particle, FloatingText, SpitfirePlane, SectorConfig } from '../types/game';
import { GROUND_Y, PALETTE, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private shakeTime: number = 0;
  private shakeMagnitude: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
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
    gameTime: number
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
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-6, -1, 12, 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.fillRect(-10, -2, 16, 4);
      } else {
        // Enemy Anti-Aircraft Flak Tracer Round (fiery red/orange with hot core)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(1, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(249, 115, 22, 0.65)';
        ctx.fillRect(-8, -1.5, 8, 3);
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
        this.drawDestroyedBuilding(b, screenX, topY);
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
    ctx.fillRect(screenX - 2, GROUND_Y - 5, w + 4, 5);

    // Tracked Vehicle Lower Treads
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(screenX + 2, GROUND_Y - 12, w - 4, 12, 3);
    ctx.fill();

    // Road wheels inside tracks
    ctx.fillStyle = '#44403c';
    for (let wx = screenX + 9; wx < screenX + w - 7; wx += 10) {
      ctx.beginPath();
      ctx.arc(wx, GROUND_Y - 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(wx, GROUND_Y - 6, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#44403c';
    }

    // Armored Command Cabin
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(screenX + 5, GROUND_Y - 27, w - 10, 16, 3);
    ctx.fill();
    ctx.stroke();

    // Hazard Stripes on Chassis
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX + 7, GROUND_Y - 25, 7, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(screenX + 9, GROUND_Y - 25, 3, 12);

    // Dual SAM missile rail on side
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX + w - 18, GROUND_Y - 32, 12, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + w - 19, GROUND_Y - 33, 11, 2.5);
    ctx.fillRect(screenX + w - 19, GROUND_Y - 29, 11, 2.5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX + w - 21, GROUND_Y - 33, 3, 2.5);
    ctx.fillRect(screenX + w - 21, GROUND_Y - 29, 3, 2.5);

    // Elevated Turret Swivel Pedestal
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 5, GROUND_Y - 36, 10, 10);

    // Active Swiveling Radar Dish (rotates to track the Spitfire!)
    const trackAngle = b.radarTrackAngle ?? -Math.PI / 2;
    const dishY = GROUND_Y - 36;

    ctx.save();
    ctx.translate(cx, dishY);
    ctx.rotate(trackAngle);

    // Tactical Radar Dish Frame
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Antenna feed horn
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();

    // Radar Active Emitter Blinking Beacon
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

    ctx.restore();

    // HUD Target Callout with Cyan Radar HQ identifier
    this.drawTargetMarker(cx, topY - 26, gameTime, true, false);

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

    // Roof Structure: Radar or Silo or Jammed
    if (b.isJammed) {
      const siloX = screenX + b.width / 2;
      ctx.fillStyle = '#292524';
      ctx.fillRect(siloX - 9, topY - 10, 18, 10);
      // Sparking electrical malfunction
      if (Math.sin(gameTime * 20) > 0.3) {
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
      // Missile Launch Silo Tube
      const siloX = screenX + b.width / 2;
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

    // TARGET HUD CALLOUT (Pulsing tactical chevron & label)
    this.drawTargetMarker(screenX + b.width / 2, topY - 26, gameTime, false, b.isJammed);
  }

  private drawTargetMarker(centerX: number, topY: number, gameTime: number, isRadar: boolean = false, isJammed: boolean = false) {
    const ctx = this.ctx;
    const pulse = Math.sin(gameTime * 6) * 2.5;
    const y = topY + pulse;

    ctx.save();
    // Badge color
    ctx.fillStyle = isJammed ? '#c2410c' : isRadar ? '#0284c7' : '#dc2626';
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
    ctx.fillStyle = isJammed ? '#f97316' : isRadar ? '#38bdf8' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(centerX - 4, y + 8);
    ctx.lineTo(centerX + 4, y + 8);
    ctx.lineTo(centerX, y + 13);
    ctx.closePath();
    ctx.fill();

    // Text: "RADAR HQ", "RADAR BLIND", or "TARGET"
    ctx.font = '700 8.5px "Cabinet Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    const label = isJammed ? "RADAR BLIND" : isRadar ? "RADAR HQ" : "TARGET";
    ctx.fillText(label, centerX, y - 9);

    ctx.restore();
  }

  private drawCivilianBuilding(b: Building, screenX: number, topY: number) {
    const ctx = this.ctx;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(screenX - 3, topY + 4, b.width, b.height);

    // Main Facade
    ctx.fillStyle = b.themeStyle.baseColor;
    ctx.fillRect(screenX, topY, b.width, b.height);

    // Roof Styling
    if (b.themeStyle.roofType === 'gable') {
      // Triangle pitch roof
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(screenX - 4, topY);
      ctx.lineTo(screenX + b.width / 2, topY - 26);
      ctx.lineTo(screenX + b.width + 4, topY);
      ctx.closePath();
      ctx.fill();
      // Chimney
      ctx.fillStyle = '#78350f';
      ctx.fillRect(screenX + b.width - 18, topY - 32, 10, 20);
    } else if (b.themeStyle.roofType === 'mansard') {
      // Victorian Mansard roof
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(screenX - 3, topY);
      ctx.lineTo(screenX + 8, topY - 22);
      ctx.lineTo(screenX + b.width - 8, topY - 22);
      ctx.lineTo(screenX + b.width + 3, topY);
      ctx.closePath();
      ctx.fill();
    } else if (b.themeStyle.roofType === 'dome') {
      // Clock tower or church dome
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(screenX + b.width / 2, topY, b.width * 0.45, Math.PI, 0);
      ctx.fill();
      // Weather vane / finial
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX + b.width / 2, topY - b.width * 0.45);
      ctx.lineTo(screenX + b.width / 2, topY - b.width * 0.45 - 14);
      ctx.stroke();
    } else {
      // Flat decorative cornice
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(screenX - 3, topY - 8, b.width + 6, 8);
    }

    // Windows with warm amber lighting
    const winW = 10;
    const winH = 14;
    ctx.fillStyle = '#fef08a'; // Warm light
    for (let row = 1; row <= b.themeStyle.windowRows; row++) {
      const wy = topY + 14 + row * 26;
      if (wy > GROUND_Y - 20) break;
      for (let col = 0; col < b.themeStyle.windowCols; col++) {
        const wx = screenX + 10 + col * 20;
        ctx.fillRect(wx, wy, winW, winH);
        // Window frame
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, winW, winH);
      }
    }

    // Front Door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(screenX + b.width / 2 - 8, GROUND_Y - 22, 16, 22);

    // Subtle Spared / Civilian indicator (small shield, very clean)
    ctx.font = '600 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("CIVILIAN", screenX + b.width / 2, GROUND_Y - 4);
  }

  private drawDestroyedBuilding(b: Building, screenX: number, topY: number) {
    const ctx = this.ctx;
    const ruinHeight = Math.max(30, b.height * 0.35);
    const ruinY = GROUND_Y - ruinHeight;

    // Blackened rubble
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(screenX, GROUND_Y);
    ctx.lineTo(screenX, ruinY + 8);
    ctx.lineTo(screenX + b.width * 0.3, ruinY);
    ctx.lineTo(screenX + b.width * 0.6, ruinY + 12);
    ctx.lineTo(screenX + b.width, ruinY + 4);
    ctx.lineTo(screenX + b.width, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Red-hot burning embers inside rubble
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(screenX + 8, GROUND_Y - 14, b.width - 16, 6);

    // Rubble debris mounds
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(screenX + 6, GROUND_Y - 4, 10, 0, Math.PI * 2);
    ctx.arc(screenX + b.width - 6, GROUND_Y - 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Neutralized label
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = b.type === 'ENEMY' ? '#22c55e' : '#ef4444';
    ctx.fillText(b.type === 'ENEMY' ? "NEUTRALIZED" : "CASUALTY", screenX + b.width / 2, ruinY - 6);
  }

  private drawAimGuide(plane: SpitfirePlane, cameraX: number) {
    if (plane.bombCooldown > 0.05 || plane.isTurning180) return;

    const ctx = this.ctx;
    const dir = plane.direction ?? 1;
    const angle = plane.angle;
    const startX = (plane.x + Math.cos(angle) * (4 * dir) - Math.sin(angle) * 8) - cameraX;
    const startY = plane.y + Math.sin(angle) * 4 + Math.cos(angle) * 8;

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
        const radius = p.size * (1 - p.life / p.maxLife);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
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

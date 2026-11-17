import { Match, WORLD, clamp } from './engine.js';
import { fighterSVG } from './art.js';
import { translate, translateDOM } from './i18n.js';

const P1_KEYS = { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'block', KeyJ: 'punch', KeyK: 'kick', KeyL: 'special' };
const P2_KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'block', Comma: 'punch', Period: 'kick', Slash: 'special' };
const FONT = '"Bricolage Grotesque", "PingFang SC", "Microsoft YaHei", sans-serif';
const MONO = '"Space Mono", "PingFang SC", "Microsoft YaHei", monospace';

export function cameraLayout(portrait, players) {
  if (!portrait) return { width: 1200, height: 640, x: 0, y: 0, scale: 1 };
  const visibleWidth = clamp(Math.abs(players[0].x - players[1].x) + 320, 840, 1200);
  const scale = 840 / visibleWidth;
  const center = (players[0].x + players[1].x) / 2;
  const left = clamp(center - visibleWidth / 2, 0, WORLD.width - visibleWidth);
  return { width: 840, height: 760, x: -left * scale, y: 760 - WORLD.height * scale, scale };
}

class ArcadeAudio {
  constructor(enabled) { this.enabled = enabled; this.context = null; }
  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    } catch { /* Audio is optional in restricted browsers. */ }
  }
  tone(frequency, duration = 0.1, type = 'square', volume = 0.03, endFrequency = frequency / 2, delay = 0) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context || this.context.state !== 'running') return;
    const context = this.context;
    const time = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
  play(event) {
    if (event === 'hit') { this.tone(140, 0.13, 'sawtooth', 0.045, 35); this.tone(500, 0.065, 'triangle', 0.04, 90); }
    if (event === 'attack') this.tone(170, 0.07, 'triangle', 0.015, 330);
    if (event === 'block') this.tone(660, 0.07, 'square', 0.025, 170);
    if (event === 'jump') this.tone(190, 0.13, 'sine', 0.035, 520);
    if (event === 'special') { this.tone(130, 0.35, 'sawtooth', 0.04, 590); this.tone(400, 0.35, 'sine', 0.025, 100); }
    if (event === 'fight') [260, 330, 520].forEach((note, index) => this.tone(note, 0.16, 'square', 0.025, note, index * 0.11));
    if (event === 'ko') [520, 390, 260, 130].forEach((note, index) => this.tone(note, 0.23, 'triangle', 0.06, note, index * 0.12));
  }
  destroy() { this.context?.close().catch(() => {}); this.context = null; }
}

function rounded(ctx, x, y, w, h, radius, fill, stroke, lineWidth = 1) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
function text(ctx, value, x, y, size, color = '#333a31', align = 'left', family = FONT, weight = 800) {
  ctx.font = `${weight} ${size}px ${family}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(translate(value), x, y);
}

export class GameView {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;
    this.match = new Match(options);
    this.audio = new ArcadeAudio(options.sound);
    this.keys = new Set();
    this.touch = {};
    this.images = [];
    this.particles = [];
    this.labels = [];
    this.rings = [];
    this.shake = 0;
    this.paused = false;
    this.running = false;
    this.destroyed = false;
    this.lastTime = 0;
    this.animationId = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.portrait = false;
    this.touchEnergy = document.querySelector('#touch-energy');
    this.specialStatus = document.querySelector('#special-status');
    this.specialButton = document.querySelector('.pad-special');
    this.lastEnergy = -1;
    this.abort = new AbortController();
    this.background = document.createElement('canvas');
    this.background.width = WORLD.width;
    this.background.height = WORLD.height;
    this.drawBackground(this.background.getContext('2d'));
  }

  async load() {
    this.images = await Promise.all(this.match.players.map((player, index) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load artwork for ${player.name}`));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fighterSVG(player.id, index === 0 ? this.options.skin : 'yellow'))}`;
    })));
  }

  start() {
    if (this.destroyed) return;
    this.running = true;
    this.audio.unlock();
    const eventOptions = { signal: this.abort.signal };
    this.resize();
    this.refreshLocale();
    window.addEventListener('resize', () => this.resize(), eventOptions);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyP') {
        event.preventDefault();
        if (!event.repeat) this.options.onTogglePause();
        return;
      }
      if (P1_KEYS[event.code] || P2_KEYS[event.code]) {
        event.preventDefault();
        if (!this.paused) this.keys.add(event.code);
        this.audio.unlock();
      }
    }, eventOptions);
    window.addEventListener('keyup', (event) => this.keys.delete(event.code), eventOptions);
    window.addEventListener('blur', () => {
      this.clearInput();
      if (!this.paused && this.match.phase !== 'ended') this.options.onPause();
    }, eventOptions);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.paused && this.match.phase !== 'ended') this.options.onPause();
    }, eventOptions);
    this.canvas.tabIndex = -1;
    this.canvas.focus();
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((time) => this.frame(time));
  }

  resize() {
    this.portrait = window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;
    const layout = cameraLayout(this.portrait, this.match.players);
    if (this.canvas.width !== layout.width || this.canvas.height !== layout.height) {
      this.canvas.width = layout.width;
      this.canvas.height = layout.height;
    }
    this.clearInput();
  }
  refreshLocale() {
    this.drawBackground(this.background.getContext('2d'));
    this.lastEnergy = -1;
    this.updateGamepad();
    if (this.images.length === 2) this.draw();
  }
  setSound(enabled) { this.audio.enabled = enabled; if (enabled) this.audio.unlock(); }
  clearInput() {
    this.keys.clear(); this.touch = {};
    this.options.onInputReset?.();
  }
  updateGamepad() {
    const energy = Math.floor(this.match.players[0].energy);
    if (energy === this.lastEnergy) return;
    this.lastEnergy = energy;
    if (this.touchEnergy) this.touchEnergy.style.width = `${energy}%`;
    if (this.specialStatus) this.specialStatus.textContent = energy >= 70 ? 'SPECIAL READY' : `CHARGING ${energy}%`;
    this.specialButton?.classList.toggle('charging', energy < 70);
    this.specialButton?.setAttribute('aria-label', energy >= 70 ? 'Special move ready' : `Special recharging: ${energy} of 70 energy needed`);
    translateDOM(this.specialStatus);
    translateDOM(this.specialButton);
  }
  pause() { this.paused = true; this.clearInput(); }
  resume() { this.clearInput(); this.lastTime = performance.now(); this.paused = false; this.audio.unlock(); }
  destroy() {
    this.running = false;
    this.destroyed = true;
    cancelAnimationFrame(this.animationId);
    this.abort.abort();
    this.clearInput();
    this.audio.destroy();
  }
  input(mapping) {
    const input = {};
    for (const code of this.keys) if (mapping[code]) input[mapping[code]] = true;
    return input;
  }

  frame(time) {
    if (!this.running) return;
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.04);
    this.lastTime = time;
    if (!this.paused) {
      this.match.step(dt, [{ ...this.input(P1_KEYS), ...Object.fromEntries(Object.entries(this.touch).filter(([, pressed]) => pressed)) }, this.input(P2_KEYS)]);
      this.processEvents();
      this.updateEffects(dt);
      this.updateGamepad();
    }
    this.draw();
    this.animationId = requestAnimationFrame((next) => this.frame(next));
  }

  processEvents() {
    for (const event of this.match.drainEvents()) {
      this.audio.play(event.type);
      if (event.type === 'hit' || event.type === 'block') {
        const blocked = event.type === 'block';
        this.shake = blocked ? 2 : event.kind === 'special' ? 13 : 5;
        const count = blocked ? 6 : 16;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 70 + Math.random() * 300;
          this.particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 70, size: 3 + Math.random() * 8, life: .5, maxLife: .5, color: blocked ? '#b9ecf4' : ['#fff4c9', '#ff7644', '#f0c342', '#353b31'][i % 4] });
        }
        const words = ['BONK!', 'OOF!', 'WHAM!', 'BRUH.', 'BOP!'];
        this.labels.push({ text: blocked ? 'BLOCKED' : event.kind === 'special' ? 'ABSOLUTE CINEMA!' : words[Math.floor(Math.random() * words.length)], x: clamp(event.x, 140, 1040), y: event.y - 70, life: .8, maxLife: .8, color: blocked ? '#9fdef0' : '#fff1b4', size: event.kind === 'special' ? 29 : 33, angle: (Math.random() - .5) * .3 });
        if (!blocked) this.labels.push({ text: `−${event.damage}`, x: event.x + 30, y: event.y, life: .75, maxLife: .75, color: '#fff5df', size: 22, angle: 0 });
      }
      if (event.type === 'special') {
        const player = this.match.players[event.player];
        this.labels.push({ text: player.special.toUpperCase(), x: clamp(player.x, 175, 1025), y: 215, life: 1.2, maxLife: 1.2, color: '#fff4c4', size: 25, angle: -.05 });
        this.rings.push({ x: player.x, y: player.y - 12, radius: 30, life: .7, maxLife: .7, color: player.color });
      }
      if (event.type === 'land' || event.type === 'jump') {
        for (let i = 0; i < 5; i++) this.particles.push({ x: event.x + (Math.random() - .5) * 60, y: event.y, vx: (Math.random() - .5) * 120, vy: -Math.random() * 50, size: 4 + Math.random() * 8, life: .3, maxLife: .3, color: '#e9dec5' });
      }
      if (event.type === 'fight') this.labels.push({ text: 'MAKE IT WEIRD.', x: 600, y: 240, life: .85, maxLife: .85, color: '#ffdb91', size: 48, angle: -.05 });
      if (event.type === 'ko') this.shake = 12;
      if (event.type === 'end') this.options.onEnd(this.match);
    }
  }
  updateEffects(dt) {
    this.shake *= Math.exp(-dt * 16);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 450 * dt; p.life -= dt; }
    for (const label of this.labels) { label.y -= 30 * dt; label.life -= dt; }
    for (const ring of this.rings) { ring.radius += dt * 380; ring.life -= dt; }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.labels = this.labels.filter((label) => label.life > 0);
    this.rings = this.rings.filter((ring) => ring.life > 0);
  }

  drawBackground(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 500);
    sky.addColorStop(0, '#e6ebd9'); sky.addColorStop(1, '#f3ebd3');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 1200, 640);
    ellipse(ctx, 874, 185, 60, 60, '#f6cd85');
    ellipse(ctx, 180, 191, 85, 17, '#f7f4e6'); ellipse(ctx, 240, 196, 78, 13, '#f7f4e6');
    ellipse(ctx, 696, 157, 64, 14, '#f7f4e6');
    // A hand-drawn campus skyline, inspired by the mascot's university visits.
    const buildings = [[0, 244, 146, 157], [125, 210, 142, 191], [244, 263, 152, 135], [825, 230, 142, 172], [954, 260, 138, 143], [1074, 204, 150, 201]];
    for (const [x, y, w, h] of buildings) {
      rounded(ctx, x, y, w, h, 2, '#b7c8b7');
      rounded(ctx, x - 3, y - 7, w + 6, 10, 0, '#9cac9c');
      for (let wx = x + 14; wx < x + w - 10; wx += 28) for (let wy = y + 18; wy < y + h - 15; wy += 31) rounded(ctx, wx, wy, 13, 20, 1, '#dce4d4');
    }
    rounded(ctx, 357, 267, 453, 174, 0, '#e3d5b6', '#baac8e', 2);
    rounded(ctx, 349, 255, 469, 16, 2, '#c6b694', '#a6987d', 2);
    rounded(ctx, 386, 291, 398, 19, 2, '#efe4c9');
    text(ctx, 'MEME UNIVERSITY', 585, 306, 16, '#8f846b', 'center', MONO, 700);
    for (let x = 394; x < 772; x += 69) {
      rounded(ctx, x, 328, 43, 68, 2, '#819b91', '#b5a283', 2);
      line(ctx, x + 22, 329, x + 22, 395, '#d5c5a5', 3);
      line(ctx, x, 360, x + 43, 360, '#d5c5a5', 3);
    }
    for (const tx of [74, 299, 890, 1133]) {
      rounded(ctx, tx - 7, 325, 14, 128, 2, '#929375');
      ellipse(ctx, tx, 312, 63, 56, '#99ae85');
      ellipse(ctx, tx - 25, 294, 39, 37, '#a5b88d');
      ellipse(ctx, tx + 30, 317, 40, 37, '#8da47b');
      ellipse(ctx, tx - 9, 270, 32, 29, '#acc096');
    }
    rounded(ctx, 0, 425, 1200, 65, 0, '#bfccaa');
    rounded(ctx, 0, 449, 1200, 11, 0, '#8e9d82');
    // Courtyard noticeboards and a very unserious spectator section.
    rounded(ctx, 82, 377, 150, 71, 4, '#df8c5f', '#897252', 3);
    text(ctx, 'NO THOUGHTS.', 157, 402, 14, '#fff2d3', 'center');
    text(ctx, 'JUST HANDS.', 157, 423, 17, '#fff2d3', 'center');
    rounded(ctx, 973, 375, 136, 73, 4, '#e8d9a9', '#a29774', 3);
    text(ctx, 'CAMPUS RULE #01', 1041, 395, 9, '#8b826a', 'center', MONO, 400);
    text(ctx, 'STAY SILLY.', 1041, 423, 18, '#6c785b', 'center');
    for (let i = 0; i < 13; i++) {
      const x = 270 + i * 51;
      const y = 443 + (i % 3) * 3;
      const colors = ['#d6bd7e', '#a1b798', '#cdab93', '#b1b5c6'];
      ellipse(ctx, x, y, 13, 19, colors[i % 4]);
      ellipse(ctx, x, y - 17, 13, 12, colors[i % 4]);
      ellipse(ctx, x - 4, y - 19, 1.8, 2, '#60634f');
      ellipse(ctx, x + 4, y - 19, 1.8, 2, '#60634f');
    }
    rounded(ctx, 0, 461, 1200, 31, 0, '#b0b3a0');
    line(ctx, 0, 462, 1200, 462, '#8c9582', 3);
    for (let x = 0; x < 1200; x += 100) line(ctx, x, 463, x, 490, '#c6c9b5', 2);
    const floor = ctx.createLinearGradient(0, 491, 0, 640);
    floor.addColorStop(0, '#d7b597'); floor.addColorStop(1, '#c3987f');
    rounded(ctx, 0, 491, 1200, 149, 0, floor);
    line(ctx, 0, 494, 1200, 494, '#efe2bd', 6);
    for (let x = -600; x < 1800; x += 130) line(ctx, 600 + (x - 600) * .66, 498, x, 640, '#b78f7466', 1);
    for (const y of [530, 578, 635]) line(ctx, 0, y, 1200, y, '#b58c7266', 1);
    ctx.save(); ctx.globalAlpha = .3; ctx.translate(600, 559); ctx.transform(1, 0, -.3, .45, 0, 0);
    text(ctx, 'CERTIFIED CHAOS ZONE', 0, 0, 43, '#8a6450', 'center'); ctx.restore();
    for (let x = 0; x < 1200; x += 24) {
      rounded(ctx, x, 615, 12, 12, 0, '#e2c7a4');
      rounded(ctx, x + 12, 627, 12, 12, 0, '#e2c7a4');
    }
    text(ctx, '01 / CAMPUS COURTYARD', 28, 600, 9, '#806a55', 'left', MONO, 400);
    text(ctx, 'FAN-MADE · FRIENDSHIP NOT INCLUDED', 1170, 600, 9, '#806a55', 'right', MONO, 400);
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const t = this.match.elapsed;
    const active = this.match.phase === 'fight';
    const move = player.attack;
    const attackProgress = move ? Math.sin(Math.min(1, move.time / move.duration) * Math.PI) : 0;
    const air = WORLD.floor - player.y;
    ellipse(ctx, player.x, WORLD.floor + 3, Math.max(27, 65 - air * .13), 11, '#5d614e28');
    ctx.save();
    const bob = active && player.moving ? Math.abs(Math.sin(t * 17)) * -7 : Math.sin(t * 3 + player.index) * 2;
    ctx.translate(player.x, player.y + bob);
    if (this.match.phase === 'roundEnd' && player.hp === 0) {
      ctx.translate(0, 3); ctx.rotate(-player.facing * 1.15); ctx.globalAlpha = .7;
    }
    const squish = player.block ? .93 : 1 + Math.sin(t * 3 + player.index) * .012;
    ctx.scale(player.facing * .9, .9 * squish);
    ctx.rotate(move ? attackProgress * .15 : player.moving ? Math.sin(t * 17) * .035 : 0);
    if (player.flash > 0) ctx.filter = 'brightness(1.65) saturate(.5)';
    const special = move?.kind === 'special';
    const bodyColor = player.id === 'nailong' && player.index === 0 ? ({ blue: '#69bee7', red: '#e9675f' }[this.options.skin] || player.color) : player.color;
    const limbPaint = ctx.createLinearGradient(0, move?.kind === 'kick' ? -88 : -132, 0, move?.kind === 'kick' ? -36 : -82);
    limbPaint.addColorStop(0, '#fff2c7'); limbPaint.addColorStop(.32, bodyColor); limbPaint.addColorStop(1, bodyColor);
    if (special) {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 25;
    }
    ctx.drawImage(this.images[player.index], -150, -277, 300, 300);
    ctx.filter = 'none'; ctx.shadowBlur = 0;
    if (move?.kind === 'punch' && attackProgress > .15) {
      const reach = attackProgress * 102;
      ctx.strokeStyle = '#756044'; ctx.lineWidth = 23; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(40, -103); ctx.lineTo(65 + reach, -106); ctx.stroke();
      ctx.strokeStyle = limbPaint; ctx.lineWidth = 21; ctx.stroke();
      ellipse(ctx, 73 + reach, -108, 23, 20, '#967447');
      ellipse(ctx, 73 + reach, -109, 22, 19, limbPaint);
      line(ctx, 78 + reach, -118, 78 + reach, -105, '#765531', 2);
      line(ctx, 85 + reach, -117, 85 + reach, -105, '#765531', 2);
      if (attackProgress > .8) {
        line(ctx, 84 + reach, -132, 104 + reach, -137, '#fff1be', 3);
        line(ctx, 87 + reach, -93, 111 + reach, -91, '#fff1be', 3);
      }
    }
    if (move?.kind === 'kick' && attackProgress > .25) {
      const reach = attackProgress * 124;
      ctx.lineCap = 'round'; ctx.lineWidth = 28; ctx.strokeStyle = '#967447';
      ctx.beginPath(); ctx.moveTo(21, -30); ctx.lineTo(53 + reach, -65); ctx.stroke();
      ctx.lineWidth = 26; ctx.strokeStyle = limbPaint; ctx.stroke();
      ellipse(ctx, 65 + reach, -63, 27, 19, '#967447');
      ellipse(ctx, 66 + reach, -65, 26, 17, limbPaint);
    }
    if (player.block) {
      ctx.beginPath(); ctx.ellipse(60, -123, 38, 94, .1, -1.3, 1.3);
      ctx.strokeStyle = '#d2f6ef'; ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(66, -123, 45, 106, .1, -1.25, 1.25);
      ctx.strokeStyle = '#a4d6d58c'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    if (active) {
      ctx.globalAlpha = .65;
      text(ctx, player.index === 0 ? '▼ YOU' : this.options.mode === 'cpu' ? '▼ CPU' : '▼ P2', player.x, player.y + 29, 9, '#5f5947', 'center', MONO, 700);
      ctx.globalAlpha = 1;
    }
  }

  drawHUD() {
    const ctx = this.ctx;
    const match = this.match;
    for (const player of match.players) {
      const isP2 = player.index === 1;
      const w = this.portrait ? 310 : 452;
      const x = isP2 ? this.canvas.width - w - (this.portrait ? 22 : 38) : this.portrait ? 22 : 38;
      const end = x + w;
      rounded(ctx, x - 9, 20, w + 18, 116, 8, '#f8f3e5ed', '#aba890', 1);
      rounded(ctx, isP2 ? end - 58 : x, 30, 52, 53, 5, player.background, '#c3b89d', 1);
      ctx.save();
      ctx.beginPath(); ctx.roundRect(isP2 ? end - 58 : x, 30, 52, 53, 5); ctx.clip();
      ctx.drawImage(this.images[player.index], isP2 ? end - 61 : x - 3, 27, 63, 63);
      ctx.restore();
      const nameX = isP2 ? end - 70 : x + 65;
      const align = isP2 ? 'right' : 'left';
      text(ctx, player.name.toUpperCase(), nameX, 52, this.portrait ? 21 : 24, '#333a31', align);
      text(ctx, isP2 ? this.options.mode === 'cpu' ? `CPU / ${this.options.difficulty.toUpperCase()}` : 'PLAYER 02 / THE FRIEND' : 'PLAYER 01 / THE MENACE', nameX, 69, 8, '#8a8873', align, MONO, 400);
      const healthX = isP2 ? x : x + 65;
      const healthWidth = w - 65;
      rounded(ctx, healthX, 79, healthWidth, 17, 3, '#dbd9c7', '#626950', 1.5);
      const fillWidth = (healthWidth - 4) * Math.max(0, player.hp / player.health);
      const healthColor = player.hp / player.health < .25 ? '#e77c59' : isP2 ? '#99b77b' : '#f1b754';
      if (fillWidth > 0) rounded(ctx, isP2 ? healthX + healthWidth - 2 - fillWidth : healthX + 2, 81, fillWidth, 13, 2, healthColor);
      text(ctx, `${Math.ceil(player.hp)} / ${player.health}`, healthX + healthWidth / 2, 91, 8, '#4c543e', 'center', MONO, 700);
      const energyX = isP2 ? x + 90 : x + 65;
      rounded(ctx, energyX, 104, 180, 5, 2, '#dedac7');
      rounded(ctx, energyX, 104, 180 * player.energy / 100, 5, 2, player.energy >= 70 ? '#f8844d' : '#bfb49b');
      text(ctx, player.energy >= 70 ? 'SPECIAL READY' : 'RECHARGING...', energyX, 123, 7, player.energy >= 70 ? '#b66d3f' : '#969080', 'left', MONO, 400);
      for (let i = 0; i < 2; i++) {
        const dotX = isP2 ? x + 10 + i * 18 : end - 10 - i * 18;
        ellipse(ctx, dotX, 116, 5, 5, match.wins[player.index] > i ? '#ea7848' : '#d5d1bc');
      }
      if (player.combo >= 2 && player.comboTimer > 0) {
        text(ctx, `${player.combo}× COMBO`, isP2 ? end : x, 175, 25, '#df693c', isP2 ? 'right' : 'left');
      }
    }
    const center = this.canvas.width / 2;
    rounded(ctx, center - 70, 20, 140, 113, 9, '#323b30', '#262e25', 2);
    text(ctx, `ROUND ${match.round}`, center, 42, 10, '#a8b698', 'center', MONO, 400);
    text(ctx, String(Math.ceil(match.time)).padStart(2, '0'), center, 94, 55, match.time < 10 ? '#ff9966' : '#fff1cc', 'center');
    text(ctx, 'BEST OF THREE', center, 120, 8, '#b8c2a6', 'center', MONO, 400);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#e6ebd9'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const camera = cameraLayout(this.portrait, this.match.players);
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
    if (!this.reducedMotion && this.shake > .5) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    ctx.drawImage(this.background, 0, 0);
    for (const ring of this.rings) {
      ctx.globalAlpha = ring.life / ring.maxLife;
      ctx.strokeStyle = ring.color; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * .35, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const player of [...this.match.players].sort((a, b) => a.y - b.y)) this.drawPlayer(player);
    for (const orb of this.match.projectiles) {
      ctx.save(); ctx.shadowBlur = 22; ctx.shadowColor = '#cfe9a6';
      ellipse(ctx, orb.x, orb.y, 27, 23, '#6e9c64');
      ellipse(ctx, orb.x + Math.sin(this.match.elapsed * 15) * 4, orb.y, 19, 16, '#c6e49e');
      ellipse(ctx, orb.x - 5, orb.y - 2, 3, 4, '#3d6740');
      ellipse(ctx, orb.x + 6, orb.y - 2, 3, 4, '#3d6740');
      ctx.restore();
    }
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      rounded(ctx, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 1, p.color);
    }
    ctx.globalAlpha = 1;
    for (const label of this.labels) {
      ctx.save(); ctx.translate(label.x, label.y); ctx.rotate(label.angle);
      ctx.globalAlpha = Math.min(1, label.life * 4);
      ctx.font = `800 ${label.size}px ${FONT}`; ctx.textAlign = 'center';
      ctx.lineJoin = 'round'; ctx.strokeStyle = '#373b2c'; ctx.lineWidth = 5;
      const caption = translate(label.text);
      ctx.strokeText(caption, 0, 0); ctx.fillStyle = label.color; ctx.fillText(caption, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    this.drawHUD();
    if (this.match.phase === 'intro') {
      const time = this.match.phaseTime;
      this.centerAnnouncement(time > 1.3 ? `ROUND ${this.match.round}` : time > .55 ? 'READY?' : 'FIGHT!', time > 1.3 ? 'TINY ARMS. MASSIVE BEEF.' : 'FIRST TO TWO ROUNDS TAKES THE CROWN', '#fff1c5');
    }
    if (this.match.phase === 'roundEnd') {
      const winner = this.match.roundWinner;
      this.centerAnnouncement(winner === null ? 'DOUBLE BRUH.' : this.match.players.some((p) => p.hp <= 0) ? 'K.O.!' : 'TIME!', winner === null ? 'A DRAW. RUN THAT ROUND BACK.' : `${this.match.players[winner].name.toUpperCase()} TAKES THE ROUND`, '#ffe1a6');
    }
  }

  centerAnnouncement(title, subtitle, color) {
    const ctx = this.ctx;
    ctx.save();
    const center = this.canvas.width / 2;
    const top = this.portrait ? 280 : 228;
    rounded(ctx, center - 340, top, 680, 128, 6, '#30392fec');
    ctx.translate(center, top + 70); ctx.rotate(-.025);
    text(ctx, title, 0, 0, 65, color, 'center');
    text(ctx, subtitle, 0, 32, 10, '#c9d0b2', 'center', MONO, 400);
    ctx.restore();
  }
}

import { FIGHTERS } from './art.js';

export const WORLD = { width: 1200, height: 640, floor: 500 };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const MOVES = {
  punch: { duration: 0.3, windup: 0.08, active: 0.12, range: 155, damage: 8, knockback: 185 },
  kick: { duration: 0.48, windup: 0.16, active: 0.14, range: 195, damage: 13, knockback: 300 },
  special: { duration: 0.72, windup: 0.2, active: 0.22, range: 285, damage: 24, knockback: 470 },
};

function createPlayer(id, index) {
  const fighter = FIGHTERS.find((item) => item.id === id) || FIGHTERS[0];
  return {
    ...fighter, index, x: index === 0 ? 330 : 870, y: WORLD.floor,
    vx: 0, vy: 0, facing: index === 0 ? 1 : -1,
    hp: fighter.health, energy: 100, attack: null, cooldown: 0,
    stun: 0, flash: 0, block: false, moving: false,
    combo: 0, comboTimer: 0, hits: 0, damageDealt: 0,
  };
}

export class Match {
  constructor({ player = 'nailong', opponent = 'pepe', mode = 'cpu', difficulty = 'spicy', random = Math.random } = {}) {
    this.ids = [player, opponent];
    this.mode = mode;
    this.difficulty = difficulty;
    this.random = random;
    this.players = this.ids.map(createPlayer);
    this.phase = 'intro';
    this.phaseTime = 2.4;
    this.time = 60;
    this.elapsed = 0;
    this.round = 1;
    this.wins = [0, 0];
    this.winner = null;
    this.roundWinner = null;
    this.projectiles = [];
    this.events = [];
    this.cpuTimer = 0;
    this.cpuInput = {};
    this.totalHits = 0;
    this.totalDamage = 0;
    this.bestCombo = 0;
  }

  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { return this.events.splice(0); }

  nextRound() {
    this.round += 1;
    this.players = this.ids.map(createPlayer);
    this.projectiles = [];
    this.time = 60;
    this.phase = 'intro';
    this.phaseTime = 2.1;
    this.cpuInput = {};
    this.cpuTimer = 0;
    this.emit('round', { round: this.round });
  }

  finishRound() {
    if (this.phase !== 'fight') return;
    const [a, b] = this.players;
    const relativeHealth = a.hp / a.health - b.hp / b.health;
    this.roundWinner = Math.abs(relativeHealth) < 0.0001 ? null : relativeHealth > 0 ? 0 : 1;
    if (this.roundWinner !== null) this.wins[this.roundWinner] += 1;
    this.phase = 'roundEnd';
    this.phaseTime = 2.6;
    this.emit('ko', { winner: this.roundWinner });
  }

  cpu(dt) {
    this.cpuTimer -= dt;
    if (this.cpuTimer > 0) return this.cpuInput;
    const a = this.players[1];
    const b = this.players[0];
    const distance = Math.abs(a.x - b.x);
    const settings = {
      chill: { delay: 0.38, aggression: 0.4, defense: 0.1 },
      spicy: { delay: 0.2, aggression: 0.7, defense: 0.3 },
      unhinged: { delay: 0.11, aggression: 0.9, defense: 0.55 },
    }[this.difficulty] || { delay: 0.2, aggression: 0.7, defense: 0.3 };
    this.cpuTimer = settings.delay + this.random() * 0.12;
    const dir = Math.sign(b.x - a.x);
    this.cpuInput = {};
    if (distance > 133) this.cpuInput[dir > 0 ? 'right' : 'left'] = true;
    if (distance < 230 && b.attack && this.random() < settings.defense) {
      this.cpuInput.block = true;
    } else if (distance < 195 && this.random() < settings.aggression) {
      const roll = this.random();
      this.cpuInput[roll > 0.78 && a.energy >= 70 ? 'special' : roll > 0.42 ? 'kick' : 'punch'] = true;
    } else if (a.id === 'pepe' && distance < 600 && this.random() < 0.15) {
      this.cpuInput.special = true;
    }
    if (this.random() < 0.1 && distance > 180) this.cpuInput.jump = true;
    return this.cpuInput;
  }

  startAttack(player, kind) {
    if (player.attack || player.cooldown > 0 || player.stun > 0 || player.block) return false;
    if (!MOVES[kind] || (kind === 'special' && player.energy < 70)) return false;
    if (kind === 'special') player.energy -= 70;
    player.attack = { kind, time: 0, hit: false, activated: false, ...MOVES[kind] };
    this.emit('attack', { player: player.index, kind });
    return true;
  }

  hit(attacker, defender, move, projectile = false) {
    const direction = Math.sign(defender.x - attacker.x) || attacker.facing;
    const blocked = defender.block && defender.facing === -direction && defender.y >= WORLD.floor - 5;
    const rawDamage = move.damage + attacker.power;
    const damage = blocked ? Math.max(1, Math.round(rawDamage * 0.15)) : rawDamage;
    defender.hp = Math.max(0, defender.hp - damage);
    defender.vx = direction * move.knockback * (blocked ? 0.3 : 1);
    defender.stun = blocked ? 0.1 : move.kind === 'special' ? 0.38 : 0.2;
    defender.flash = blocked ? 0.04 : 0.16;
    if (!blocked) {
      defender.attack = null;
      defender.block = false;
      attacker.combo += 1;
      attacker.comboTimer = 1.7;
      attacker.hits += 1;
      attacker.damageDealt += damage;
      if (attacker.index === 0) {
        this.totalHits += 1;
        this.totalDamage += damage;
        this.bestCombo = Math.max(this.bestCombo, attacker.combo);
      }
      if (move.kind === 'special') defender.vy = -240;
    }
    attacker.energy = Math.min(100, attacker.energy + (blocked ? 2 : 6));
    defender.energy = Math.min(100, defender.energy + 4);
    this.emit(blocked ? 'block' : 'hit', {
      x: defender.x - direction * 35, y: defender.y - 110,
      damage, player: attacker.index, kind: move.kind,
      combo: attacker.combo, projectile, color: attacker.color,
    });
  }

  updatePlayer(player, foe, input, dt) {
    player.stun = Math.max(0, player.stun - dt);
    player.flash = Math.max(0, player.flash - dt);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer === 0) player.combo = 0;
    player.energy = Math.min(100, player.energy + dt * 9);
    player.moving = false;
    if (!player.attack && player.stun === 0) player.facing = foe.x >= player.x ? 1 : -1;
    player.block = !!input.block && !player.attack && player.stun === 0 && player.y >= WORLD.floor - 1;
    if (player.stun === 0 && !player.attack) {
      const movement = Number(!!input.right) - Number(!!input.left);
      player.x += movement * player.moveSpeed * (player.block ? 0.23 : 1) * dt;
      player.moving = movement !== 0;
      if (input.jump && player.y >= WORLD.floor && !player.block) {
        player.vy = -660;
        this.emit('jump', { x: player.x, y: player.y });
      }
      if (input.special) this.startAttack(player, 'special');
      else if (input.kick) this.startAttack(player, 'kick');
      else if (input.punch) this.startAttack(player, 'punch');
    }
    player.x = clamp(player.x + player.vx * dt, 80, WORLD.width - 80);
    player.vx *= Math.exp(-dt * 9);
    player.vy += 1750 * dt;
    player.y += player.vy * dt;
    if (player.y >= WORLD.floor) {
      if (player.vy > 280) this.emit('land', { x: player.x, y: WORLD.floor });
      player.y = WORLD.floor;
      player.vy = 0;
    }
    if (!player.attack) return;
    const move = player.attack;
    move.time += dt;
    if (move.time >= move.windup && !move.activated) {
      move.activated = true;
      if (move.kind === 'special') {
        this.emit('special', { player: player.index, id: player.id, x: player.x, y: player.y, color: player.color });
        if (player.id === 'pepe') {
          this.projectiles.push({ x: player.x + player.facing * 90, y: player.y - 105, vx: player.facing * 650, owner: player.index, life: 1.5 });
          move.hit = true;
        }
        if (player.id === 'hajimi') { player.vx = player.facing * 950; move.range = 320; }
        if (player.id === 'nailong') player.vx = player.facing * 450;
        if (player.id === 'tung') { move.range = 330; move.damage = 29; }
        if (player.id === 'capy') player.hp = Math.min(player.health, player.hp + 12);
      }
    }
    if (!move.hit && move.time >= move.windup && move.time <= move.windup + move.active) {
      const dx = foe.x - player.x;
      const inFront = dx * player.facing > -35;
      if (Math.abs(dx) < move.range && Math.abs(player.y - foe.y) < 145 && inFront) {
        move.hit = true;
        this.hit(player, foe, move);
      }
    }
    if (move.time >= move.duration) {
      player.attack = null;
      player.cooldown = move.kind === 'special' ? 0.3 : 0.12;
    }
  }

  step(dt, inputs = [{}, {}]) {
    dt = clamp(dt, 0, 0.05);
    if (this.phase === 'ended') return;
    this.elapsed += dt;
    if (this.phase !== 'fight') {
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) {
        if (this.phase === 'intro') {
          this.phase = 'fight';
          this.emit('fight');
        } else if (Math.max(...this.wins) >= 2) {
          this.winner = this.wins[0] > this.wins[1] ? 0 : 1;
          this.phase = 'ended';
          this.emit('end', { winner: this.winner });
        } else this.nextRound();
      }
      return;
    }
    this.time = Math.max(0, this.time - dt);
    const opponentInput = this.mode === 'cpu' ? this.cpu(dt) : inputs[1] || {};
    this.updatePlayer(this.players[0], this.players[1], inputs[0] || {}, dt);
    this.updatePlayer(this.players[1], this.players[0], opponentInput, dt);
    const [a, b] = this.players;
    if (Math.abs(a.x - b.x) < 88 && Math.abs(a.y - b.y) < 155) {
      const direction = a.x <= b.x ? 1 : -1;
      const separation = (88 - Math.abs(a.x - b.x)) / 2;
      a.x = clamp(a.x - separation * direction, 80, WORLD.width - 80);
      b.x = clamp(b.x + separation * direction, 80, WORLD.width - 80);
    }
    for (const orb of this.projectiles) {
      orb.x += orb.vx * dt;
      orb.life -= dt;
      const foe = this.players[1 - orb.owner];
      if (Math.abs(orb.x - foe.x) < 65 && Math.abs(orb.y - (foe.y - 110)) < 100) {
        this.hit(this.players[orb.owner], foe, { ...MOVES.special, kind: 'special' }, true);
        orb.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter((orb) => orb.life > 0 && orb.x > -50 && orb.x < WORLD.width + 50);
    if (a.hp <= 0 || b.hp <= 0 || this.time <= 0) this.finishRound();
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, MOVES, WORLD } from './engine.js';
import { FIGHTERS, fighterSVG } from './art.js';
import { TouchState, TouchController, stickPosition } from './touch.js';
import { cameraLayout, GameView } from './game.js';
import { parseHTML } from 'linkedom';
import { LANGUAGE_KEY, MESSAGES, normalizeLocale, detectLocale, getLocale, setLocale, translate, translateDOM } from './i18n.js';

const advance = (match, seconds, inputs = [{}, {}]) => {
  for (let remaining = seconds; remaining > 0.00001; remaining -= 1 / 60) match.step(Math.min(remaining, 1 / 60), inputs);
};
const inRange = (options = {}) => {
  const match = new Match({ mode: 'local', ...options });
  match.phase = 'fight';
  match.players[0].x = 440;
  match.players[1].x = 560;
  return match;
};

test('the roster has unique fighters, valid attributes, and self-contained SVG art', () => {
  assert.equal(new Set(FIGHTERS.map((f) => f.id)).size, 5);
  for (const fighter of FIGHTERS) {
    assert.ok(fighter.health > 0 && fighter.moveSpeed > 0);
    const svg = fighterSVG(fighter.id);
    assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg, /<\/svg>$/);
    assert.ok(!svg.includes('undefined'));
  }
  assert.notEqual(fighterSVG('nailong', 'yellow'), fighterSVG('nailong', 'blue'));
  assert.notEqual(fighterSVG('nailong', 'red'), fighterSVG('nailong', 'blue'));
});

test('a new match has a countdown before controls and timer activate', () => {
  const match = new Match();
  advance(match, 1, [{ right: true }, {}]);
  assert.equal(match.players[0].x, 330);
  assert.equal(match.time, 60);
  advance(match, 1.5);
  assert.equal(match.phase, 'fight');
  assert.ok(match.time < 60);
});

test('movement remains within the arena bounds', () => {
  const match = inRange();
  advance(match, 10, [{ left: true }, { right: true }]);
  assert.equal(match.players[0].x, 80);
  assert.equal(match.players[1].x, WORLD.width - 80);
});

test('jumping rises and lands back on the ground', () => {
  const match = inRange();
  match.step(1 / 60, [{ jump: true }, {}]);
  assert.ok(match.players[0].y < WORLD.floor);
  advance(match, 1);
  assert.equal(match.players[0].y, WORLD.floor);
  assert.equal(match.players[0].vy, 0);
});

test('a punch deals damage exactly once per attack', () => {
  const match = inRange();
  const [player, foe] = match.players;
  match.startAttack(player, 'punch');
  advance(match, 0.4);
  assert.equal(foe.hp, foe.health - MOVES.punch.damage - player.power);
  assert.equal(match.totalHits, 1);
  assert.equal(player.attack, null);
});

test('attacks miss when the opponent is out of reach', () => {
  const match = inRange();
  match.players[1].x = 1000;
  match.startAttack(match.players[0], 'kick');
  advance(match, .6);
  assert.equal(match.players[1].hp, match.players[1].health);
});

test('ground attacks miss opponents jumping well above the hitbox', () => {
  const match = inRange();
  match.players[1].y = WORLD.floor - 240;
  match.players[1].vy = -100;
  match.startAttack(match.players[0], 'punch');
  advance(match, .23);
  assert.equal(match.players[1].hp, match.players[1].health);
});

test('blocking reduces damage without awarding a combo', () => {
  const match = inRange();
  match.startAttack(match.players[0], 'punch');
  advance(match, .4, [{}, { block: true }]);
  const foe = match.players[1];
  assert.ok(foe.health - foe.hp <= 3);
  assert.equal(match.totalHits, 0);
  assert.ok(match.drainEvents().some((event) => event.type === 'block'));
});

test('an attack is canceled by an unblocked hit', () => {
  const match = inRange();
  match.startAttack(match.players[0], 'punch');
  match.startAttack(match.players[1], 'kick');
  advance(match, .11);
  assert.equal(match.players[1].attack, null);
  assert.ok(match.players[1].stun > 0);
});

test('specials require and consume energy', () => {
  const match = inRange();
  const player = match.players[0];
  player.energy = 69;
  assert.equal(match.startAttack(player, 'special'), false);
  player.energy = 100;
  assert.equal(match.startAttack(player, 'special'), true);
  assert.equal(player.energy, 30);
  assert.equal(match.startAttack(player, 'special'), false);
});

test('energy recharges, capped at 100', () => {
  const match = inRange();
  match.players[0].energy = 50;
  advance(match, 2);
  assert.ok(match.players[0].energy > 67);
  advance(match, 5);
  assert.equal(match.players[0].energy, 100);
});

test('Pepe fires a traveling projectile that can hit at range', () => {
  const match = inRange({ player: 'pepe', opponent: 'nailong' });
  match.players[1].x = 900;
  match.startAttack(match.players[0], 'special');
  advance(match, .25);
  assert.equal(match.projectiles.length, 1);
  advance(match, .7);
  assert.ok(match.players[1].hp < match.players[1].health);
  assert.equal(match.projectiles.length, 0);
  assert.equal(match.totalHits, 1);
});

test('Capy Boss heals with the special, without exceeding maximum health', () => {
  const match = inRange({ player: 'capy' });
  match.players[0].hp -= 5;
  match.startAttack(match.players[0], 'special');
  advance(match, .25);
  assert.equal(match.players[0].hp, match.players[0].health);
});

test('Hajimi dashes forward with Zoomies', () => {
  const match = inRange({ player: 'hajimi' });
  match.players[1].x = 1000;
  const originalX = match.players[0].x;
  match.startAttack(match.players[0], 'special');
  advance(match, .5);
  assert.ok(match.players[0].x > originalX + 50);
});

test('timeout compares health percentages across different max health', () => {
  const match = inRange({ player: 'capy', opponent: 'hajimi' });
  match.players[0].hp = 70;
  match.players[1].hp = 60;
  match.time = .01;
  match.step(.02);
  assert.equal(match.roundWinner, 1);
  assert.deepEqual(match.wins, [0, 1]);
});

test('a drawn round awards no win and proceeds to another round', () => {
  const match = inRange();
  match.time = .01;
  match.step(.02);
  assert.equal(match.roundWinner, null);
  assert.deepEqual(match.wins, [0, 0]);
  advance(match, 2.7);
  assert.equal(match.round, 2);
  assert.equal(match.phase, 'intro');
});

test('winning two rounds ends the match and emits exactly one end event', () => {
  const match = inRange();
  match.players[1].hp = 0;
  match.step(.02);
  assert.deepEqual(match.wins, [1, 0]);
  advance(match, 5);
  assert.equal(match.phase, 'fight');
  assert.equal(match.round, 2);
  assert.equal(match.players[1].hp, match.players[1].health);
  match.players[1].hp = 0;
  match.step(.02);
  advance(match, 3);
  assert.equal(match.phase, 'ended');
  assert.equal(match.winner, 0);
  assert.deepEqual(match.wins, [2, 0]);
  advance(match, 3);
  assert.equal(match.drainEvents().filter((e) => e.type === 'end').length, 1);
});

test('CPU closes the distance and attacks an idle player', () => {
  const match = new Match({ difficulty: 'unhinged', random: () => .5 });
  match.phase = 'fight';
  advance(match, 7);
  assert.ok(match.players[0].hp < match.players[0].health);
});

test('local two-player controls do not invoke the CPU', () => {
  const match = inRange();
  advance(match, 2);
  assert.equal(match.players[1].x, 560);
  assert.equal(match.players[0].hp, match.players[0].health);
  advance(match, .15, [{}, { punch: true }]);
  assert.ok(match.players[0].hp < match.players[0].health);
});

test('combo tracking expires and damage never takes health below zero', () => {
  const match = inRange();
  const [a, b] = match.players;
  match.hit(a, b, { ...MOVES.punch, kind: 'punch' });
  match.hit(a, b, { ...MOVES.punch, kind: 'punch' });
  assert.equal(match.bestCombo, 2);
  advance(match, 2);
  assert.equal(a.combo, 0);
  b.hp = 1;
  match.hit(a, b, { ...MOVES.kick, kind: 'kick' });
  assert.equal(b.hp, 0);
});

test('every refined portrait has self-contained, collision-free gradients', () => {
  const seen = new Set();
  for (const fighter of [...FIGHTERS, ...FIGHTERS]) {
    const svg = fighterSVG(fighter.id);
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(ids.length >= 3);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) { assert.ok(!seen.has(id)); seen.add(id); }
    for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(ref));
    assert.match(svg, /width="600" height="600"/);
    assert.ok(!svg.includes('<image'));
  }
});

test('Nailong color variants change the body material, not only SVG IDs', () => {
  assert.match(fighterSVG('nailong', 'yellow'), /stop-color="#ffdb4b"/);
  assert.match(fighterSVG('nailong', 'blue'), /stop-color="#7ed4ef"/);
  assert.match(fighterSVG('nailong', 'red'), /stop-color="#f88370"/);
});

test('joystick dead zone prevents accidental movement', () => {
  assert.deepEqual(stickPosition(3, 2, 42).actions, { left: false, right: false });
  assert.deepEqual(stickPosition(-30, 0, 42).actions, { left: true, right: false });
  assert.deepEqual(stickPosition(30, 0, 42).actions, { left: false, right: true });
});

test('joystick travel is clamped to its circular base', () => {
  const position = stickPosition(300, -400, 40);
  assert.ok(Math.abs(Math.hypot(position.x, position.y) - 40) < 0.0001);
  assert.ok(position.actions.right);
  assert.equal(stickPosition(0, -300, 40).actions.right, false);
});

test('multitouch preserves the stick when an attack finger is released', () => {
  const input = new TouchState();
  input.set('stick-1', { right: true, left: false });
  input.set('button-2', { punch: true });
  assert.deepEqual(input.snapshot(), { right: true, punch: true });
  input.release('button-2');
  assert.deepEqual(input.snapshot(), { right: true });
});

test('releasing one of two fingers holding an action keeps the other active', () => {
  const input = new TouchState();
  input.set('one', { block: true });
  input.set('two', { block: true });
  input.release('one');
  assert.deepEqual(input.snapshot(), { block: true });
  input.clear();
  assert.deepEqual(input.snapshot(), {});
});

test('phone camera keeps both players visible at near and far distances', () => {
  for (const positions of [[330, 870], [80, 1120], [80, 180], [1000, 1120], [800, 650]]) {
    const camera = cameraLayout(true, positions.map((x) => ({ x })));
    assert.equal(camera.width, 840);
    assert.equal(camera.height, 760);
    for (const x of positions) {
      const screenX = x * camera.scale + camera.x;
      assert.ok(screenX > 35 && screenX < camera.width - 35);
    }
    assert.equal(WORLD.height * camera.scale + camera.y, camera.height);
  }
});

test('landscape camera preserves the full arena', () => {
  assert.deepEqual(cameraLayout(false, [{ x: 80 }, { x: 1120 }]), { width: 1200, height: 640, x: 0, y: 0, scale: 1 });
});

test('virtual controller pointer events support simultaneous input and cancellation', (t) => {
  class Element extends EventTarget {
    constructor(action) {
      super();
      this.dataset = { touch: action }; this.style = {};
      const names = new Set();
      this.classList = { add: (name) => names.add(name), remove: (name) => names.delete(name), toggle: (name, active) => active ? names.add(name) : names.delete(name) };
    }
    setPointerCapture() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 126, height: 126 }; }
  }
  const oldWindow = globalThis.window;
  globalThis.window = new EventTarget();
  t.after(() => { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; });
  const root = new Element();
  const stick = new Element();
  const knob = new Element();
  const punch = new Element('punch');
  root.querySelector = (selector) => selector === '.joystick-base' ? stick : knob;
  root.querySelectorAll = () => [punch];
  const game = { paused: false, destroyed: false, match: { phase: 'fight' }, touch: {}, audio: { unlock() {} } };
  const controller = new TouchController(root, () => game);
  t.after(() => controller.destroy());
  const dispatch = (element, type, id, x = 63, y = 63) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerId: id, clientX: x, clientY: y });
    element.dispatchEvent(event);
  };
  dispatch(stick, 'pointerdown', 1, 106);
  dispatch(punch, 'pointerdown', 2);
  assert.deepEqual(game.touch, { right: true, punch: true });
  dispatch(punch, 'pointerup', 2);
  assert.deepEqual(game.touch, { right: true });
  dispatch(stick, 'pointercancel', 1);
  assert.deepEqual(game.touch, {});
  assert.equal(knob.style.transform, '');
  dispatch(stick, 'pointerdown', 3, 15);
  assert.deepEqual(game.touch, { left: true });
  game.paused = true;
  controller.reset();
  assert.deepEqual(game.touch, {});
  dispatch(punch, 'pointerdown', 4);
  assert.deepEqual(game.touch, {});
});

test('language detection respects saved settings before browser preferences', () => {
  assert.equal(detectLocale({ getItem: () => '"zh-CN"' }, 'en-US'), 'zh-CN');
  assert.equal(detectLocale({ getItem: () => 'en' }, 'zh-CN'), 'en');
  assert.equal(detectLocale({ getItem: () => 'broken' }, 'zh-HK'), 'zh-CN');
  assert.equal(detectLocale({ getItem: () => null }, 'fr-FR'), 'en');
  assert.equal(detectLocale({ getItem() { throw Error('blocked'); } }, 'zh-CN'), 'zh-CN');
  assert.equal(normalizeLocale({ language: 'zh' }), null);
});

test('language selection persists and tolerates disabled storage', (t) => {
  t.after(() => setLocale('en', null));
  const values = new Map();
  setLocale('zh-CN', { setItem: (key, value) => values.set(key, value) });
  assert.equal(values.get(LANGUAGE_KEY), '"zh-CN"');
  assert.equal(getLocale(), 'zh-CN');
  setLocale('unsupported', null);
  assert.equal(getLocale(), 'zh-CN');
  assert.doesNotThrow(() => setLocale('en', { setItem() { throw Error('blocked'); } }));
  assert.equal(getLocale(), 'en');
});

test('translations cover all fighter names, descriptions, roles, and specials', () => {
  for (const fighter of FIGHTERS) {
    for (const field of ['name', 'nickname', 'role', 'special', 'tagline']) {
      assert.notEqual(translate(fighter[field], 'zh-CN'), fighter[field], `${fighter.id}.${field}`);
      assert.equal(translate(fighter[field], 'en'), fighter[field]);
    }
  }
});

test('dynamic battle and score messages translate their parameters', () => {
  const samples = new Map([
    ['ROUND 3', '第 3 回合'],
    ['NAILONG TAKES THE ROUND', '奶龙赢下本回合'],
    ['CPU / SPICY', '电脑 / 带劲'],
    ['CHARGING 32%', '蓄力中 32%'],
    ['P2: Capy Boss', '玩家二：卡皮老大'],
    ['Select Nailong, heavy hitter', '选择奶龙，定位：重装输出'],
    ['12 hits · 3× combo', '12 次命中 · 3 连击'],
    ['PLAYER 02 TAKES THE CROWN', '玩家2夺得冠军'],
    ['Nailong wins the match.', '奶龙赢得了比赛。'],
  ]);
  for (const [english, chinese] of samples) {
    assert.equal(translate(english, 'zh-CN'), chinese);
    assert.equal(translate(english, 'en'), english);
  }
  assert.equal(translate('  LET\'S BRAWL  ', 'zh-CN'), '  立即开打  ');
  assert.equal(translate('http://10.0.0.1:5180/', 'zh-CN'), 'http://10.0.0.1:5180/');
});

test('every catalog message has a usable Chinese translation', () => {
  for (const key of Object.keys(MESSAGES)) {
    const sample = key.replace(/\{\w+\}/g, '2');
    const translated = translate(sample, 'zh-CN');
    assert.notEqual(translated, sample, key);
    assert.doesNotMatch(translated, /\{\w+\}/, key);
  }
});

test('DOM language switching preserves SVG icons, input state, and click handlers', () => {
  const { document } = parseHTML('<html><body><main id="root"><button id="play" aria-label="Choose your fighter">LET\'S BRAWL <svg><path d="M0 0h2"/></svg></button><input value="http://10.0.0.1:5180/"><span>Nailong</span><kbd>W</kbd><button data-no-i18n>EN</button></main></body></html>');
  const root = document.querySelector('#root');
  const button = document.querySelector('#play');
  const svg = button.querySelector('svg');
  const input = root.querySelector('input');
  let clicked = 0;
  button.addEventListener('click', () => clicked++);
  for (let i = 0; i < 3; i++) {
    translateDOM(root, 'zh-CN');
    assert.equal(button.textContent.trim(), '立即开打');
    assert.equal(button.getAttribute('aria-label'), '选择出战角色');
    assert.equal(root.querySelector('span').textContent, '奶龙');
    translateDOM(root, 'en');
    assert.equal(button.textContent.trim(), "LET'S BRAWL");
    assert.equal(button.getAttribute('aria-label'), 'Choose your fighter');
    assert.equal(root.querySelector('span').textContent, 'Nailong');
  }
  assert.equal(button.querySelector('svg'), svg);
  assert.equal(input.value, 'http://10.0.0.1:5180/');
  assert.equal(root.querySelector('kbd').textContent, 'W');
  assert.equal(root.querySelector('[data-no-i18n]').textContent, 'EN');
  button.click();
  assert.equal(clicked, 1);
});

test('new fighter selections and dynamic accessibility labels survive language changes', () => {
  const { document } = parseHTML('<html><body><button id="fighter" aria-label="Turn sound on">Nailong</button></body></html>');
  const button = document.querySelector('#fighter');
  translateDOM(button, 'zh-CN');
  button.textContent = 'Pepe';
  button.setAttribute('aria-label', 'Turn sound off');
  translateDOM(button, 'zh-CN');
  assert.equal(button.textContent, '悲伤蛙');
  assert.equal(button.getAttribute('aria-label'), '关闭音效');
  translateDOM(button, 'en');
  assert.equal(button.textContent, 'Pepe');
  assert.equal(button.getAttribute('aria-label'), 'Turn sound off');
});

test('canvas HUD uses the active language without mutating the match', (t) => {
  t.after(() => setLocale('en', null));
  const labels = [];
  const ctx = new Proxy({}, { get: (_, key) => key === 'fillText' ? (value) => labels.push(value) : () => {} });
  const match = new Match();
  const view = { ctx, match, portrait: false, canvas: { width: 1200 }, images: [{}, {}], options: { mode: 'cpu', difficulty: 'spicy' } };
  const before = JSON.stringify(match);
  setLocale('zh-CN', null);
  GameView.prototype.drawHUD.call(view);
  assert.ok(labels.includes('奶龙'));
  assert.ok(labels.includes('电脑 / 带劲'));
  assert.ok(labels.includes('第 1 回合'));
  assert.ok(labels.includes('三局两胜'));
  labels.length = 0;
  setLocale('en', null);
  GameView.prototype.drawHUD.call(view);
  assert.ok(labels.includes('NAILONG'));
  assert.ok(labels.includes('ROUND 1'));
  assert.equal(JSON.stringify(match), before);
});

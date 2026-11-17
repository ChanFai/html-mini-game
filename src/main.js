import './style.css';
import { FIGHTERS, fighterSVG, icon } from './art.js';
import { GameView } from './game.js';
import { TouchController } from './touch.js';
import { getLocale, setLocale, translate, translateDOM } from './i18n.js';

const readSaved = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The game also works without storage. */ } };
let selected = 'nailong';
let skin = 'yellow';
let mode = 'cpu';
let sound = readSaved('melee-sound', false) === true;
let currentGame = null;
let launching = false;
let matchOptions = null;
let pageScroll = 0;

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="Meme Melee home">
      <span class="brand-symbol"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 29V11l9 11 6-11 6 11 6-11v18"/></svg></span>
      <span>meme<span class="brand-second">melee<span class="brand-dot">®</span></span></span>
    </a>
    <nav class="main-nav" aria-label="Main navigation">
      <a href="#fighters" class="nav-active">The playground<span></span></a>
      <button data-open="controls">How to play</button>
      <button data-open="scores">Hall of fame ${icon('arrowUp', 13)}</button>
    </nav>
    <div class="header-right"><div class="language-picker" role="group" aria-label="Language"><button data-locale="zh-CN" lang="zh-CN" aria-pressed="false">中文</button><button data-locale="en" lang="en" aria-pressed="true">EN</button></div><button class="phone-link" data-open="phone">${icon('gamepad', 18)} <span>Play on your phone</span></button><button class="icon-button sound-toggle" aria-label="Turn sound on" title="Toggle sound"></button></div>
  </header>

  <main class="page-main">
    <div class="page-eyebrow"><span><span class="tiny-star">✳</span> THE INTERNET'S MOST UNNECESSARY SHOWDOWN</span><span>NO DOWNLOAD. NO DIGNITY.</span></div>
    <div class="mobile-welcome">${icon('gamepad', 17)} POCKET-SIZED CHAOS <span>TOUCH TO PLAY</span></div>
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-grid"></div>
      <div class="hero-copy">
        <span class="edition-tag"><span class="tag-dot"></span> THE BRAINROT BRAWLER <span>VOL. 01</span></span>
        <h1 id="hero-title">TINY ARMS.<br>MASSIVE BEEF<span class="title-period">.</span></h1>
        <p>Your favorite internet weirdos. One very unserious arena.<br>Pick a fighter. Throw hands. Become the meme.</p>
        <div class="hero-actions"><button class="button button-dark start-game">LET'S BRAWL ${icon('arrowUp', 21)}</button><a class="meet-link" href="#fighters">Meet the fighters ${icon('down', 16)}</a></div>
        <div class="hero-footnote"><span class="mini-keys"><span>A</span><span>D</span><span>J</span></span> EASY TO PLAY. IMPOSSIBLE TO EXPLAIN.</div>
      </div>
      <div class="hero-art" aria-label="Nailong and Pepe getting ready to brawl" role="img">
        <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
        <span class="hero-vs">VS</span>
        <svg class="burst-spark spark-one" viewBox="0 0 60 60" aria-hidden="true"><path d="m30 0 5 20 20-12-12 20 17 3-19 7 11 18-20-13-6 17-5-22L2 46l13-18L0 22l21-2Z" fill="currentColor"/></svg>
        <svg class="burst-spark spark-two" viewBox="0 0 60 60" aria-hidden="true"><path d="m30 0 5 20 20-12-12 20 17 3-19 7 11 18-20-13-6 17-5-22L2 46l13-18L0 22l21-2Z" fill="currentColor"/></svg>
        <div class="hero-character hero-dragon">${fighterSVG('nailong')}</div>
        <div class="hero-character hero-frog">${fighterSVG('pepe')}</div>
        <div class="speech-sticker">head empty.<br><strong>hands ready.</strong><span>↙</span></div>
        <div class="name-sticker dragon-sticker">奶龙 <span>NAILONG</span></div>
        <div class="name-sticker frog-sticker">FEELS BAD, MAN.</div>
        <div class="chaos-seal"><span>100% ORGANIC</span><b>✳</b><span>PURE CHAOS</span></div>
        <span class="art-caption">FIG. 01 — TWO ABSOLUTE UNITS</span>
      </div>
      <div class="hero-corner">★ INTERNET CERTIFIED</div>
    </section>

    <section class="roster-section" id="fighters" aria-labelledby="roster-title">
      <div class="section-heading"><div><div class="section-kicker"><span class="section-number">01 /</span> THE USUAL SUSPECTS</div><h2 id="roster-title">Choose your chaos<span>.</span></h2></div><div class="roster-tools"><span>5 FIGHTERS. ONE SHARED BRAIN CELL.</span><button id="random-fighter" class="random-button" title="Pick a random fighter">${icon('shuffle', 17)} Surprise me</button></div></div>
      <div class="fighter-grid" role="group" aria-label="Choose your fighter">
        ${FIGHTERS.map((fighter, index) => `
          <button class="fighter-card ${index === 0 ? 'selected' : ''}" data-fighter="${fighter.id}" aria-pressed="${index === 0}" aria-label="Select ${fighter.name}, ${fighter.role.toLowerCase()}" style="--fighter-bg:${fighter.background};--fighter-color:${fighter.color};--fighter-ink:${fighter.ink}">
            <div class="fighter-art"><span class="fighter-number">0${index + 1}</span><span class="fighter-role">${fighter.role}</span><div class="portrait-ring"></div><div class="fighter-portrait">${fighterSVG(fighter.id)}</div><span class="selection-badge">${icon('check', 12)} PLAYER 01</span><span class="fighter-quote">${fighter.tagline}</span></div>
            <div class="fighter-info"><div class="fighter-title"><h3>${fighter.name}</h3><span class="card-arrow">${icon('arrowUp', 17)}</span></div><p>${fighter.nickname}</p><div class="fighter-stats"><span>POWER <span class="stat-pips">${pips(fighter.power)}</span></span><span>SPEED <span class="stat-pips">${pips(fighter.speed)}</span></span></div></div>
          </button>`).join('')}
      </div>
      <div class="loadout-bar">
        <div class="selected-loadout"><div class="loadout-portrait" id="loadout-portrait">${fighterSVG('nailong')}</div><div><div class="loadout-label">LOCKED & A LITTLE CONFUSED</div><div class="loadout-name"><strong id="selected-name">Nailong</strong><span class="skin-picker" id="skin-picker" role="group" aria-label="Nailong color"><button data-skin="yellow" class="skin-dot chosen" style="--skin:#f5cb46" aria-label="Yellow Nailong" aria-pressed="true"></button><button data-skin="blue" class="skin-dot" style="--skin:#73bee5" aria-label="Blue Nailong" aria-pressed="false"></button><button data-skin="red" class="skin-dot" style="--skin:#e96e65" aria-label="Red Nailong" aria-pressed="false"></button></span></div><span class="selected-special">${icon('bolt', 12)} <span id="selected-special">Belly Bounce</span></span></div></div>
        <div class="match-settings"><div class="mode-toggle" role="group" aria-label="Game mode"><button data-mode="cpu" class="active" aria-pressed="true">vs. CPU</button><button data-mode="local" aria-pressed="false">Local 1v1</button></div><label class="select-wrap" id="difficulty-wrap"><span class="sr-only">CPU difficulty</span><select id="difficulty"><option value="chill">Chill</option><option value="spicy" selected>Spicy</option><option value="unhinged">Unhinged</option></select>${icon('down', 13)}</label><label class="select-wrap" id="opponent-wrap" hidden><span class="sr-only">Player 2 fighter</span><select id="opponent">${FIGHTERS.map((f) => `<option value="${f.id}" ${f.id === 'pepe' ? 'selected' : ''}>P2: ${f.name}</option>`).join('')}</select>${icon('down', 13)}</label></div>
        <button class="button button-orange start-game">ENTER THE ARENA ${icon('arrowUp', 20)}</button>
      </div>
    </section>

    <section class="how-strip" aria-label="Quick guide"><div class="how-strip-intro"><span class="asterisk">✳</span><span>LESS THINKING.<br><strong>MORE BONKING.</strong></span></div><div class="quick-control"><span class="key-group"><kbd>A</kbd><kbd>D</kbd></span><span>Move around</span></div><div class="quick-control"><span class="key-group"><kbd>W</kbd></span><span>Catch some air</span></div><div class="quick-control"><span class="key-group"><kbd>J</kbd><kbd>K</kbd></span><span>Throw hands</span></div><div class="quick-control"><span class="key-group"><kbd>L</kbd></span><span>Get unhinged</span></div><button class="text-button" data-open="controls">All controls ${icon('arrowUp', 16)}</button></section>
  </main>
  <div class="mobile-play-dock"><span class="dock-icon">${icon('gamepad', 23)}</span><div><small>YOUR FIGHTER</small><strong id="dock-fighter">Nailong</strong></div><button class="button button-orange start-game">PLAY NOW ${icon('play', 17)}</button></div>
  <footer class="site-footer"><span class="footer-brand">meme melee<span>®</span></span><span>A little chaos is good for you. <span class="footer-muted">Fan-made. Not affiliated. Just for fun.</span></span><span>${icon('globe', 14)} BROWSER-BASED BRAINROT</span></footer>

  <dialog id="info-dialog" class="info-dialog" aria-labelledby="dialog-title"><button class="language-toggle dialog-language" data-toggle-locale data-no-i18n aria-label="Switch language">中文</button><button class="icon-button dialog-close" aria-label="Close dialog">${icon('close')}</button><div id="dialog-content"></div></dialog>
  <dialog id="game-dialog" class="game-dialog" aria-label="Meme Melee fighting arena">
    <div class="game-topbar"><span class="game-wordmark">meme melee<span> / THE ARENA</span></span><span class="arena-location"><i></i> CAMPUS COURTYARD</span><div><button class="language-toggle" data-toggle-locale data-no-i18n aria-label="Switch language">中文</button><button class="icon-button" id="toggle-gamepad" aria-label="Show touch gamepad" aria-pressed="false" title="Show touch gamepad">${icon('gamepad', 18)}</button><button class="icon-button game-sound" aria-label="Toggle sound"></button><button class="icon-button" id="fullscreen-game" aria-label="Full screen" title="Full screen">${icon('expand', 17)}</button><button class="icon-button" id="pause-game" aria-label="Pause game" title="Pause (P)">${icon('pause', 17)}</button><button class="icon-button" id="close-game" aria-label="Leave arena" title="Leave arena">${icon('close')}</button></div></div>
    <div class="rotate-hint">${icon('rotate', 16)} Turn your phone sideways for the big-screen brawl.</div>
    <div class="game-stage"><canvas id="game-canvas" width="1200" height="640" aria-label="Fighting arena. Use the on-screen gamepad or A/D to move, W to jump, S to block, J/K to attack, and L for your special."></canvas><div id="game-announcement" class="sr-only" role="status" aria-live="polite"></div></div>
    <div id="game-overlay" class="game-overlay" hidden></div>
    <div class="game-bottom-bar"><span><kbd>A</kbd><kbd>D</kbd> MOVE <kbd>W</kbd> JUMP <kbd>S</kbd> BLOCK</span><span><kbd>J</kbd> PUNCH <kbd>K</kbd> KICK <kbd>L</kbd> SPECIAL</span><span id="p2-controls"><kbd>P</kbd> PAUSE · FIRST TO 2 WINS</span></div>
    <div class="touch-controls" role="group" aria-label="Virtual gamepad">
      <div class="gamepad-topline"><span>${icon('gamepad', 15)} TWO THUMBS. ZERO THOUGHTS.</span><span class="gamepad-connected"><i></i> GAMEPAD READY</span></div>
      <div class="gamepad-left"><button class="block-trigger" data-touch="block" aria-label="Hold to block">${icon('shield', 16)} <span>HOLD TO BLOCK</span></button><div class="joystick-base" role="group" aria-label="Drag the thumbstick left or right to move"><span class="stick-arrow stick-left">‹</span><span class="stick-arrow stick-right">›</span><span class="joystick-knob"><span></span></span></div><span class="stick-caption">MOVE</span></div>
      <div class="gamepad-center"><span class="gamepad-emblem">m<span>m</span></span><span id="special-status">SPECIAL READY</span><div class="gamepad-energy"><i id="touch-energy"></i></div><span class="gamepad-player">PLAYER 01</span></div>
      <div class="gamepad-right"><button class="pad-button pad-jump" data-touch="jump" aria-label="Jump"><b>Y</b><span>JUMP</span></button><button class="pad-button pad-punch" data-touch="punch" aria-label="Punch"><b>X</b><span>PUNCH</span></button><button class="pad-button pad-kick" data-touch="kick" aria-label="Kick"><b>A</b><span>KICK</span></button><button class="pad-button pad-special" data-touch="special" aria-label="Special move"><b>${icon('bolt', 22)}</b><span>SPECIAL</span></button></div>
    </div>
  </dialog>
  <div id="toast" class="toast" role="status"></div>
`;

function refreshLanguage() {
  const language = getLocale();
  document.documentElement.lang = language;
  document.title = translate('Meme Melee — Tiny Arms. Massive Beef.');
  translateDOM(app);
  document.querySelectorAll('[data-locale]').forEach((button) => {
    const active = button.dataset.locale === language;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  document.querySelectorAll('[data-toggle-locale]').forEach((button) => {
    button.textContent = language === 'en' ? '中文' : 'EN';
    button.setAttribute('lang', language === 'en' ? 'zh-CN' : 'en');
    button.setAttribute('aria-label', translate('Switch language'));
  });
  currentGame?.refreshLocale();
}

function pips(value) { return Array.from({ length: 5 }, (_, i) => `<i class="${i < value ? 'filled' : ''}"></i>`).join(''); }
function updateSound() {
  document.querySelectorAll('.sound-toggle, .game-sound').forEach((button) => {
    button.innerHTML = icon(sound ? 'sound' : 'mute', 18);
    button.setAttribute('aria-label', `Turn sound ${sound ? 'off' : 'on'}`);
    button.setAttribute('aria-pressed', String(sound));
    translateDOM(button);
  });
  currentGame?.setSound(sound);
  save('melee-sound', sound);
}
function chooseFighter(id) {
  selected = id;
  const fighter = FIGHTERS.find((f) => f.id === id);
  document.querySelectorAll('.fighter-card').forEach((card) => {
    card.classList.toggle('selected', card.dataset.fighter === id);
    card.setAttribute('aria-pressed', String(card.dataset.fighter === id));
  });
  document.querySelector('#selected-name').textContent = fighter.name;
  document.querySelector('#dock-fighter').textContent = fighter.name;
  document.querySelector('#selected-special').textContent = fighter.special;
  document.querySelector('#loadout-portrait').innerHTML = fighterSVG(id, skin);
  document.querySelector('#loadout-portrait').style.background = fighter.background;
  document.querySelector('#skin-picker').hidden = id !== 'nailong';
  translateDOM(document.querySelector('.selected-loadout'));
  translateDOM(document.querySelector('.mobile-play-dock'));
}
function chooseSkin(value) {
  skin = value;
  document.querySelectorAll('[data-skin]').forEach((button) => {
    button.classList.toggle('chosen', button.dataset.skin === value);
    button.setAttribute('aria-pressed', String(button.dataset.skin === value));
  });
  document.querySelector('[data-fighter="nailong"] .fighter-portrait').innerHTML = fighterSVG('nailong', skin);
  document.querySelector('.hero-dragon').innerHTML = fighterSVG('nailong', skin);
  chooseFighter(selected);
}

const controlsContent = () => `<div class="modal-kicker">A CRASH COURSE IN CHAOS</div><h2 id="dialog-title">Small learning curve.<br>Big bonk energy.</h2><p class="modal-description">Win two rounds to take the match. Knock out your opponent, or have the higher health percentage when the 60-second timer runs out.</p><div class="controls-table"><div class="controls-table-head"><span>THE MOVE</span><span>PLAYER 01</span><span>PLAYER 02</span></div>${[['Move', 'A / D', '← / →'], ['Jump', 'W', '↑'], ['Block', 'S', '↓'], ['Punch', 'J', ','], ['Kick', 'K', '.'], ['Special move', 'L', '/']].map(([action, p1, p2]) => `<div><span>${action}</span><span><kbd>${p1}</kbd></span><span><kbd>${p2}</kbd></span></div>`).join('')}</div><div class="controls-tip">${icon('bolt', 22)}<p><strong>Save some chaos for later.</strong> Specials use 70 energy. Your meter recharges over time and with every hit. Block to reduce incoming damage. Press <kbd>P</kbd> to pause.</p></div><div class="phone-controls-tip">${icon('gamepad', 26)}<p><strong>Two thumbs are all you need.</strong> Drag the left stick to move. Use the right buttons to jump, punch, kick, and unleash your special. Hold the shield trigger to block. You can move and attack at the same time.</p></div><p class="modal-note">Phone play is vs. CPU. Local 1v1 needs a shared keyboard. Portrait and landscape both work; rotate sideways for a wider view.</p><button class="button button-dark modal-done">GOT IT. LET ME COOK. ${icon('arrowUp', 18)}</button>`;

function scoresContent() {
  const saved = readSaved('melee-results', []);
  const results = Array.isArray(saved) ? saved.filter((r) => r && typeof r === 'object' && FIGHTERS.some((f) => f.id === r.fighter) && Number.isFinite(r.hits) && Number.isFinite(r.combo)).slice(0, 8) : [];
  const wins = results.filter((r) => r.won).length;
  return `<div class="modal-kicker">LOCALLY LEGENDARY</div><h2 id="dialog-title">The hall of questionable fame.</h2><p class="modal-description">Your last eight CPU matches, saved in this browser. No accounts, no global rankings, just personal beef.</p>${results.length ? `<div class="score-summary"><div><strong>${results.length}</strong><span>MATCHES</span></div><div><strong>${wins}</strong><span>VICTORIES</span></div><div><strong>${Math.max(...results.map((r) => r.combo))}×</strong><span>BEST COMBO</span></div></div><div class="score-list">${results.map((r) => `<div><span class="score-mini">${fighterSVG(r.fighter)}</span><span><strong>${FIGHTERS.find((f) => f.id === r.fighter).name}</strong><small>${r.hits} hits · ${r.combo}× combo</small></span><b class="${r.won ? 'score-win' : 'score-loss'}">${r.won ? 'VICTORY' : 'HUMBLED'}</b></div>`).join('')}</div>` : `<div class="empty-scores">${icon('trophy', 48)}<h3>Every legend starts at zero.</h3><p>Your first fight is waiting. Make it weird.</p></div>`}<button class="button button-dark modal-done">BACK TO THE PLAYGROUND ${icon('arrow', 18)}</button>`;
}
const infoDialog = document.querySelector('#info-dialog');
function phoneContent() {
  return `<div class="modal-kicker">TAKE THE CHAOS WITH YOU</div><h2 id="dialog-title">Your phone.<br>Your pocket arcade.</h2><p class="modal-description">Scan this code with your phone's camera, pick a fighter, and play with the built-in gamepad.</p><div class="phone-qr"><img id="phone-qr-image" alt="QR code to open Meme Melee on your phone" hidden><span id="qr-loading">Building your portal to chaos…</span></div><label class="phone-url-label" for="phone-url">OR OPEN THIS ADDRESS</label><div class="phone-url-row"><input id="phone-url" readonly aria-label="Phone access address"><button id="copy-phone-url">Copy</button></div><p id="phone-network-note" class="modal-note"></p><p id="phone-copy-status" class="modal-note" role="status"></p><button class="button button-dark modal-done">READY, PLAYER TWO THUMBS ${icon('gamepad', 19)}</button>`;
}
async function preparePhoneLink() {
  const host = location.hostname;
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(host);
  const origin = loopback && typeof __PHONE_ORIGIN__ !== 'undefined' && __PHONE_ORIGIN__ ? __PHONE_ORIGIN__ : location.origin;
  const local = loopback || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  const input = document.querySelector('#phone-url');
  const copyStatus = document.querySelector('#phone-copy-status');
  input.value = `${origin}/`;
  document.querySelector('#phone-network-note').textContent = local ? 'Connect both devices to the same Wi-Fi and keep this computer and the game server running. This is a local link, not a public website.' : 'Open this link on your phone. No app, account, or download needed.';
  translateDOM(document.querySelector('#phone-network-note'));
  document.querySelector('#copy-phone-url').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      copyStatus.textContent = 'Copied. Send it to your phone.';
    } catch {
      input.focus(); input.select(); input.setSelectionRange(0, input.value.length);
      copyStatus.textContent = 'Select and copy the address above, or scan the QR code.';
    }
    translateDOM(copyStatus);
  });
  const image = document.querySelector('#phone-qr-image');
  const loading = document.querySelector('#qr-loading');
  try {
    const { default: QRCode } = await import('qrcode');
    image.src = await QRCode.toDataURL(input.value, { width: 420, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#282720', light: '#fffdf5' } });
    image.hidden = false; loading.hidden = true;
  } catch { loading.textContent = 'Use the address below to open the game.'; translateDOM(loading); }
}
function openInfo(which) {
  document.querySelector('#dialog-content').innerHTML = which === 'phone' ? phoneContent() : which === 'scores' ? scoresContent() : controlsContent();
  translateDOM(infoDialog);
  infoDialog.showModal();
  document.querySelector('.modal-done').addEventListener('click', () => infoDialog.close());
  if (which === 'phone') preparePhoneLink();
}

const gameDialog = document.querySelector('#game-dialog');
const overlay = document.querySelector('#game-overlay');
const touchController = new TouchController(document.querySelector('.touch-controls'), () => currentGame);
let ownsFullscreen = false;
function showPause() {
  if (!currentGame || currentGame.match.phase === 'ended') return;
  currentGame.pause();
  overlay.hidden = false;
  overlay.innerHTML = `<div class="overlay-card"><span class="modal-kicker">A MOMENT OF SANITY</span><h2>Chaos on hold.</h2><p>Take a breath. Stretch those tiny arms.</p><button class="button button-orange" id="resume-game">BACK TO THE BEEF ${icon('play', 18)}</button><button class="text-button" id="quit-paused">Leave the arena ${icon('arrowUp', 16)}</button></div>`;
  document.querySelector('#resume-game').addEventListener('click', resumeGame);
  document.querySelector('#quit-paused').addEventListener('click', closeGame);
  document.querySelector('#pause-game').setAttribute('aria-label', 'Resume game');
  translateDOM(gameDialog);
  document.querySelector('#resume-game').focus();
}
function resumeGame() {
  if (!currentGame || currentGame.match.phase === 'ended') return;
  overlay.hidden = true;
  currentGame.resume();
  document.querySelector('#pause-game').setAttribute('aria-label', 'Pause game');
  translateDOM(document.querySelector('#pause-game'));
  document.querySelector('#game-canvas').focus();
}
function togglePause() {
  if (!currentGame || currentGame.match.phase === 'ended') return;
  currentGame.paused ? resumeGame() : showPause();
}
function closeGame() {
  currentGame?.destroy();
  currentGame = null;
  overlay.hidden = true;
  gameDialog.close();
  document.body.classList.remove('playing');
  window.scrollTo({ top: pageScroll, behavior: 'instant' });
  if (ownsFullscreen) {
    ownsFullscreen = false;
    screen.orientation?.unlock?.();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
}
function onMatchEnd(match) {
  touchController.reset();
  const winner = match.players[match.winner];
  const won = match.winner === 0;
  if (mode === 'cpu') {
    const stored = readSaved('melee-results', []);
    const history = Array.isArray(stored) ? stored : [];
    save('melee-results', [{ fighter: selected, won, hits: match.totalHits, combo: match.bestCombo, date: Date.now() }, ...history].slice(0, 8));
  }
  document.querySelector('#game-announcement').textContent = `${winner.name} wins the match.`;
  overlay.hidden = false;
  overlay.innerHTML = `<div class="overlay-card result-card"><div class="result-portrait">${fighterSVG(winner.id, winner.index === 0 ? skin : 'yellow')}</div><span class="modal-kicker">${mode === 'local' ? `PLAYER 0${match.winner + 1} TAKES THE CROWN` : won ? 'ABSOLUTELY UNNECESSARY. BEAUTIFULLY DONE.' : 'IT BUILDS CHARACTER. PROBABLY.'}</span><h2>${mode === 'local' ? `${winner.name} wins!` : won ? 'Certified menace.' : 'You got humbled.'}</h2><p>${match.wins[0]} — ${match.wins[1]} <span>•</span> ${match.totalHits} hits <span>•</span> ${match.bestCombo}× best combo</p><button class="button button-orange" id="rematch">RUN IT BACK ${icon('arrowUp', 18)}</button><button class="text-button" id="change-fighter">Choose another fighter ${icon('arrow', 16)}</button></div>`;
  translateDOM(gameDialog);
  document.querySelector('#rematch').addEventListener('click', () => launchGame(true));
  document.querySelector('#change-fighter').addEventListener('click', closeGame);
  document.querySelector('#rematch').focus();
}
async function launchGame(rematch = false) {
  if (launching) return;
  launching = true;
  if (!gameDialog.open) pageScroll = window.scrollY;
  document.querySelectorAll('.start-game').forEach((b) => { b.disabled = true; });
  try {
    currentGame?.destroy();
    currentGame = null;
    if (!rematch || !matchOptions) {
      const others = FIGHTERS.filter((f) => f.id !== selected);
      matchOptions = {
        player: selected, opponent: mode === 'cpu' ? others[Math.floor(Math.random() * others.length)].id : document.querySelector('#opponent').value,
        mode, difficulty: document.querySelector('#difficulty').value, skin,
      };
    }
    overlay.hidden = true;
    document.querySelector('#pause-game').setAttribute('aria-label', 'Pause game');
    const view = new GameView(document.querySelector('#game-canvas'), { ...matchOptions, sound, onPause: showPause, onTogglePause: togglePause, onEnd: onMatchEnd, onInputReset: () => touchController.reset() });
    await view.load();
    currentGame = view;
    if (!gameDialog.open) gameDialog.showModal();
    document.body.classList.add('playing');
    document.querySelector('#p2-controls').textContent = mode === 'local' ? 'P2: ARROWS + , . /  ·  P PAUSE' : 'P PAUSE · FIRST TO 2 WINS';
    view.start();
    document.querySelector('#game-announcement').textContent = `Round one. ${matchOptions.player} versus ${matchOptions.opponent}.`;
    translateDOM(gameDialog);
  } catch (error) {
    console.error('Could not start the arena:', error);
    closeGame();
    toast('The arena could not load. Please try again.');
  } finally {
    launching = false;
    document.querySelectorAll('.start-game').forEach((b) => { b.disabled = false; });
  }
}
let toastTimeout;
function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  translateDOM(node);
  node.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => node.classList.remove('visible'), 3000);
}

document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => {
  setLocale(button.dataset.locale);
  refreshLanguage();
}));
document.querySelectorAll('[data-toggle-locale]').forEach((button) => button.addEventListener('click', () => {
  setLocale(getLocale() === 'en' ? 'zh-CN' : 'en');
  refreshLanguage();
}));
document.querySelectorAll('[data-fighter]').forEach((button) => button.addEventListener('click', () => chooseFighter(button.dataset.fighter)));
document.querySelectorAll('[data-skin]').forEach((button) => button.addEventListener('click', () => chooseSkin(button.dataset.skin)));
document.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => openInfo(button.dataset.open)));
document.querySelectorAll('.sound-toggle, .game-sound').forEach((button) => button.addEventListener('click', () => { sound = !sound; updateSound(); }));
document.querySelectorAll('.start-game').forEach((button) => button.addEventListener('click', () => launchGame()));
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach((b) => { b.classList.toggle('active', b.dataset.mode === mode); b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
  document.querySelector('#difficulty-wrap').hidden = mode === 'local';
  document.querySelector('#opponent-wrap').hidden = mode === 'cpu';
  if (mode === 'local' && matchMedia('(pointer: coarse)').matches) toast('Local 1v1 needs a shared keyboard. Touch controls operate Player 1.');
}));
document.querySelector('#random-fighter').addEventListener('click', () => {
  const pool = FIGHTERS.filter((f) => f.id !== selected);
  chooseFighter(pool[Math.floor(Math.random() * pool.length)].id);
});
document.querySelector('.dialog-close').addEventListener('click', () => infoDialog.close());
infoDialog.addEventListener('click', (event) => { if (event.target === infoDialog) infoDialog.close(); });
document.querySelector('#pause-game').addEventListener('click', togglePause);
document.querySelector('#close-game').addEventListener('click', () => currentGame?.match.phase === 'ended' ? closeGame() : showPause());
gameDialog.addEventListener('cancel', (event) => { event.preventDefault(); currentGame?.match.phase === 'ended' ? closeGame() : togglePause(); });
document.querySelector('#toggle-gamepad').addEventListener('click', (event) => {
  const visible = gameDialog.classList.toggle('manual-gamepad');
  event.currentTarget.setAttribute('aria-pressed', String(visible));
  event.currentTarget.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} touch gamepad`);
  translateDOM(event.currentTarget);
  touchController.reset();
});
const fullscreenButton = document.querySelector('#fullscreen-game');
fullscreenButton.hidden = !document.documentElement.requestFullscreen;
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); ownsFullscreen = false; screen.orientation?.unlock?.(); }
    else {
      await document.documentElement.requestFullscreen();
      ownsFullscreen = true;
      if (matchMedia('(any-pointer: coarse)').matches) {
        try { await screen.orientation?.lock?.('landscape'); } catch { /* Rotation remains under the user's control when locking is unsupported. */ }
      }
    }
  } catch {
    document.querySelector('#game-announcement').textContent = 'Full screen is unavailable. You can still rotate your phone and play.';
    translateDOM(document.querySelector('#game-announcement'));
  }
});
updateSound();
refreshLanguage();

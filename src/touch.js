export function stickPosition(dx, dy, radius = 42) {
  const limit = Math.max(1, radius);
  const distance = Math.hypot(dx, dy);
  const ratio = distance > limit ? limit / distance : 1;
  const x = dx * ratio;
  const y = dy * ratio;
  return { x, y, actions: { left: x / limit < -0.24, right: x / limit > 0.24 } };
}

// Track fingers independently so releasing an attack never releases movement.
export class TouchState {
  constructor() { this.sources = new Map(); }
  set(source, actions) { this.sources.set(source, actions); }
  release(source) { this.sources.delete(source); }
  clear() { this.sources.clear(); }
  snapshot() {
    const result = {};
    for (const actions of this.sources.values()) {
      for (const [action, active] of Object.entries(actions)) if (active) result[action] = true;
    }
    return result;
  }
}

export class TouchController {
  constructor(root, getGame) {
    this.root = root;
    this.getGame = getGame;
    this.state = new TouchState();
    this.stick = root.querySelector('.joystick-base');
    this.knob = root.querySelector('.joystick-knob');
    this.pointer = null;
    this.buttons = [...root.querySelectorAll('[data-touch]')];
    this.timers = new Set();
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    root.addEventListener('contextmenu', (event) => event.preventDefault(), options);
    this.stick.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (!this.available() || this.pointer !== null) return;
      this.pointer = event.pointerId;
      this.stick.setPointerCapture(event.pointerId);
      this.stick.classList.add('active');
      this.getGame().audio.unlock();
      this.moveStick(event);
    }, options);
    this.stick.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.pointer) return;
      event.preventDefault();
      this.moveStick(event);
    }, options);
    const releaseStick = (event) => {
      if (event.pointerId !== this.pointer) return;
      this.state.release(`stick-${this.pointer}`);
      this.pointer = null;
      this.knob.style.transform = '';
      this.stick.classList.remove('active');
      this.publish();
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) this.stick.addEventListener(type, releaseStick, options);
    for (const button of this.buttons) {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (!this.available()) return;
        button.setPointerCapture(event.pointerId);
        this.state.set(`button-${event.pointerId}`, { [button.dataset.touch]: true });
        button.classList.add('pressed');
        this.getGame().audio.unlock();
        this.publish();
      }, options);
      const release = (event) => {
        this.state.release(`button-${event.pointerId}`);
        const stillHeld = this.state.snapshot()[button.dataset.touch];
        button.classList.toggle('pressed', !!stillHeld);
        this.publish();
      };
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release, options);
      button.addEventListener('click', (event) => {
        if (event.detail !== 0 || !this.available()) return;
        const source = `accessible-${button.dataset.touch}`;
        this.state.set(source, { [button.dataset.touch]: true });
        this.publish();
        const timer = setTimeout(() => { this.state.release(source); this.publish(); this.timers.delete(timer); }, 150);
        this.timers.add(timer);
      }, options);
    }
    window.addEventListener('resize', () => this.reset(), options);
  }
  available() {
    const game = this.getGame();
    return game && !game.paused && !game.destroyed && game.match.phase !== 'ended';
  }
  moveStick(event) {
    if (!this.available()) { this.reset(); return; }
    const rect = this.stick.getBoundingClientRect();
    const position = stickPosition(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2, rect.width * .3);
    this.knob.style.transform = `translate(${position.x}px, ${position.y}px)`;
    this.state.set(`stick-${this.pointer}`, position.actions);
    this.publish();
  }
  publish() {
    const game = this.getGame();
    if (game) game.touch = this.available() ? this.state.snapshot() : {};
  }
  reset() {
    this.state.clear();
    this.pointer = null;
    this.knob.style.transform = '';
    this.stick.classList.remove('active');
    for (const button of this.buttons) button.classList.remove('pressed');
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.publish();
  }
  destroy() { this.reset(); this.abort.abort(); }
}

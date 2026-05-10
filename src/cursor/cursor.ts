import { Emitter } from '../events/events';

/**
 * Global cursor tracker — tracks last known position, velocity, and idle state.
 * One instance per page; emits 'move', 'idle', 'active' events.
 */
export class Cursor {
  private _ev = new Emitter();
  private _x = 0;
  private _y = 0;
  private _vx = 0;
  private _vy = 0;
  private _lastX = 0;
  private _lastY = 0;
  private _lastT = 0;
  private _idle = false;
  private _idleTimer = 0;
  private _idleDuration = 2000;
  private _started = false;

  private _onMove: (e: Event) => void;

  constructor() {
    this._onMove = (e) => this._handle(e as PointerEvent);
  }

  start(): void {
    if (this._started) return;
    this._started = true;
    window.addEventListener('pointermove', this._onMove, { passive: true });
  }

  stop(): void {
    window.removeEventListener('pointermove', this._onMove);
    this._started = false;
  }

  get x(): number  { return this._x; }
  get y(): number  { return this._y; }
  get vx(): number { return this._vx; }
  get vy(): number { return this._vy; }
  get speed(): number { return Math.hypot(this._vx, this._vy); }
  get idle(): boolean { return this._idle; }

  on(event: 'move' | 'idle' | 'active', fn: (...args: any[]) => void): () => void {
    return this._ev.on(event, fn);
  }

  /** Set idle threshold in ms. Default 2000. */
  setIdleTimeout(ms: number): void {
    this._idleDuration = ms;
    this._resetIdle();
  }

  private _handle(e: PointerEvent): void {
    const now = performance.now();
    const dt = (now - this._lastT) / 1000;
    this._x = e.clientX;
    this._y = e.clientY;
    if (dt > 0 && dt < 0.2) {
      this._vx = (this._x - this._lastX) / dt;
      this._vy = (this._y - this._lastY) / dt;
    } else {
      this._vx = 0;
      this._vy = 0;
    }
    this._lastX = this._x; this._lastY = this._y; this._lastT = now;
    this._ev.emit('move', { x: this._x, y: this._y, vx: this._vx, vy: this._vy, speed: this.speed });

    if (this._idle) {
      this._idle = false;
      this._ev.emit('active');
    }
    this._resetIdle();
  }

  private _resetIdle(): void {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = window.setTimeout(() => {
      this._idle = true;
      this._ev.emit('idle');
    }, this._idleDuration);
  }
}

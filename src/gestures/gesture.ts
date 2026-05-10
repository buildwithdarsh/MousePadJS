import { Emitter } from '../events/events';
import { direction as dirOf, distance } from '../utils/vector';

export interface GestureOptions {
  tapMaxDistance?: number;
  tapMaxDuration?: number;
  doubleTapMaxGap?: number;
  longPressDuration?: number;
  swipeMinVelocity?: number;
  swipeMinDistance?: number;
}

export type GestureEventName =
  | 'tap'
  | 'doubletap'
  | 'longpress'
  | 'panstart'
  | 'pan'
  | 'panend'
  | 'swipe'
  | 'pinchstart'
  | 'pinch'
  | 'pinchend'
  | 'rotatestart'
  | 'rotate'
  | 'rotateend';

export interface TapEvent   { x: number; y: number; pointerType: string }
export interface DoubleTapEvent extends TapEvent {}
export interface LongPressEvent extends TapEvent { duration: number }
export interface PanEvent {
  x: number; y: number;
  dx: number; dy: number;       // delta since last event
  tx: number; ty: number;       // total delta since panstart
  vx: number; vy: number;       // velocity px/sec
  speed: number;
  pointerType: string;
}
export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
  pointerType: string;
}
export interface PinchEvent {
  scale: number;        // relative to gesture start
  delta: number;        // relative to last event
  center: { x: number; y: number };
}
export interface RotateEvent {
  angle: number;        // total radians since rotatestart
  delta: number;        // radians since last event
  center: { x: number; y: number };
}

const DEFAULTS: Required<GestureOptions> = {
  tapMaxDistance: 10,
  tapMaxDuration: 250,
  doubleTapMaxGap: 300,
  longPressDuration: 500,
  swipeMinVelocity: 300,
  swipeMinDistance: 30,
};

interface Tracker {
  id: number;
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  pointerType: string;
}

/**
 * Unified gesture recognizer for an element. Backed by Pointer Events —
 * one API across mouse, trackpad, touch, and pen.
 */
export class Gesture {
  private _ev = new Emitter();
  private _pointers = new Map<number, Tracker>();
  private _opts: Required<GestureOptions>;

  private _longPressTimer = 0;
  private _lastTapAt = 0;
  private _lastTapX = 0;
  private _lastTapY = 0;

  private _panActive = false;
  private _pinchStart = 0;
  private _rotateStart = 0;
  private _pinchActive = false;
  private _rotateActive = false;

  private _onDown: (e: Event) => void;
  private _onMove: (e: Event) => void;
  private _onUp: (e: Event) => void;

  constructor(private _el: Element, opts?: GestureOptions) {
    this._opts = { ...DEFAULTS, ...opts };
    this._onDown = (e) => this._handleDown(e as PointerEvent);
    this._onMove = (e) => this._handleMove(e as PointerEvent);
    this._onUp   = (e) => this._handleUp(e as PointerEvent);
    _el.addEventListener('pointerdown', this._onDown);
    _el.addEventListener('pointermove', this._onMove);
    _el.addEventListener('pointerup', this._onUp);
    _el.addEventListener('pointercancel', this._onUp);
  }

  on(event: GestureEventName, fn: (e: any) => void): () => void {
    return this._ev.on(event, fn);
  }

  destroy(): void {
    this._el.removeEventListener('pointerdown', this._onDown);
    this._el.removeEventListener('pointermove', this._onMove);
    this._el.removeEventListener('pointerup', this._onUp);
    this._el.removeEventListener('pointercancel', this._onUp);
    if (this._longPressTimer) clearTimeout(this._longPressTimer);
    this._pointers.clear();
  }

  private _handleDown(e: PointerEvent): void {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const t: Tracker = {
      id: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      startTime: performance.now(),
      lastX: e.clientX, lastY: e.clientY,
      lastTime: performance.now(),
      pointerType: e.pointerType,
    };
    this._pointers.set(e.pointerId, t);

    // Long press fires if the pointer stays still for longPressDuration
    if (this._pointers.size === 1) {
      this._longPressTimer = window.setTimeout(() => {
        const tr = this._pointers.get(e.pointerId);
        if (!tr) return;
        const d = distance({ x: tr.startX, y: tr.startY }, { x: tr.lastX, y: tr.lastY });
        if (d <= this._opts.tapMaxDistance) {
          this._ev.emit('longpress', {
            x: tr.startX, y: tr.startY,
            duration: performance.now() - tr.startTime,
            pointerType: tr.pointerType,
          });
        }
      }, this._opts.longPressDuration);
    }

    // Two-finger gestures start
    if (this._pointers.size === 2) {
      const [a, b] = Array.from(this._pointers.values());
      this._pinchStart = distance({ x: a!.startX, y: a!.startY }, { x: b!.startX, y: b!.startY });
      this._rotateStart = Math.atan2(b!.startY - a!.startY, b!.startX - a!.startX);
      this._pinchActive = true; this._rotateActive = true;
      const center = { x: (a!.startX + b!.startX) / 2, y: (a!.startY + b!.startY) / 2 };
      this._ev.emit('pinchstart',  { scale: 1, delta: 0, center });
      this._ev.emit('rotatestart', { angle: 0, delta: 0, center });
    }
  }

  private _handleMove(e: PointerEvent): void {
    const t = this._pointers.get(e.pointerId);
    if (!t) return;
    const now = performance.now();
    const dt = (now - t.lastTime) / 1000;
    const dx = e.clientX - t.lastX;
    const dy = e.clientY - t.lastY;
    t.lastX = e.clientX; t.lastY = e.clientY; t.lastTime = now;

    // Single pointer → pan
    if (this._pointers.size === 1) {
      const tx = e.clientX - t.startX;
      const ty = e.clientY - t.startY;
      const movedEnough = Math.hypot(tx, ty) > this._opts.tapMaxDistance;
      if (movedEnough && !this._panActive) {
        this._panActive = true;
        if (this._longPressTimer) { clearTimeout(this._longPressTimer); this._longPressTimer = 0; }
        this._ev.emit('panstart', {
          x: e.clientX, y: e.clientY,
          dx: 0, dy: 0, tx, ty, vx: 0, vy: 0, speed: 0,
          pointerType: t.pointerType,
        });
      }
      if (this._panActive) {
        const vx = dt > 0 ? dx / dt : 0;
        const vy = dt > 0 ? dy / dt : 0;
        this._ev.emit('pan', {
          x: e.clientX, y: e.clientY,
          dx, dy, tx, ty, vx, vy, speed: Math.hypot(vx, vy),
          pointerType: t.pointerType,
        });
      }
      return;
    }

    // Two pointers → pinch + rotate
    if (this._pointers.size === 2) {
      const [a, b] = Array.from(this._pointers.values());
      const curDist = distance({ x: a!.lastX, y: a!.lastY }, { x: b!.lastX, y: b!.lastY });
      const curAngle = Math.atan2(b!.lastY - a!.lastY, b!.lastX - a!.lastX);
      const scale = this._pinchStart > 0 ? curDist / this._pinchStart : 1;
      const center = { x: (a!.lastX + b!.lastX) / 2, y: (a!.lastY + b!.lastY) / 2 };
      this._ev.emit('pinch',  { scale, delta: 0, center });
      this._ev.emit('rotate', { angle: curAngle - this._rotateStart, delta: 0, center });
    }
  }

  private _handleUp(e: PointerEvent): void {
    const t = this._pointers.get(e.pointerId);
    if (!t) return;
    this._pointers.delete(e.pointerId);
    if (this._longPressTimer) { clearTimeout(this._longPressTimer); this._longPressTimer = 0; }

    const now = performance.now();
    const duration = now - t.startTime;
    const tx = t.lastX - t.startX;
    const ty = t.lastY - t.startY;
    const totalDist = Math.hypot(tx, ty);

    // Pan end
    if (this._panActive) {
      this._panActive = false;
      const dt = duration / 1000;
      const vx = dt > 0 ? tx / dt : 0;
      const vy = dt > 0 ? ty / dt : 0;
      this._ev.emit('panend', {
        x: t.lastX, y: t.lastY,
        dx: 0, dy: 0, tx, ty, vx, vy, speed: Math.hypot(vx, vy),
        pointerType: t.pointerType,
      });

      // Swipe check
      const velocity = Math.hypot(vx, vy);
      if (velocity >= this._opts.swipeMinVelocity && totalDist >= this._opts.swipeMinDistance) {
        const dir = dirOf(tx, ty, this._opts.swipeMinDistance);
        if (dir) {
          this._ev.emit('swipe', {
            direction: dir, distance: totalDist, velocity, duration,
            pointerType: t.pointerType,
          });
        }
      }
    } else if (totalDist <= this._opts.tapMaxDistance && duration <= this._opts.tapMaxDuration) {
      // Tap
      const gap = now - this._lastTapAt;
      const near = distance({ x: t.startX, y: t.startY }, { x: this._lastTapX, y: this._lastTapY }) <= this._opts.tapMaxDistance * 3;
      if (gap <= this._opts.doubleTapMaxGap && near) {
        this._ev.emit('doubletap', { x: t.startX, y: t.startY, pointerType: t.pointerType });
        this._lastTapAt = 0;
      } else {
        this._ev.emit('tap', { x: t.startX, y: t.startY, pointerType: t.pointerType });
        this._lastTapAt = now;
        this._lastTapX = t.startX;
        this._lastTapY = t.startY;
      }
    }

    // Pinch/rotate end when second finger lifts
    if (this._pointers.size < 2) {
      if (this._pinchActive)  { this._pinchActive = false;  this._ev.emit('pinchend',  { scale: 1, delta: 0, center: { x: t.lastX, y: t.lastY } }); }
      if (this._rotateActive) { this._rotateActive = false; this._ev.emit('rotateend', { angle: 0, delta: 0, center: { x: t.lastX, y: t.lastY } }); }
    }
  }
}

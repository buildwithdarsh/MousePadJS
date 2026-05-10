import { Emitter } from '../events/events';

export type InputKind = 'mouse' | 'trackpad' | 'touch' | 'unknown';

export interface WheelInfo {
  dx: number;
  dy: number;
  kind: InputKind;
  /** True if the user is pinch-zooming on a trackpad (ctrlKey + wheel). */
  pinch: boolean;
}

/**
 * Heuristic trackpad detection + normalized wheel stream.
 *
 * Detection heuristic:
 *   - `deltaMode === 0` (pixel) with small non-integer deltas → trackpad
 *   - `deltaMode === 1` (line)  → mouse wheel
 *   - `ctrlKey + wheel` → trackpad pinch-to-zoom (Safari/Chrome)
 */
export class Trackpad {
  private _ev = new Emitter();
  private _kind: InputKind = 'unknown';
  private _started = false;
  private _onWheel: (e: Event) => void;

  constructor() {
    this._onWheel = (e) => this._handle(e as WheelEvent);
  }

  start(target: EventTarget = window): void {
    if (this._started) return;
    this._started = true;
    target.addEventListener('wheel', this._onWheel, { passive: false });
  }

  stop(target: EventTarget = window): void {
    target.removeEventListener('wheel', this._onWheel);
    this._started = false;
  }

  get kind(): InputKind { return this._kind; }
  get isTrackpad(): boolean { return this._kind === 'trackpad'; }
  get isMouse(): boolean { return this._kind === 'mouse'; }

  on(event: 'wheel' | 'pinch' | 'kind', fn: (...args: any[]) => void): () => void {
    return this._ev.on(event, fn);
  }

  private _handle(e: WheelEvent): void {
    const { deltaX, deltaY, deltaMode, ctrlKey } = e;

    // Trackpad pinch-zoom comes through as wheel with ctrlKey=true.
    // The browser intercepts it before user code unless we preventDefault.
    const pinch = ctrlKey;

    // Detect kind. Mouse wheels typically use deltaMode=1 (line) with larger
    // integer steps. Trackpads use deltaMode=0 (pixel) with small/fractional
    // deltas. Some mice also send deltaMode=0 but with multiples of 100.
    let kind: InputKind = this._kind;
    if (deltaMode === 1) {
      kind = 'mouse';
    } else if (deltaMode === 0) {
      const absMax = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      if (absMax > 0 && absMax < 50 && absMax !== Math.floor(absMax)) kind = 'trackpad';
      else if (absMax > 0 && absMax < 20) kind = 'trackpad';
      else if (absMax >= 100 && absMax % 100 === 0) kind = 'mouse';
    }

    if (kind !== this._kind && kind !== 'unknown') {
      this._kind = kind;
      this._ev.emit('kind', kind);
    }

    const info: WheelInfo = { dx: deltaX, dy: deltaY, kind: this._kind, pinch };
    if (pinch) this._ev.emit('pinch', info);
    else this._ev.emit('wheel', info);
  }
}

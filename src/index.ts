import { Gesture } from './gestures/gesture';
import type {
  GestureOptions, GestureEventName,
  TapEvent, DoubleTapEvent, LongPressEvent,
  PanEvent, SwipeEvent, PinchEvent, RotateEvent,
} from './gestures/gesture';
import { Cursor } from './cursor/cursor';
import { magnet as magnetFn } from './cursor/magnet';
import type { MagnetOptions } from './cursor/magnet';
import { follow as followFn } from './cursor/follow';
import type { FollowOptions } from './cursor/follow';
import { tilt as tiltFn } from './cursor/tilt';
import type { TiltOptions } from './cursor/tilt';
import { Trackpad } from './trackpad/trackpad';
import type { InputKind, WheelInfo } from './trackpad/trackpad';

class MousePad {
  private _cursor = new Cursor();
  private _trackpad = new Trackpad();
  private _initialized = false;

  /** Start tracking the cursor and trackpad globally. */
  init(): void {
    if (this._initialized) return;
    this._cursor.start();
    this._trackpad.start();
    this._initialized = true;
  }

  destroy(): void {
    this._cursor.stop();
    this._trackpad.stop();
    this._initialized = false;
  }

  /** Attach a gesture recognizer to an element. */
  gesture(el: Element, opts?: GestureOptions): Gesture {
    return new Gesture(el, opts);
  }

  /** Global cursor tracker (position, velocity, idle). */
  get cursor(): Cursor { return this._cursor; }

  /** Trackpad detector + wheel stream. */
  get trackpad(): Trackpad { return this._trackpad; }

  /** Make an element magnetically attracted to the cursor. */
  magnet(el: HTMLElement, opts?: MagnetOptions): () => void {
    if (!this._initialized) this.init();
    return magnetFn(el, this._cursor, opts);
  }

  /** Make an element follow the cursor with optional easing. */
  follow(el: HTMLElement, opts?: FollowOptions): () => void {
    if (!this._initialized) this.init();
    return followFn(el, this._cursor, opts);
  }

  /** Add a 3D tilt-on-hover effect to an element. */
  tilt(el: HTMLElement, opts?: TiltOptions): () => void {
    return tiltFn(el, opts);
  }
}

const mousepad = new MousePad();
export default mousepad;

export type {
  GestureOptions, GestureEventName,
  TapEvent, DoubleTapEvent, LongPressEvent,
  PanEvent, SwipeEvent, PinchEvent, RotateEvent,
  MagnetOptions, FollowOptions, TiltOptions,
  InputKind, WheelInfo,
  Gesture, Cursor, Trackpad,
};

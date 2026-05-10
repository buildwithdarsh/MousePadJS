interface GestureOptions {
    tapMaxDistance?: number;
    tapMaxDuration?: number;
    doubleTapMaxGap?: number;
    longPressDuration?: number;
    swipeMinVelocity?: number;
    swipeMinDistance?: number;
}
type GestureEventName = 'tap' | 'doubletap' | 'longpress' | 'panstart' | 'pan' | 'panend' | 'swipe' | 'pinchstart' | 'pinch' | 'pinchend' | 'rotatestart' | 'rotate' | 'rotateend';
interface TapEvent {
    x: number;
    y: number;
    pointerType: string;
}
interface DoubleTapEvent extends TapEvent {
}
interface LongPressEvent extends TapEvent {
    duration: number;
}
interface PanEvent {
    x: number;
    y: number;
    dx: number;
    dy: number;
    tx: number;
    ty: number;
    vx: number;
    vy: number;
    speed: number;
    pointerType: string;
}
interface SwipeEvent {
    direction: 'left' | 'right' | 'up' | 'down';
    distance: number;
    velocity: number;
    duration: number;
    pointerType: string;
}
interface PinchEvent {
    scale: number;
    delta: number;
    center: {
        x: number;
        y: number;
    };
}
interface RotateEvent {
    angle: number;
    delta: number;
    center: {
        x: number;
        y: number;
    };
}
/**
 * Unified gesture recognizer for an element. Backed by Pointer Events —
 * one API across mouse, trackpad, touch, and pen.
 */
declare class Gesture {
    private _el;
    private _ev;
    private _pointers;
    private _opts;
    private _longPressTimer;
    private _lastTapAt;
    private _lastTapX;
    private _lastTapY;
    private _panActive;
    private _pinchStart;
    private _rotateStart;
    private _pinchActive;
    private _rotateActive;
    private _onDown;
    private _onMove;
    private _onUp;
    constructor(_el: Element, opts?: GestureOptions);
    on(event: GestureEventName, fn: (e: any) => void): () => void;
    destroy(): void;
    private _handleDown;
    private _handleMove;
    private _handleUp;
}

/**
 * Global cursor tracker — tracks last known position, velocity, and idle state.
 * One instance per page; emits 'move', 'idle', 'active' events.
 */
declare class Cursor {
    private _ev;
    private _x;
    private _y;
    private _vx;
    private _vy;
    private _lastX;
    private _lastY;
    private _lastT;
    private _idle;
    private _idleTimer;
    private _idleDuration;
    private _started;
    private _onMove;
    constructor();
    start(): void;
    stop(): void;
    get x(): number;
    get y(): number;
    get vx(): number;
    get vy(): number;
    get speed(): number;
    get idle(): boolean;
    on(event: 'move' | 'idle' | 'active', fn: (...args: any[]) => void): () => void;
    /** Set idle threshold in ms. Default 2000. */
    setIdleTimeout(ms: number): void;
    private _handle;
    private _resetIdle;
}

interface MagnetOptions {
    /** Max distance (px) at which the magnet engages. Default 120. */
    range?: number;
    /** How strongly the element is pulled toward the cursor. 0–1. Default 0.35. */
    strength?: number;
    /** Easing factor per frame. Lower = smoother. Default 0.18. */
    ease?: number;
}

interface FollowOptions {
    /** Easing factor (0–1). Lower = smoother lag. Default 0.18. */
    ease?: number;
    /** Lock to cursor with no lag. Default false. */
    instant?: boolean;
    /** Offset from cursor position. */
    offset?: {
        x: number;
        y: number;
    };
}

interface TiltOptions {
    /** Max rotation in degrees. Default 12. */
    max?: number;
    /** Scale factor while tilted. Default 1.03. */
    scale?: number;
    /** Perspective distance in px. Default 800. */
    perspective?: number;
    /** Easing on entering tilt. Lower = smoother. Default 0.18. */
    ease?: number;
}

type InputKind = 'mouse' | 'trackpad' | 'touch' | 'unknown';
interface WheelInfo {
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
declare class Trackpad {
    private _ev;
    private _kind;
    private _started;
    private _onWheel;
    constructor();
    start(target?: EventTarget): void;
    stop(target?: EventTarget): void;
    get kind(): InputKind;
    get isTrackpad(): boolean;
    get isMouse(): boolean;
    on(event: 'wheel' | 'pinch' | 'kind', fn: (...args: any[]) => void): () => void;
    private _handle;
}

declare class MousePad {
    private _cursor;
    private _trackpad;
    private _initialized;
    /** Start tracking the cursor and trackpad globally. */
    init(): void;
    destroy(): void;
    /** Attach a gesture recognizer to an element. */
    gesture(el: Element, opts?: GestureOptions): Gesture;
    /** Global cursor tracker (position, velocity, idle). */
    get cursor(): Cursor;
    /** Trackpad detector + wheel stream. */
    get trackpad(): Trackpad;
    /** Make an element magnetically attracted to the cursor. */
    magnet(el: HTMLElement, opts?: MagnetOptions): () => void;
    /** Make an element follow the cursor with optional easing. */
    follow(el: HTMLElement, opts?: FollowOptions): () => void;
    /** Add a 3D tilt-on-hover effect to an element. */
    tilt(el: HTMLElement, opts?: TiltOptions): () => void;
}
declare const mousepad: MousePad;

export { Cursor, Gesture, Trackpad, mousepad as default };
export type { DoubleTapEvent, FollowOptions, GestureEventName, GestureOptions, InputKind, LongPressEvent, MagnetOptions, PanEvent, PinchEvent, RotateEvent, SwipeEvent, TapEvent, TiltOptions, WheelInfo };

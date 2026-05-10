> This project is made with the help of Claude (1M context).

<div align="center">

<br />

<img src="https://img.shields.io/badge/mousepad.js-v1.0.0-2997ff?style=for-the-badge&labelColor=000000" alt="version" />
<img src="https://img.shields.io/badge/gzip-~2.9KB-30d158?style=for-the-badge&labelColor=000000" alt="gzip" />
<img src="https://img.shields.io/badge/dependencies-0-bf5af2?style=for-the-badge&labelColor=000000" alt="deps" />
<img src="https://img.shields.io/badge/license-MIT-ff9f0a?style=for-the-badge&labelColor=000000" alt="license" />

<br /><br />

# mousepad.js

**Pointer intelligence for the web.**

Gestures, cursor effects, and trackpad smarts — unified across mouse, touch, pen, and trackpad. Tiny, TypeScript-first.

</div>

---

## Why mousepad.js?

Hammer.js is abandoned. interact.js is heavy. use-gesture is React-only. Modern apps need a tiny, framework-agnostic library built on Pointer Events that just handles the full input picture — including trackpad nuance like pinch-to-zoom and mouse-vs-trackpad detection.

`mousepad.js` does that in 2.9KB, zero deps.

---

## Quick Start

```bash
npm install @buildwithdarsh/mousepad.js
```

```ts
import MousePad from '@buildwithdarsh/mousepad.js';

MousePad.init();

// Gestures — works on mouse, trackpad, touch, and pen
const g = MousePad.gesture(card);
g.on('tap',       (e) => console.log(e.x, e.y));
g.on('doubletap', (e) => zoomIn(e));
g.on('longpress', (e) => showMenu(e));
g.on('swipe',     (e) => console.log(e.direction));
g.on('pan',       (e) => translate(e.dx, e.dy));
g.on('pinch',     (e) => setScale(e.scale));
g.on('rotate',    (e) => setAngle(e.angle));

// Cursor effects
MousePad.magnet(btn,  { range: 120, strength: 0.4 });
MousePad.tilt(card,   { max: 15, scale: 1.04 });
MousePad.follow(cursor, { ease: 0.15 });

// Global cursor tracker
MousePad.cursor.on('move',   ({ x, y, speed }) => ...);
MousePad.cursor.on('idle',   () => hideChrome());
MousePad.cursor.on('active', () => showChrome());

// Trackpad detection
MousePad.trackpad.on('pinch', ({ dy }) => zoom(dy));
if (MousePad.trackpad.isTrackpad) enableSmoothScroll();
```

---

## API

### Gestures — `MousePad.gesture(el, opts?)`

Unified recognizer for a single element. Returns a `Gesture` instance with an event emitter.

| Event | Fires when | Payload |
|---|---|---|
| `tap` | Quick press & release | `{ x, y, pointerType }` |
| `doubletap` | Two taps within 300ms | same as tap |
| `longpress` | Held still ≥ 500ms | `{ x, y, duration, pointerType }` |
| `pan` | Drag movement | `{ dx, dy, tx, ty, vx, vy, speed }` |
| `swipe` | Fast pan + release | `{ direction, distance, velocity, duration }` |
| `pinch` | Two-finger zoom | `{ scale, center }` |
| `rotate` | Two-finger rotate | `{ angle, center }` |

Options: `tapMaxDistance`, `tapMaxDuration`, `doubleTapMaxGap`, `longPressDuration`, `swipeMinVelocity`, `swipeMinDistance`.

### Cursor tracker — `MousePad.cursor`

| Event | Payload |
|---|---|
| `move` | `{ x, y, vx, vy, speed }` |
| `idle` | — |
| `active` | — |

Properties: `x`, `y`, `vx`, `vy`, `speed`, `idle`. Method: `setIdleTimeout(ms)`.

### Cursor effects

| Helper | What it does |
|---|---|
| `MousePad.magnet(el, opts)` | Pulls element toward cursor when within `range`. |
| `MousePad.follow(el, opts)` | Element follows cursor with easing. |
| `MousePad.tilt(el, opts)` | 3D tilt-on-hover inside the element's own box. |

All helpers return a destroy function.

### Trackpad — `MousePad.trackpad`

| Event | Payload |
|---|---|
| `wheel` | `{ dx, dy, kind, pinch: false }` |
| `pinch` | `{ dx, dy, kind, pinch: true }` (ctrl+wheel = trackpad pinch) |
| `kind` | `'mouse' \| 'trackpad' \| 'touch' \| 'unknown'` |

Properties: `kind`, `isTrackpad`, `isMouse`.

---

## License

MIT © Darsh Gupta

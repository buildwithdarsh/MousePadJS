import type { Cursor } from './cursor';

export interface FollowOptions {
  /** Easing factor (0–1). Lower = smoother lag. Default 0.18. */
  ease?: number;
  /** Lock to cursor with no lag. Default false. */
  instant?: boolean;
  /** Offset from cursor position. */
  offset?: { x: number; y: number };
}

/**
 * Make an element follow the cursor with optional easing.
 * Element must be positioned (fixed or absolute).
 */
export function follow(el: HTMLElement, cursor: Cursor, opts?: FollowOptions): () => void {
  const ease = opts?.ease ?? 0.18;
  const instant = opts?.instant ?? false;
  const offX = opts?.offset?.x ?? 0;
  const offY = opts?.offset?.y ?? 0;

  let x = cursor.x, y = cursor.y;
  let rafId = 0;
  let destroyed = false;

  function tick(): void {
    if (destroyed) return;
    if (instant) {
      x = cursor.x; y = cursor.y;
    } else {
      x += (cursor.x - x) * ease;
      y += (cursor.y - y) * ease;
    }
    el.style.transform = `translate(${(x + offX).toFixed(2)}px, ${(y + offY).toFixed(2)}px)`;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
  return () => {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

import type { Cursor } from './cursor';

export interface MagnetOptions {
  /** Max distance (px) at which the magnet engages. Default 120. */
  range?: number;
  /** How strongly the element is pulled toward the cursor. 0–1. Default 0.35. */
  strength?: number;
  /** Easing factor per frame. Lower = smoother. Default 0.18. */
  ease?: number;
}

const DEFAULTS: Required<MagnetOptions> = {
  range: 120,
  strength: 0.35,
  ease: 0.18,
};

/**
 * Make an element magnetically attracted to the cursor when nearby.
 * Returns a destroy function.
 */
export function magnet(el: HTMLElement, cursor: Cursor, opts?: MagnetOptions): () => void {
  const cfg = { ...DEFAULTS, ...opts };
  let tx = 0, ty = 0; // target
  let cx = 0, cy = 0; // current
  let rafId = 0;
  let destroyed = false;

  function tick(): void {
    if (destroyed) return;
    const rect = el.getBoundingClientRect();
    const eCx = rect.left + rect.width / 2;
    const eCy = rect.top + rect.height / 2;
    const dx = cursor.x - eCx;
    const dy = cursor.y - eCy;
    const d = Math.hypot(dx, dy);

    if (d < cfg.range) {
      const pull = (1 - d / cfg.range) * cfg.strength;
      tx = dx * pull;
      ty = dy * pull;
    } else {
      tx = 0;
      ty = 0;
    }

    cx += (tx - cx) * cfg.ease;
    cy += (ty - cy) * cfg.ease;
    el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
  return () => {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    el.style.transform = '';
  };
}

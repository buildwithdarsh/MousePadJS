export interface TiltOptions {
  /** Max rotation in degrees. Default 12. */
  max?: number;
  /** Scale factor while tilted. Default 1.03. */
  scale?: number;
  /** Perspective distance in px. Default 800. */
  perspective?: number;
  /** Easing on entering tilt. Lower = smoother. Default 0.18. */
  ease?: number;
}

/**
 * 3D tilt-on-hover effect — the element tilts toward the cursor position
 * within its own bounding box.
 */
export function tilt(el: HTMLElement, opts?: TiltOptions): () => void {
  const max = opts?.max ?? 12;
  const scale = opts?.scale ?? 1.03;
  const perspective = opts?.perspective ?? 800;
  const ease = opts?.ease ?? 0.18;

  let tx = 0, ty = 0, sc = 1;     // targets
  let cx = 0, cy = 0, cs = 1;     // current
  let active = false;
  let rafId = 0;
  let destroyed = false;

  function onEnter() { active = true; sc = scale; }
  function onLeave() { active = false; tx = 0; ty = 0; sc = 1; }
  function onMove(e: PointerEvent) {
    if (!active) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tx = -py * max * 2;   // rotateX
    ty = px * max * 2;    // rotateY
  }

  function tick(): void {
    if (destroyed) return;
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    cs += (sc - cs) * ease;
    el.style.transform =
      `perspective(${perspective}px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg) scale(${cs.toFixed(3)})`;
    rafId = requestAnimationFrame(tick);
  }

  el.addEventListener('pointerenter', onEnter);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointermove', onMove as EventListener);
  el.style.transformStyle = 'preserve-3d';
  el.style.willChange = 'transform';
  rafId = requestAnimationFrame(tick);

  return () => {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    el.removeEventListener('pointerenter', onEnter);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('pointermove', onMove as EventListener);
    el.style.transform = '';
  };
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type GlobePoint = {
  id: string;
  name: string;
  lab: string;
  labName: string;
  released: string;
  /** 0 = oldest release in the set, 1 = newest. Drives latitude. */
  t: number;
  accent: string;
};

/**
 * Every model, on one sphere.
 *
 * Plain 2D canvas rather than three.js: the whole scene is n squares and one
 * rotation, so WebGL would cost a bundle and buy nothing. It also keeps
 * three.js scoped to /compare, where the 3D scatter actually needs it.
 *
 * The hover is a lens, not a deformation. Within LENS_RADIUS of the cursor a
 * dot lerps from the page ink toward its own lab's accent, gains alpha and
 * gains a size step, weighted by 1 - d/r. Because the sphere keeps turning
 * underneath, a smooth falloff over moving points reads as liquid.
 *
 * The placement is not decorative. Latitude is release date — the newest
 * models ride the top of the sphere — and longitude is the lab, so each lab
 * occupies its own meridian band. Sweeping the cursor across the globe
 * therefore lights up one lab at a time in that lab's own colour, which is
 * the thing a single brand-coloured highlight cannot do.
 */

const LENS_RADIUS = 180;
const DOT = 2.8;
const DOT_LENS = 5.6;
/**
 * How far a dot is pushed away from the cursor at the centre of the lens.
 *
 * This is the bulge. Without it the lens only recolours, which reads as a
 * spotlight shone on a flat picture; pushing the dots outward makes the
 * surface look like it is being lifted under the pointer. Kept small — past
 * about 20px the sphere tears rather than swells.
 */
const BULGE = 15;
const SPIN = 0.00022; // radians per ms — one turn is about eight minutes

/** Height reserved at the bottom of the stage for the read-out. */
const READOUT = 96;

type Placed = GlobePoint & { x: number; y: number; z: number };

/**
 * Where each model sits.
 *
 * Latitude is release order and longitude is the lab, but latitude is taken
 * from a model's *rank* in the ordering rather than from its date directly.
 * Mapping the date straight to an angle piled two thirds of the index onto
 * the bottom third of the sphere, because releases are not spread evenly
 * through time — there are far more models from the last two years than from
 * the three before them. The sphere came out bottom-heavy and looked broken.
 *
 * Ranking instead, through the inverse-cosine that makes a uniform sphere,
 * gives every band the same area: newest at the top, oldest at the bottom,
 * and an even shell in between. The ordering still reads exactly the same;
 * only the spacing is fixed.
 *
 * Longitude gives each lab a wedge, filled on a golden-angle walk so a
 * prolific lab reads as a populated band rather than a stack. A wedge is 88%
 * of its share, leaving a visible gap between labs.
 *
 * Deterministic throughout. Random placement would move every dot on each
 * render, and a sphere that reshuffles is decoration, not a chart.
 */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function place(points: GlobePoint[]): Placed[] {
  const labs = [...new Set(points.map((p) => p.lab))].sort();
  const wedge = ((Math.PI * 2) / labs.length) * 0.88;
  const base = new Map(labs.map((lab, i) => [lab, (i / labs.length) * Math.PI * 2]));
  const seen = new Map<string, number>();

  // Newest first, so rank 0 is the top of the sphere.
  const order = [...points]
    .sort((a, b) => b.t - a.t)
    .reduce((m, p, i) => m.set(p, i), new Map<GlobePoint, number>());
  const n = Math.max(points.length, 1);

  return points.map((p) => {
    const k = seen.get(p.lab) ?? 0;
    seen.set(p.lab, k + 1);

    // Golden angle wrapped into the lab's wedge: successive models land far
    // apart inside the band instead of clumping.
    const within = ((k * GOLDEN) % wedge) - wedge / 2;
    const theta = (base.get(p.lab) ?? 0) + within;

    // Equal-area latitude from the rank, kept just off both poles so the caps
    // do not become a single stacked point.
    const rank = order.get(p) ?? 0;
    const y = 1 - (2 * (rank + 0.5)) / n;
    const phi = Math.acos(Math.max(-0.985, Math.min(0.985, y)));

    return {
      ...p,
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta),
    };
  });
}

/** #rrggbb -> [r,g,b]. Lab accents are all six-digit hex in the data. */
function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function ModelGlobe({ points }: { points: GlobePoint[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<GlobePoint | null>(null);
  const router = useRouter();

  // Read by the click handler without re-running the render effect, which
  // would otherwise tear down and rebuild the canvas on every hover.
  const under = useRef<GlobePoint | null>(null);

  useEffect(() => {
    const host = wrap.current;
    const cv = canvas.current;
    if (!host || !cv) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const placed = place(points);
    const ink = getComputedStyle(host).color;
    const inkRgb = ink.match(/\d+/g)?.slice(0, 3).map(Number) ?? [20, 20, 19];
    const accents = new Map(placed.map((p) => [p.lab, rgb(p.accent)]));

    let w = 0;
    let h = 0;
    let dpr = 1;
    const pointer = { x: -9999, y: -9999, on: false };
    let raf = 0;
    let angle = 0;
    let last = performance.now();
    let nearest: GlobePoint | null = null;

    function size() {
      // clientWidth/Height, not getBoundingClientRect. The hero entrance
      // animates this element from scale 0.92, and a bounding rect reports the
      // *transformed* box — so the first measurement baked a canvas 110px
      // narrower than its host, which then drew the sphere 55px left of
      // centre for the rest of the visit. Layout size is transform-independent.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, host!.clientWidth);
      h = Math.max(1, host!.clientHeight);
      cv!.width = Math.round(w * dpr);
      cv!.height = Math.round(h * dpr);
      cv!.style.width = `${w}px`;
      cv!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now: number) {
      const dt = Math.min(now - last, 64);
      last = now;
      if (!reduced) angle += dt * SPIN;

      const cx = w / 2;
      // The read-out occupies the bottom of the stage. Centring on the full
      // height pushed the sphere down onto it; centring on the height above
      // the caption keeps the sphere optically in the middle of its own space.
      const cy = (h - READOUT) / 2;
      const r = Math.min(w, h - READOUT) * 0.46;
      ctx!.clearRect(0, 0, w, h);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let bestD = Infinity;
      let best: GlobePoint | null = null;

      for (const p of placed) {
        // Spin about y, then flatten. No perspective divide: an orthographic
        // sphere keeps the silhouette crisp, which is what makes the rim read.
        const x = p.x * cos - p.z * sin;
        const z = p.x * sin + p.z * cos;
        let sx = cx + x * r;
        let sy = cy + p.y * r;

        // Depth drives base alpha, so the far hemisphere reads as behind.
        const depth = (z + 1) / 2;
        let alpha = 0.22 + depth * 0.58;
        let size = DOT;
        let colour = inkRgb;

        if (pointer.on) {
          const dx = sx - pointer.x;
          const dy = sy - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < LENS_RADIUS) {
            const k = 1 - d / LENS_RADIUS;
            // Cubic falloff: a linear one leaves a visible disc edge.
            const e = k * k * k;

            // The bulge. Push each dot away from the cursor along its own
            // radius, strongest at the centre, so the surface swells rather
            // than the highlight simply sliding over it. Guarded at d ~ 0,
            // where the direction is undefined.
            if (d > 0.5) {
              const push = (BULGE * e) / d;
              sx += dx * push;
              sy += dy * push;
            }

            alpha = Math.min(1, alpha + e * 0.85);
            size = DOT + (DOT_LENS - DOT) * e;
            const a = accents.get(p.lab) ?? inkRgb;
            colour = [
              inkRgb[0] + (a[0] - inkRgb[0]) * e,
              inkRgb[1] + (a[1] - inkRgb[1]) * e,
              inkRgb[2] + (a[2] - inkRgb[2]) * e,
            ];
            if (d < bestD && depth > 0.45) {
              bestD = d;
              best = p;
            }
          }
        }

        ctx!.fillStyle = `rgba(${colour[0] | 0}, ${colour[1] | 0}, ${colour[2] | 0}, ${alpha})`;
        // Squares, not circles. The reference reads as pixel dust because of
        // this, and a rect is also the cheapest thing a 2D context can fill.
        ctx!.fillRect(sx - size / 2, sy - size / 2, size, size);
      }

      if (best !== nearest) {
        nearest = best;
        under.current = best;
        cv!.style.cursor = best ? 'pointer' : '';
        setHovered(best);
      }

      raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType === 'touch') return;
      const r = cv!.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = true;
    }

    function onLeave() {
      pointer.on = false;
      pointer.x = -9999;
      pointer.y = -9999;
    }

    function onClick() {
      const hit = under.current;
      if (hit) router.push(`/labs/${hit.lab}?model=${encodeURIComponent(hit.id)}`);
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [points, router]);

  return (
    <div className="globe" ref={wrap}>
      <canvas ref={canvas} aria-hidden="true" />

      {/* The canvas is decorative; this is the same information as text. */}
      <p className="sr-only">
        {points.length} models from {new Set(points.map((p) => p.lab)).size} labs, arranged by
        release date and lab.
      </p>

      <output className="globe__read" aria-live="polite">
        {hovered ? (
          <>
            <span className="globe__read-name">{hovered.name}</span>
            <span className="globe__read-meta">
              {hovered.labName} · {hovered.released} · click to open
            </span>
          </>
        ) : null}
      </output>
    </div>
  );
}

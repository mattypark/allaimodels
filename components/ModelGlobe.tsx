'use client';

import { useEffect, useRef, useState } from 'react';

export type GlobePoint = {
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

const LENS_RADIUS = 170;
const DOT = 2.8;
const DOT_LENS = 5;
const SPIN = 0.00022; // radians per ms — one turn is about eight minutes

type Placed = GlobePoint & { x: number; y: number; z: number };

/**
 * Where each model sits.
 *
 * Latitude is the release date — the newest models ride the top of the sphere.
 * Longitude is the lab: each lab owns a wedge, and its models fill that wedge
 * on a golden-angle walk so a prolific lab reads as a populated band rather
 * than a stack. A wedge is 88% of its share, leaving a visible gap between
 * labs; with three labs that is three broad regions, with twenty it is a
 * near-continuous shell, and the lens tells them apart either way.
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

  return points.map((p) => {
    const n = seen.get(p.lab) ?? 0;
    seen.set(p.lab, n + 1);

    // Golden angle wrapped into the lab's wedge: successive models land far
    // apart inside the band instead of clumping.
    const within = ((n * GOLDEN) % wedge) - wedge / 2;
    const theta = (base.get(p.lab) ?? 0) + within;

    // Latitude from the release date, clamped off the poles, then nudged by
    // the same walk so two same-day releases don't overlap exactly.
    const drift = (((n * GOLDEN) % 1) - 0.5) * 0.07;
    const phi = Math.min(0.94, Math.max(0.06, 0.1 + (1 - p.t) * 0.8 + drift)) * Math.PI;

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
      const r = host!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
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
      const cy = h / 2;
      const r = Math.min(w, h) * 0.42;
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
        const sx = cx + x * r;
        const sy = cy + p.y * r;

        // Depth drives base alpha, so the far hemisphere reads as behind.
        const depth = (z + 1) / 2;
        let alpha = 0.22 + depth * 0.58;
        let size = DOT;
        let colour = inkRgb;

        if (pointer.on) {
          const d = Math.hypot(sx - pointer.x, sy - pointer.y);
          if (d < LENS_RADIUS) {
            const k = 1 - d / LENS_RADIUS;
            // Cubic falloff: a linear one leaves a visible disc edge.
            const e = k * k * k;
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
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [points]);

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
              {hovered.labName} · {hovered.released}
            </span>
          </>
        ) : null}
      </output>
    </div>
  );
}

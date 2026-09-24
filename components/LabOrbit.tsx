'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LabMark from './LabMark';

export type OrbitLab = {
  slug: string;
  name: string;
  accent: string;
  latest?: { name: string; released: string };
  current: number;
  total: number;
};

/**
 * The labs as marks, with the globe's lens applied to DOM nodes.
 *
 * Same maths as ModelGlobe, different medium: within LENS of the cursor each
 * tile scales up, lifts, and glows in its own accent, and its neighbours are
 * pushed outward along their own radius so the hovered mark has room. The
 * falloff is the same cubic curve, so the two interactions feel like one hand
 * made them.
 *
 * Everything is transform and opacity, written to CSS custom properties on
 * each tile in a single rAF pass. Nothing here triggers layout, so a grid of
 * twenty tiles stays at frame rate, and with no pointer — touch, keyboard,
 * reduced motion — it is an ordinary grid of links.
 */

const LENS = 260;
const LIFT = 26;

/** How far the outermost ring sits from the centre, as a share of the box. */
const SPREAD = 0.4;

/**
 * How fast each tile chases its target, per frame.
 *
 * The lens used to be written straight from the pointer's position, which
 * meant it only updated when a pointermove fired. Between events nothing
 * moved, so a slow drag arrived as a series of steps — smooth while the
 * cursor was travelling and visibly chopped when it paused. Every tile now
 * eases toward its target on a continuous loop instead, so the motion is
 * independent of how often the browser reports the pointer.
 */
const EASE = 0.16;

/**
 * Where each mark sits inside the disc.
 *
 * Concentric rings, not phyllotaxis. The sunflower packing fills a disc with
 * even *density*, which is the right answer for hundreds of points and the
 * wrong one for nineteen: at this count the eye reads individual gaps rather
 * than overall density, and the golden angle leaves some marks nearly touching
 * while others sit alone. The outline came out lumpy rather than round.
 *
 * Rings give the opposite trade — slightly uneven density, perfectly even
 * spacing along each ring and a genuinely circular outline. Ring k holds 6k
 * marks, which is hexagonal packing, so nineteen labs land as 1 + 6 + 12 with
 * nothing left over. Each ring is rotated half a step against the one inside
 * it so the marks interleave instead of forming spokes.
 */
function rings(n: number) {
  // Ring capacities 1, 6, 12, 18 … until every mark has a home.
  const caps: number[] = [];
  for (let k = 0, placed = 0; placed < n; k += 1) {
    const cap = k === 0 ? 1 : 6 * k;
    caps.push(Math.min(cap, n - placed));
    placed += caps[k];
  }

  const outer = Math.max(caps.length - 1, 1);
  const spots: { left: string; top: string }[] = [];

  caps.forEach((count, k) => {
    const r = (k / outer) * SPREAD;
    // Half-step offset per ring, so ring 2 sits in ring 1's gaps.
    const offset = k % 2 ? Math.PI / count : 0;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + offset - Math.PI / 2;
      // Fixed precision: React serialises this style on the server and again
      // on the client, and raw floats rounded differently between the two —
      // a real hydration mismatch that React logged and refused to patch.
      spots.push({
        left: `${((0.5 + r * Math.cos(a)) * 100).toFixed(4)}%`,
        top: `${((0.5 + r * Math.sin(a)) * 100).toFixed(4)}%`,
      });
    }
  });

  return spots;
}

export default function LabOrbit({ labs }: { labs: OrbitLab[] }) {
  const grid = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<OrbitLab | null>(null);
  const spots = rings(labs.length);

  useEffect(() => {
    const host = grid.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tiles = [...host.querySelectorAll<HTMLElement>('[data-tile]')];
    // Current, eased values — what is on screen — separate from the target the
    // pointer implies. Keeping both is what makes the motion continuous.
    const now = tiles.map(() => ({ e: 0, tx: 0, ty: 0 }));

    let raf = 0;
    let px = -9999;
    let py = -9999;
    let on = false;

    function paint() {
      let moving = false;
      let best: HTMLElement | null = null;
      let bestD = Infinity;

      for (let i = 0; i < tiles.length; i += 1) {
        const tile = tiles[i];
        const state = now[i];
        const r = tile.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - px;
        const dy = cy - py;
        const d = Math.hypot(dx, dy);

        let targetE = 0;
        let targetX = 0;
        let targetY = 0;

        if (on && d < LENS) {
          const k = 1 - d / LENS;
          targetE = k * k * k;

          // Under the cursor the tile stays put and grows. Further out, tiles
          // are pushed away along their own radius to clear space for it —
          // the "everything else gets out" half of the effect.
          if (d > r.width * 0.5) {
            const push = (LIFT * targetE) / d;
            targetX = dx * push;
            targetY = dy * push;
          } else if (d < bestD) {
            bestD = d;
            best = tile;
          }
        }

        state.e += (targetE - state.e) * EASE;
        state.tx += (targetX - state.tx) * EASE;
        state.ty += (targetY - state.ty) * EASE;

        // Snap to rest once the remainder is under a thousandth, so the loop
        // can actually stop instead of chasing an asymptote forever.
        if (Math.abs(targetE - state.e) < 0.001) state.e = targetE;
        if (Math.abs(targetX - state.tx) < 0.05) state.tx = targetX;
        if (Math.abs(targetY - state.ty) < 0.05) state.ty = targetY;

        if (state.e !== targetE || state.tx !== targetX || state.ty !== targetY) {
          moving = true;
        }

        tile.style.setProperty('--e', state.e.toFixed(4));
        tile.style.setProperty('--tx', `${state.tx.toFixed(2)}px`);
        tile.style.setProperty('--ty', `${state.ty.toFixed(2)}px`);
      }

      const slug = best?.dataset.tile ?? null;
      setActive((prev) =>
        prev?.slug === slug ? prev : labs.find((l) => l.slug === slug) ?? null,
      );

      // Keep the loop alive while the pointer is inside or anything is still
      // settling; stop it entirely once the grid is at rest.
      raf = on || moving ? requestAnimationFrame(paint) : 0;
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(paint);
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType === 'touch') return;
      px = e.clientX;
      py = e.clientY;
      on = true;
      schedule();
    }

    function onLeave() {
      on = false;
      px = -9999;
      py = -9999;
      schedule();
    }

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', schedule, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', schedule);
    };
  }, [labs]);

  return (
    <div
      className="orbit"
      // The whole section takes the hovered lab's colour, so the answer to
      // "whose is this" arrives before the name does.
      style={active ? ({ '--hover-accent': active.accent } as React.CSSProperties) : undefined}
      data-lit={active ? '' : undefined}
    >
      <ul className="orbit__disc" ref={grid}>
        {labs.map((lab, i) => (
          <li key={lab.slug} style={spots[i]}>
            <Link
              href={`/labs/${lab.slug}`}
              className="orbit__tile"
              data-tile={lab.slug}
              style={{ '--accent': lab.accent } as React.CSSProperties}
            >
              <LabMark lab={lab.slug} name={lab.name} size={44} />
              <span className="sr-only">
                {lab.name} — {lab.total} models
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* One caption for the whole grid rather than a label under every tile:
          twenty names at once is the wall of text the marks replaced. */}
      <p className="orbit__caption" aria-live="polite">
        {active ? (
          <>
            <span className="orbit__caption-name">{active.name}</span>
            <span className="orbit__caption-meta mono">
              {active.current} current / {active.total} total
              {active.latest ? ` · latest ${active.latest.name}` : ''}
            </span>
          </>
        ) : (
          <span className="orbit__caption-meta mono">
            Hover a mark · click to open that lab&rsquo;s models
          </span>
        )}
      </p>
    </div>
  );
}

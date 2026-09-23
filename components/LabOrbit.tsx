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
const GROW = 0.34;

export default function LabOrbit({ labs }: { labs: OrbitLab[] }) {
  const grid = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<OrbitLab | null>(null);

  useEffect(() => {
    const host = grid.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tiles = [...host.querySelectorAll<HTMLElement>('[data-tile]')];
    let raf = 0;
    let px = -9999;
    let py = -9999;
    let on = false;

    function paint() {
      raf = 0;
      let best: HTMLElement | null = null;
      let bestD = Infinity;

      for (const tile of tiles) {
        const r = tile.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - px;
        const dy = cy - py;
        const d = Math.hypot(dx, dy);

        if (!on || d > LENS) {
          tile.style.setProperty('--e', '0');
          tile.style.setProperty('--tx', '0px');
          tile.style.setProperty('--ty', '0px');
          continue;
        }

        const k = 1 - d / LENS;
        const e = k * k * k;
        tile.style.setProperty('--e', e.toFixed(3));

        // Under the cursor the tile stays put and grows. Further out, tiles
        // are pushed away along their own radius to clear space for it — the
        // "everything else gets out" half of the effect.
        if (d > r.width * 0.5) {
          const push = (LIFT * e) / d;
          tile.style.setProperty('--tx', `${(dx * push).toFixed(2)}px`);
          tile.style.setProperty('--ty', `${(dy * push).toFixed(2)}px`);
        } else {
          tile.style.setProperty('--tx', '0px');
          tile.style.setProperty('--ty', '0px');
          if (d < bestD) {
            bestD = d;
            best = tile;
          }
        }
      }

      const slug = best?.dataset.tile ?? null;
      setActive((prev) =>
        prev?.slug === slug ? prev : labs.find((l) => l.slug === slug) ?? null,
      );
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
      <ul className="orbit__grid" ref={grid}>
        {labs.map((lab) => (
          <li key={lab.slug}>
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

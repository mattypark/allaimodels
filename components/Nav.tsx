'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '/labs', label: 'Labs' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/compare', label: 'Compare' },
  { href: '/benchmarks', label: 'Benchmarks' },
];

/**
 * The nav, as a handful of separate liquid bodies.
 *
 * It used to be one capsule that translated away on scroll, which read as a
 * box being hidden. Each item is now its own blob with its own surface, and
 * three things make them behave like liquid rather than like rounded
 * rectangles:
 *
 *   Shape. A CSS border-radius takes eight values — four horizontal radii and
 *   four vertical — and driving all eight independently is what produces an
 *   organic outline rather than a pill. Each blob gets its own set, each on
 *   its own sine, and the frequencies are deliberately irrational multiples of
 *   each other so the eight never come back into phase. The outline therefore
 *   never repeats, which is the difference between something that looks alive
 *   and something that looks like a loop.
 *
 *   Difference. Every blob is seeded from its index, so no two share a phase
 *   and the row never pulses in unison.
 *
 *   Response. Scroll velocity feeds the amplitude, so the blobs are nearly
 *   still when the page is and go visibly wobbly when it moves — surface
 *   tension being disturbed. They leave on the way down and return on the way
 *   up, each on a slightly different delay so the row breaks up rather than
 *   sliding away as a unit.
 *
 * All of it is border-radius, transform and opacity, written to custom
 * properties in one rAF pass. None of those trigger layout.
 */

/** Per-blob phase offsets. Irrational-ish so the eight radii never re-align. */
const FREQ = [0.00041, 0.00053, 0.00037, 0.00061, 0.00047, 0.00059, 0.00043, 0.00067];

/** Irregular gaps between blobs. Ten pixels is the floor, not the average. */
const GAPS = [26, 12, 38, 17, 30];

export default function Nav() {
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const blobs = [...el.querySelectorAll<HTMLElement>('[data-blob]')];

    let last = window.scrollY;
    let velocity = 0;
    let hidden = 0; // 0 = present, 1 = gone
    let raf = 0;

    function frame(now: number) {
      const y = window.scrollY;
      const delta = y - last;
      last = y;

      setLifted(y > 24);

      // Chase the raw delta rather than take it. Trackpad deltas are noisy
      // enough that reading them directly makes the blobs shiver.
      velocity += (delta - velocity) * 0.18;

      const target = y < 120 ? 0 : velocity > 0.4 ? 1 : velocity < -0.4 ? 0 : hidden;
      hidden += (target - hidden) * 0.1;

      const speed = Math.min(Math.abs(velocity) / 30, 1);
      // A resting wobble so the row is never quite still, plus whatever the
      // scroll is adding.
      const amp = 6 + speed * 16;

      blobs.forEach((blob, i) => {
        const seed = i * 1.7;

        // Eight radii, each on its own sine. Centred near 50% — a blob, not a
        // rectangle with rounded corners.
        for (let k = 0; k < 8; k += 1) {
          const v = 50 + Math.sin(now * FREQ[k] + seed + k * 0.9) * amp;
          blob.style.setProperty(`--r${k + 1}`, `${v.toFixed(1)}%`);
        }

        // Each blob leaves on its own delay, so the row breaks apart.
        const lag = 1 - i * 0.07;
        const gone = Math.max(0, Math.min(1, hidden * lag));
        blob.style.setProperty('--gone', gone.toFixed(3));
        blob.style.setProperty('--stretch', (1 + speed * 0.1 * lag).toFixed(3));
        blob.style.setProperty('--pinch', (1 - speed * 0.05).toFixed(3));
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className="nav-wrap" data-lifted={lifted} ref={wrap}>
      {/* One row, and no duplicate Compare — the tab and the button were the
          same destination twice. Gaps are set per item rather than by a single
          `gap`, so the row is unevenly spaced the way a set of separate bodies
          would be, with 10px as the floor. */}
      <nav className="navbar" aria-label="Primary">
        <Link href="/" className="blob blob--mark" data-blob>
          <span className="dot" aria-hidden="true" />
          <span className="name">AAM</span>
        </Link>

        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className="blob"
            data-blob
            style={{ marginInlineStart: `${GAPS[i % GAPS.length]}px` }}
            aria-current={pathname.startsWith(l.href) ? 'page' : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

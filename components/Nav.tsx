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
 * The floating capsule, and the one piece of the page that behaves like a
 * liquid.
 *
 * It leaves on the way down and returns on the way up, but the interesting
 * part is what happens in between. Three custom properties are written every
 * frame: how far it has travelled, how much it is stretched, and how far its
 * corners have melted. Scroll velocity drives all three, so a flick sends it
 * away long and thin and a nudge barely deforms it — the body reads as
 * something with surface tension rather than a box being hidden.
 *
 * Velocity is smoothed towards the raw value rather than used directly. Raw
 * per-frame deltas are noisy enough on a trackpad that the capsule jitters,
 * and a spring that chases a jittery target looks broken rather than fluid.
 *
 * It also sits over a pale hero at rest and over content once you scroll, so
 * it carries its own contrast rather than inheriting the page's — otherwise
 * the labels vanish at exactly the wrong scroll position.
 */
export default function Nav() {
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let last = window.scrollY;
    let velocity = 0;
    let hidden = 0; // 0 = fully present, 1 = fully gone
    let raf = 0;
    let queued = false;

    function frame() {
      raf = 0;
      const y = window.scrollY;
      const delta = y - last;
      last = y;

      setLifted(y > 24);

      if (reduced) return;

      // Chase the raw delta rather than take it. Trackpad deltas are noisy
      // enough that a direct read makes the capsule shiver.
      velocity += (delta - velocity) * 0.18;

      // Past the hero it hides on the way down and returns on the way up. The
      // top of the page always shows it, whatever the direction.
      const target = y < 120 ? 0 : velocity > 0.4 ? 1 : velocity < -0.4 ? 0 : hidden;
      hidden += (target - hidden) * 0.12;

      const speed = Math.min(Math.abs(velocity) / 34, 1);

      el!.style.setProperty('--gone', hidden.toFixed(3));
      // Stretched along its travel and pinched across it — the shape a falling
      // droplet takes. Both ease out with speed.
      el!.style.setProperty('--stretch', (1 + speed * 0.14).toFixed(3));
      el!.style.setProperty('--pinch', (1 - speed * 0.07).toFixed(3));
      // Corners melt from a pill towards a blob as it moves.
      el!.style.setProperty('--melt', `${(50 - speed * 22).toFixed(1)}%`);

      // Keep running while anything is still settling.
      if (Math.abs(velocity) > 0.05 || Math.abs(target - hidden) > 0.002) schedule();
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function onScroll() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
        });
      }
      schedule();
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className="nav-wrap" data-lifted={lifted} ref={wrap}>
      <nav className="capsule" aria-label="Primary">
        <Link href="/" className="wordmark">
          <span className="dot" aria-hidden="true" />
          <span className="name">AAM</span>
        </Link>

        <ul className="tabs">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname.startsWith(l.href) ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/compare" className="cta nav-cta">
          Compare
        </Link>
      </nav>

    </header>
  );
}

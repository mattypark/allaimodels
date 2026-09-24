'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';

/**
 * Every navigation makes the new page assemble.
 *
 * Built to what the Tresmares reference actually does, which is not what it
 * looks like it does. Driving that site showed no exit animation at all —
 * the outgoing page holds opacity 1 until the browser replaces it, and the
 * pause before the URL changes is network. Everything happens on arrival: the
 * page fades in as a whole over about 250ms, and its pieces settle just behind
 * that in a stagger. It reads as fast precisely because nothing waits on the
 * page being left.
 *
 * So this replaces the clip-path wipe that was here. A wipe is one gesture
 * applied to a rectangle; this is the page putting itself together, which is
 * the thing worth having.
 *
 * Reveals animate *from* a visible resting state rather than *to* one. Starting
 * hidden — the reference parks elements at opacity 0.0001 — means a failed
 * script leaves a blank page, and this site's content is the whole point.
 */

/** Direct children of the page that settle in behind the fade. */
const PIECES = ':scope > section, :scope > div > section, :scope > article, :scope > header';

export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;

    const pieces = [...el.querySelectorAll<HTMLElement>(PIECES)];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // The whole page carries the arrival.
      tl.fromTo(el, { autoAlpha: 0.45 }, { autoAlpha: 1, duration: 0.26, ease: 'power1.out' });

      // Then the pieces settle just behind it. Only the first few: a stagger
      // that runs down a long page animates sections the reader cannot see
      // yet, and they are already past by the time they scroll into view.
      if (pieces.length) {
        tl.from(
          pieces.slice(0, 4),
          { y: 26, autoAlpha: 0, duration: 0.55, stagger: 0.07, clearProps: 'transform,opacity,visibility' },
          0.06,
        );
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return <div ref={root}>{children}</div>;
}

'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';

/**
 * Every navigation makes the new page arrive.
 *
 * Built to what the Tresmares reference measurably does, which took three
 * passes to pin down. There is no exit animation — the outgoing page holds
 * opacity 1 until the browser replaces it, and the pause before the URL
 * changes is network. And the arrival is not a slide: sampling #app every 60ms
 * through a fresh load gives 0.215, 0.53, 0.74, 0.90, 0.97, 1 over about
 * 360ms, with transform and clip-path both staying `none` the whole way.
 *
 * The clip-path wipe that used to be here was a mistake for a second reason.
 * It was written while the site was dark, where a rising edge against
 * near-black is obvious. On the cream palette it was cream revealing over
 * cream — the animation ran correctly and was invisible, which is why it kept
 * reading as "the transition isn't firing".
 *
 * So: a deep fade carries the arrival, a short lift gives it direction, and
 * the first sections settle in just behind. The lift is what makes it read as
 * coming from below without needing a wipe to prove it.
 *
 * Reveals animate *from* a visible resting state rather than *to* one. The
 * reference parks elements at opacity 0.0001, which is GSAP's way of keeping
 * them measurable while hidden; it also means a failed script leaves a blank
 * page, and on a site whose whole value is the content that trade is backwards.
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

      // Matches the reference's depth and duration. Starting at 0.4, as this
      // did, is below the threshold where a fade reads as motion at all.
      tl.fromTo(
        el,
        { autoAlpha: 0.15, y: 34 },
        { autoAlpha: 1, y: 0, duration: 0.5, clearProps: 'transform,opacity,visibility' },
      );

      // Then the pieces settle just behind it. Only the first few: a stagger
      // that runs down a long page animates sections the reader cannot see
      // yet, and they are already past by the time they scroll into view.
      if (pieces.length) {
        tl.from(
          pieces.slice(0, 4),
          {
            y: 30,
            autoAlpha: 0,
            duration: 0.6,
            stagger: 0.075,
            clearProps: 'transform,opacity,visibility',
          },
          0.08,
        );
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return <div ref={root}>{children}</div>;
}

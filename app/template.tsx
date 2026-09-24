'use client';

import { useEffect, useRef, ViewTransition } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';

/**
 * Every navigation makes the new page arrive.
 *
 * The page itself travels in a ViewTransition, which is the only mechanism
 * that can move the outgoing page as well as the incoming one — React only
 * ever has one page mounted, so everything written here before could produce
 * an entrance and nothing else.
 *
 * Finding that took four passes. Three rounds of DOM probing on the reference
 * said there was no exit animation at all: its outgoing page holds opacity 1
 * and transform none the whole way through, every time. A screen recording
 * showed the truth immediately — the old page slides up and off while the new
 * one rises from below, both on screen at once. That animation lives in the
 * compositor, where getComputedStyle cannot see it. The DOM was the wrong
 * instrument, not the wrong reading.
 *
 * What stays here is the second half: once the new page has arrived, its first
 * sections settle in behind a short fade. That part is genuinely in the DOM on
 * the reference, measured at 0.215, 0.53, 0.74, 0.90, 0.97, 1 over about 360ms.
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

      // The page's own arrival is the view transition's job now. What is left
      // is the settle: the first sections easing in once it has landed. Only
      // the first few — a stagger that runs down a long page animates sections
      // the reader cannot see, and they have finished by the time they scroll
      // into view.
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
          0.1,
        );
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    // A template remounts per navigation, unlike a layout, so enter and exit
    // both fire here and every route gets the transition without each page
    // having to opt in.
    <ViewTransition enter="page-rise" exit="page-rise">
      <div ref={root}>{children}</div>
    </ViewTransition>
  );
}

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
 * The rise is kept on top of that, because it is the part Matthew asked for
 * and the reference's fade alone reads as a page that simply appeared. It is
 * a clip-path wipe from the bottom edge plus a short lift, not a translate of
 * a whole viewport height: sliding the full height would briefly make the
 * document taller than itself, which fights Lenis and flickers the scrollbar.
 * Clipping changes no layout at all.
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

      // The page rises into place and fades up at the same time.
      tl.fromTo(
        el,
        { clipPath: 'inset(100% 0 0 0)', y: 44, autoAlpha: 0.4 },
        {
          clipPath: 'inset(0% 0 0 0)',
          y: 0,
          autoAlpha: 1,
          duration: 0.58,
          // The fade finishes early so the page is readable while the last of
          // the wipe is still travelling.
          onStart: () => gsap.to(el, { autoAlpha: 1, duration: 0.26, ease: 'power1.out' }),
        },
      );

      // Then the pieces settle just behind it. Only the first few: a stagger
      // that runs down a long page animates sections the reader cannot see
      // yet, and they are already past by the time they scroll into view.
      if (pieces.length) {
        tl.from(
          pieces.slice(0, 4),
          { y: 26, autoAlpha: 0, duration: 0.55, stagger: 0.07, clearProps: 'transform,opacity,visibility' },
          0.12,
        );
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return <div ref={root}>{children}</div>;
}

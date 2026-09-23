'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis, with one non-negotiable: it never runs for a visitor who asked for
 * reduced motion. Hijacked scrolling is the single most disorienting thing you
 * can do to someone with a vestibular disorder.
 *
 * GSAP's ScrollTrigger is driven from Lenis's own rAF loop rather than its own,
 * so the pinned timeline and the smoothed scroll cannot drift apart.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Let ScrollTrigger read positions from Lenis.
    const onScroll = () => window.dispatchEvent(new Event('lenis-scroll'));
    lenis.on('scroll', onScroll);

    return () => {
      cancelAnimationFrame(frame);
      lenis.off('scroll', onScroll);
      lenis.destroy();
    };
  }, []);

  return null;
}

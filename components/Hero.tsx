'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

type Point = { x: number; y: number; lab: string; name: string; released: string };

/**
 * The hero background is the dataset.
 *
 * The reference site fills this space with film stills of its students. We have
 * no licensed photography and no business inventing any, so the hero renders
 * the thing the site is actually about: every dated model release, placed on a
 * time axis and raised by how recent it is. It costs one inline SVG, it can
 * never be stock, and it is accurate by construction.
 */
export default function Hero({
  points,
  labCount,
  modelCount,
  sourceCount,
}: {
  points: Point[];
  labCount: number;
  modelCount: number;
  sourceCount: number;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('[data-anim]', { opacity: 1, y: 0 });
        gsap.set('[data-dot]', { opacity: 1, scale: 1 });
        return;
      }

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="line"]', { yPercent: 115, duration: 1.1, stagger: 0.09 })
        .from('[data-anim="sub"]', { opacity: 0, y: 18, duration: 0.8 }, '-=0.5')
        .from('[data-anim="cta"]', { opacity: 0, y: 14, duration: 0.7 }, '-=0.55')
        .from(
          '[data-dot]',
          { opacity: 0, scale: 0, duration: 0.5, stagger: { each: 0.012, from: 'start' } },
          '-=1.1',
        );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hero" ref={root}>
      <svg className="spine" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" strokeOpacity="0.16" />
        {points.map((p) => (
          <circle
            key={`${p.lab}-${p.name}`}
            data-dot
            cx={p.x}
            cy={p.y}
            r={2.4}
            fill="currentColor"
            fillOpacity={0.55}
          />
        ))}
      </svg>

      <div className="shell content">
        <p className="eyebrow" data-anim="sub">
          {labCount} labs · {modelCount} models · {sourceCount} cited sources
        </p>

        <h1>
          <span className="mask"><span data-anim="line">Every AI model,</span></span>
          <span className="mask"><span data-anim="line">and the source</span></span>
          <span className="mask"><span data-anim="line">for every number.</span></span>
        </h1>

        <p className="sub" data-anim="sub">
          Benchmarks, pricing, context windows and launch videos for every frontier lab —
          each figure stamped with the page it came from, the day it was read, and whether
          it can honestly be compared with anyone else&rsquo;s.
        </p>

        <div className="actions" data-anim="cta">
          <Link href="/labs" className="cta">
            Browse the labs
          </Link>
          <Link href="/timeline" className="ghost">
            See the timeline →
          </Link>
        </div>
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          background: var(--void);
          color: var(--void-ink);
          min-height: min(92svh, 54rem);
          display: flex;
          align-items: flex-end;
          padding-block: calc(var(--rhythm) + 3rem) var(--rhythm);
          overflow: hidden;
        }
        .spine {
          position: absolute;
          inset-inline: 0;
          inset-block-end: 0;
          height: 46%;
          width: 100%;
          color: var(--accent);
        }
        .content {
          position: relative;
          z-index: 1;
        }
        .content :global(.eyebrow) {
          color: rgb(245 243 238 / 0.55);
        }
        h1 {
          margin-block: 1.2rem 1.6rem;
          font-size: var(--step-4);
          letter-spacing: -0.045em;
          line-height: 0.92;
        }
        .mask {
          display: block;
          overflow: hidden;
          padding-block-end: 0.06em;
        }
        .mask > span {
          display: block;
        }
        .sub {
          max-width: 52ch;
          font-size: var(--step-1);
          line-height: 1.45;
          color: rgb(245 243 238 / 0.74);
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem 1.6rem;
          margin-block-start: 2.2rem;
        }
        .ghost {
          font-family: var(--font-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgb(245 243 238 / 0.7);
          border-block-end: 1px solid rgb(245 243 238 / 0.3);
          padding-block-end: 0.3rem;
          transition: color var(--dur-fast) var(--ease-out);
        }
        .ghost:hover {
          color: var(--void-ink);
        }
      `}</style>
    </div>
  );
}

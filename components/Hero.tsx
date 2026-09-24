'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import ModelGlobe, { type GlobePoint } from './ModelGlobe';

export type HeroStat = { value: number; label: string };

/**
 * The hero background is the dataset.
 *
 * The reference site fills this space with film stills of its students. We have
 * no licensed photography and no business inventing any, so the hero renders
 * the thing the site is actually about: every dated model release, placed on a
 * sphere by release date and lab. It can never be stock, and it is accurate by
 * construction — if a model is missing from the data it is missing from here.
 *
 * Four stat cards float around it rather than sitting in a row. They carry a
 * number and a label and nothing else — the three example names that used to
 * sit under each one made every card a different height and turned the orbit
 * into four paragraphs competing with the globe.
 */
export default function Hero({
  points,
  stats,
  labCount,
  modelCount,
  sourceCount,
  latest,
}: {
  points: GlobePoint[];
  stats: HeroStat[];
  labCount: number;
  modelCount: number;
  sourceCount: number;
  latest: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('[data-anim]', { opacity: 1, y: 0 });
        gsap.set('[data-stat]', { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="globe"]', { opacity: 0, scale: 0.92, duration: 1.4 })
        .from('[data-anim="line"]', { yPercent: 115, duration: 1.1, stagger: 0.09 }, '-=0.9')
        .from('[data-anim="sub"]', { opacity: 0, y: 18, duration: 0.8 }, '-=0.5')
        .from('[data-anim="cta"]', { opacity: 0, y: 14, duration: 0.7 }, '-=0.55')
        .from(
          '[data-stat]',
          { opacity: 0, y: 16, scale: 0.94, duration: 0.7, stagger: 0.08 },
          '-=0.9',
        );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hero" ref={root}>
      <div className="hero__stage">
        <div className="hero__globe" data-anim="globe">
          <ModelGlobe points={points} />
        </div>

        {stats.map((s, i) => (
          <figure className={`stat stat--${i + 1}`} key={s.label} data-stat>
            <span className="stat__value">{s.value.toLocaleString()}</span>
            <figcaption className="stat__label">{s.label}</figcaption>
          </figure>
        ))}
      </div>

      <div className="shell content">
        <p className="eyebrow" data-anim="sub">
          {labCount} labs · {modelCount} models · {sourceCount} cited sources
        </p>

        {/* The globe already says "every AI model". Repeating it underneath in
            48pt serif said the same thing twice and pushed the page below the
            fold, so the headline is one line and the argument moved to the
            section that exists to make it. */}
        <h1>
          <span className="mask">
            <span data-anim="line">Every model, and the source.</span>
          </span>
        </h1>

        {latest && (
          <p className="hero__fresh mono" data-anim="sub">
            Refreshed weekly by pull request · newest release indexed {latest}
          </p>
        )}

        <div className="actions" data-anim="cta">
          <Link href="/labs" className="cta">
            Browse the labs
          </Link>
          <Link href="/timeline" className="ghost">
            See the timeline →
          </Link>
        </div>
      </div>
    </div>
  );
}

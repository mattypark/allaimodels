'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type TimelineEntry = {
  id: string;
  lab: string;
  labName: string;
  name: string;
  released: string;
  status: string;
  accent: string;
};

/**
 * The frontier, laid out left to right.
 *
 * theacademysf.com fills this slot with a calendar heatmap of a school year.
 * The same idea applied to the thing this site is about: every dated model
 * release on one axis, so you can see the release cadence accelerate rather
 * than be told that it has.
 *
 * Only models with date_precision 'exact' reach this component. A model whose
 * release date we never found would otherwise plant itself at an invented
 * point on a time axis, which is the one place a guess does real damage.
 */
export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current;
    const track = rail.current;
    if (!section || !track) return;

    // Pinning hijacks the scrollbar. Anyone who asked for reduced motion gets
    // the same content as an ordinary vertical list instead.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 60rem)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      gsap.utils.toArray<HTMLElement>('[data-entry]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 26,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            containerAnimation: tween,
            start: 'left 92%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }, section);

    // Lenis drives the scroll; ScrollTrigger has to be told when it moves.
    const sync = () => ScrollTrigger.update();
    window.addEventListener('lenis-scroll', sync);

    return () => {
      window.removeEventListener('lenis-scroll', sync);
      ctx.revert();
    };
  }, [entries]);

  // Group by year so the rail has structure rather than a uniform stream.
  const years = entries.reduce<Record<string, TimelineEntry[]>>((acc, e) => {
    const y = e.released.slice(0, 4);
    (acc[y] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="tl" ref={root}>
      <div className="tl__rail" ref={rail}>
        <div className="tl__intro">
          <p className="eyebrow">Release timeline</p>
          <h2>
            {entries.length} dated releases,
            <br />
            one axis.
          </h2>
          <p className="tl__lede">
            Every model with an announced release date, in order. Scroll sideways —
            the gaps between releases are the story.
          </p>
        </div>

        {Object.entries(years).map(([year, list]) => (
          <section className="tl__year" key={year} aria-label={`Releases in ${year}`}>
            <h3 className="tl__yearmark">{year}</h3>
            <ol className="tl__list">
              {list.map((e) => (
                <li key={`${e.lab}-${e.id}`} data-entry style={{ '--dot': e.accent } as React.CSSProperties}>
                  <Link href={`/labs/${e.lab}`}>
                    <time dateTime={e.released} className="mono">
                      {e.released.slice(5)}
                    </time>
                    <span className="tl__dot" aria-hidden="true" />
                    <span className="tl__name">{e.name}</span>
                    <span className="tl__lab mono">{e.labName}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <div className="tl__end">
          <p className="eyebrow">Next</p>
          <p>
            The weekly refresh adds whatever shipped, as a pull request with the
            sources attached.
          </p>
        </div>
      </div>
    </div>
  );
}

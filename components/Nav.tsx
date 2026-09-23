'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/labs', label: 'Labs' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/compare', label: 'Compare' },
  { href: '/benchmarks', label: 'Benchmarks' },
];

/**
 * The floating glass capsule from theacademysf.com, rebuilt.
 *
 * It sits over a dark hero at rest and over pale content once you scroll, so
 * it carries its own contrast rather than inheriting the page's — otherwise
 * the labels vanish at exactly the wrong scroll position.
 */
export default function Nav() {
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="nav-wrap" data-lifted={lifted}>
      <nav className="capsule" aria-label="Primary">
        <Link href="/" className="wordmark">
          <span className="dot" aria-hidden="true" />
          <span className="name">allaimodels</span>
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

      <style jsx>{`
        .nav-wrap {
          position: fixed;
          inset-block-start: calc(env(safe-area-inset-top, 0px) + 0.9rem);
          inset-inline: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          padding-inline: var(--gutter);
          pointer-events: none;
        }
        .capsule {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: clamp(0.5rem, 2vw, 2rem);
          width: 100%;
          max-width: 62rem;
          padding: 0.5rem 0.5rem 0.5rem 1.1rem;
          border-radius: 999px;
          background: rgb(245 243 238 / 0.82);
          border: 1px solid rgb(255 255 255 / 0.5);
          box-shadow: 0 10px 40px rgb(0 0 0 / 0.16);
          backdrop-filter: blur(20px) saturate(1.6);
          transition:
            background-color var(--dur) var(--ease-out),
            box-shadow var(--dur) var(--ease-out);
          color: #141413;
        }
        .nav-wrap[data-lifted='true'] .capsule {
          background: rgb(245 243 238 / 0.94);
          box-shadow: 0 6px 24px rgb(0 0 0 / 0.1);
        }
        .wordmark {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono), monospace;
          font-size: 0.75rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 999px;
          background: var(--accent);
        }
        .tabs {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          list-style: none;
          margin: 0;
          padding: 0;
          margin-inline-start: auto;
        }
        .tabs a {
          display: block;
          padding: 0.5rem 0.85rem;
          border-radius: 999px;
          font-size: 0.82rem;
          white-space: nowrap;
          transition: background-color var(--dur-fast) var(--ease-out);
        }
        .tabs a:hover {
          background: rgb(20 20 19 / 0.07);
        }
        .tabs a[aria-current='page'] {
          background: rgb(20 20 19 / 0.1);
        }
        .nav-cta {
          padding: 0.6rem 1rem;
          border-radius: 999px;
        }
        /* Phone: the wordmark and the tab rail are enough; the duplicate CTA goes. */
        @media (max-width: 40rem) {
          .nav-cta {
            display: none;
          }
          .capsule {
            padding-inline: 0.9rem 0.4rem;
          }
          .tabs a {
            padding-inline: 0.55rem;
            font-size: 0.78rem;
          }
        }
        @media (max-width: 24rem) {
          .wordmark .name {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

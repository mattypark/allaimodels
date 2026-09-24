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

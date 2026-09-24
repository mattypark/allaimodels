'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/labs', label: 'Labs' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/benchmarks', label: 'Benchmarks' },
  { href: '/methodology', label: 'Methodology' },
];

/**
 * A flat bar, built to the reference rather than to an idea about it.
 *
 * This replaces a row of liquid blobs. They were a good demo and the wrong
 * component: a navigation's job is to say where you are and where you can go,
 * and a shape that is never the same twice actively works against both. The
 * reference does the opposite — a plain rule, plain type, and one underline
 * that marks the current page.
 *
 * The hover is the whole personality: an underline draws in from the left and
 * a single red dot rises above the label. It is the only colour in the chrome,
 * and it is four pixels wide, which is exactly why it reads.
 *
 * Sticky rather than floating. The floating capsule had to invent its own
 * contrast at every scroll position; a bar with a hairline under it never has
 * that problem.
 */
export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="nav-wrap">
      <nav className="navbar" aria-label="Primary">
        <Link href="/" className="wordmark">
          <span className="wordmark__name">AAM</span>
          <span className="wordmark__sub">every model, sourced</span>
        </Link>

        <ul className="tabs">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={pathname.startsWith(l.href) ? 'page' : undefined}>
                <span className="tabs__dot" aria-hidden="true" />
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar__end">
          <span className="navbar__meta">19 labs</span>
          <Link href="/compare" className="navbar__cta">
            Compare models
          </Link>
        </div>
      </nav>
    </header>
  );
}

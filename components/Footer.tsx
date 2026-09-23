import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="shell inner">
        <div>
          <p className="eyebrow">allaimodels</p>
          <p className="claim">
            Every number on this site carries the page it came from and the date it was
            read. Where two labs measure the same benchmark differently, we say so
            instead of ranking them.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul>
            <li><Link href="/labs">Labs</Link></li>
            <li><Link href="/timeline">Timeline</Link></li>
            <li><Link href="/compare">Compare</Link></li>
            <li><Link href="/benchmarks">Benchmarks</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
          </ul>
        </nav>
      </div>

      <div className="shell legal">
        <p>
          Model names, logos and trademarks belong to their respective owners and are
          used here to identify the models described. Portraits are credited to their
          sources on each lab page.
        </p>
        <p className="mono">Data refreshed weekly by pull request</p>
      </div>
    </footer>
  );
}

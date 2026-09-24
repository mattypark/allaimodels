import Link from 'next/link';
import LabMark from './LabMark';

export type CostRow = {
  id: string;
  lab: string;
  labName: string;
  name: string;
  accent: string;
  /** Dollars for a million tokens in plus a million out. */
  blended: number;
  inputPerMtok: number;
  outputPerMtok: number;
  context?: number;
  /** Context tokens bought per dollar of blended price. */
  perDollar?: number;
  source: string;
};

export type CostBoardProps = {
  cheapest: CostRow[];
  roomiest: CostRow[];
  priced: number;
  total: number;
  scored: number;
};

function fmt(n: number) {
  if (n === 0) return 'free';
  if (n < 1) return `$${n.toFixed(3)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}

function Row({ row, value }: { row: CostRow; value: string }) {
  return (
    <li>
      <Link href={`/labs/${row.lab}?model=${encodeURIComponent(row.id)}`} className="board__row">
        <span className="board__mark" style={{ color: row.accent }}>
          <LabMark lab={row.lab} name={row.labName} size={18} />
        </span>
        <span className="board__name">
          {row.name}
          <small>{row.labName}</small>
        </span>
        <span className="board__value mono">{value}</span>
      </Link>
    </li>
  );
}

/**
 * What the price data is actually good for.
 *
 * Two of these are computed, and the third deliberately is not. Cost and
 * context-per-dollar follow from figures every row carries, so they can be
 * ranked. "Best overall" cannot: it needs benchmark results measured under
 * comparable conditions, and there are ten of those in the whole dataset. So
 * that panel reports the coverage instead of crowning a winner, which is the
 * same rule the comparison table follows.
 *
 * Blended price is deliberately the simplest thing that can be stated in one
 * sentence — a million tokens in plus a million out. Any weighting closer to
 * real usage would be a judgement call buried inside a number.
 */
export default function CostBoard({ cheapest, roomiest, priced, total, scored }: CostBoardProps) {
  return (
    <section className="section shell">
      <div className="section__head">
        <p className="eyebrow">What it costs</p>
        <h2>The cheapest, the roomiest, and the one nobody can call.</h2>
      </div>

      <div className="board">
        <article className="board__panel">
          <header>
            <h3>Cheapest to run</h3>
            <p className="board__rule mono">
              $ per 1M in + 1M out · {priced} of {total} priced
            </p>
          </header>
          <ol>
            {cheapest.map((r) => (
              <Row key={`${r.lab}/${r.id}`} row={r} value={fmt(r.blended)} />
            ))}
          </ol>
        </article>

        <article className="board__panel">
          <header>
            <h3>Most context per dollar</h3>
            <p className="board__rule mono">tokens of window per $ blended</p>
          </header>
          <ol>
            {roomiest.map((r) => (
              <Row
                key={`${r.lab}/${r.id}`}
                row={r}
                value={
                  r.perDollar
                    ? `${Math.round(r.perDollar / 1000).toLocaleString()}k`
                    : '—'
                }
              />
            ))}
          </ol>
        </article>

        <article className="board__panel board__panel--empty">
          <header>
            <h3>Best overall</h3>
            <p className="board__rule mono">not yet callable</p>
          </header>

          <p className="board__empty">
            {scored} models in this index carry a benchmark result that was measured under
            conditions comparable with another lab&rsquo;s. That is not enough to rank
            anything, and a ranking built on it would be invented rather than measured.
          </p>

          <footer className="board__note">
            Every result added moves this panel closer to being real. Until then the honest
            answer is the coverage number, not a winner.{' '}
            <Link href="/benchmarks">See what is measured →</Link>
          </footer>
        </article>
      </div>
    </section>
  );
}

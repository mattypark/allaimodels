import type { BenchmarkResult, BenchmarkSuite } from '@/lib/schema';

/**
 * Benchmark results, each wearing its provenance.
 *
 * A percentage gets a bar because a bar is honest for a 0-100 scale. An Elo or
 * a composite index does not, because there is no meaningful zero and a bar
 * would invent one — those render as figures with their scale named.
 */
export default function BenchmarkBars({
  results,
  suites,
}: {
  results: BenchmarkResult[];
  suites: BenchmarkSuite[];
}) {
  if (results.length === 0) {
    return (
      <p className="bench-empty">
        No benchmark results sourced yet. Nothing is shown here until there is a page to
        cite for it.
      </p>
    );
  }

  return (
    <ul className="bench">
      {results.map((r, i) => {
        const suite = suites.find((s) => s.slug === r.suite);
        const isBar = r.unit === 'percent';
        return (
          <li key={`${r.suite}-${r.metric}-${i}`} data-comparable={r.comparable}>
            <div className="bench__head">
              <span className="bench__name">{suite?.name ?? r.suite}</span>
              <span className="bench__metric mono">{r.metric}</span>
              <span className="bench__value">
                {r.value}
                {isBar ? '%' : ''}
                {r.unit === 'elo' ? ' Elo' : ''}
                {r.unit === 'index' ? ' index' : ''}
              </span>
            </div>

            {isBar && (
              <div className="bench__track" role="presentation">
                <div className="bench__fill" style={{ width: `${Math.min(r.value, 100)}%` }} />
              </div>
            )}

            <div className="bench__meta">
              <a href={r.source_url} target="_blank" rel="noopener noreferrer">
                <span className={`chip chip--${r.source_type}`}>{r.source_type}</span>
                {new URL(r.source_url).hostname.replace(/^www\./, '')}
              </a>
              <time dateTime={r.measured_on}>read {r.measured_on}</time>
            </div>

            {!r.comparable && (
              <p className="bench__warn">
                <strong>Not comparable.</strong>{' '}
                {r.harness_notes ?? suite?.comparability_warning ?? 'Measurement conditions differ.'}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

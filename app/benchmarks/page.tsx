import type { Metadata } from 'next';
import Link from 'next/link';
import { getSuites, getModels, getLabs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Benchmarks',
  description:
    'What each AI benchmark actually measures, and why two labs reporting the same suite are often not running the same experiment.',
};

export default function BenchmarksPage() {
  const suites = getSuites();
  const models = getModels();
  const labs = getLabs();

  return (
    <section className="section shell page-top">
      <div className="section__head">
        <p className="eyebrow">Benchmarks</p>
        <h2>What the numbers are actually counting.</h2>
        <p>
          A benchmark name is not a measurement. Each suite below says what it tests,
          and where a score can mislead, it says how.
        </p>
      </div>

      <ul className="suites">
        {suites.map((s) => {
          const reporting = models.filter((m) => m.benchmarks.some((b) => b.suite === s.slug));
          const flagged = models
            .flatMap((m) => m.benchmarks)
            .filter((b) => b.suite === s.slug && !b.comparable).length;

          return (
            <li key={s.slug}>
              <div className="suites__head">
                <h3>{s.name}</h3>
                <span className="mono">
                  {s.higher_is_better ? 'higher is better' : 'lower is better'} ·{' '}
                  {s.unit}
                </span>
              </div>

              <p className="suites__measures">{s.measures}</p>

              {s.comparability_warning && (
                <p className="suites__warn">
                  <strong>Read with care.</strong> {s.comparability_warning}
                </p>
              )}

              <p className="suites__stats mono">
                {reporting.length} model{reporting.length === 1 ? '' : 's'} reporting
                {flagged > 0 && ` · ${flagged} flagged not comparable`}
                {s.leaderboard_url && (
                  <>
                    {' · '}
                    <a href={s.leaderboard_url} target="_blank" rel="noopener noreferrer">
                      leaderboard
                    </a>
                  </>
                )}
              </p>

              {reporting.length > 0 && (
                <ul className="suites__models">
                  {reporting.map((m) => (
                    <li key={`${m.lab}/${m.id}`}>
                      <Link
                        href={`/labs/${m.lab}`}
                        style={
                          {
                            '--dot': labs.find((l) => l.slug === m.lab)?.brand.accent,
                          } as React.CSSProperties
                        }
                      >
                        <span className="picker__dot" aria-hidden="true" />
                        {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

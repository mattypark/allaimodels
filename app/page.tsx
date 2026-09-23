import Hero from '@/components/Hero';
import LabCard from '@/components/LabCard';
import { getLabs, getModels, datedModels, getSuites } from '@/lib/data';

export default function Home() {
  const labs = getLabs();
  const models = getModels();
  const dated = datedModels();
  const suites = getSuites();

  // Every cited page across the dataset, deduped — the number the hero claims.
  const sources = new Set<string>();
  for (const l of labs) l.sources.forEach((s) => sources.add(s));
  for (const m of models) {
    m.sources.forEach((s) => sources.add(s));
    m.benchmarks.forEach((b) => sources.add(b.source_url));
  }

  // Every model goes on the globe, not just the exactly-dated ones. A date
  // read off a listing is precise enough to place a dot; the distinction only
  // matters where the date is quoted as a fact, which is the timeline.
  const times = models.map((m) => new Date(m.released).getTime());
  const first = Math.min(...times);
  const span = Math.max(Math.max(...times) - first, 1);
  const accentFor = new Map(labs.map((l) => [l.slug, l.brand.accent]));
  const nameFor = new Map(labs.map((l) => [l.slug, l.name]));

  const points = models.map((m) => ({
    id: m.id,
    name: m.name,
    lab: m.lab,
    labName: nameFor.get(m.lab) ?? m.lab,
    released: m.released,
    t: (new Date(m.released).getTime() - first) / span,
    accent: accentFor.get(m.lab) ?? '#d97757',
  }));

  const benchmarkCount = models.reduce((n, m) => n + m.benchmarks.length, 0);

  // The three most recent releases per stat, named under each number. A count
  // on its own reads as marketing; three real names make it checkable.
  const newest = models.slice(0, 3).map((m) => m.name);
  const biggestLabs = [...labs]
    .map((l) => ({ name: l.name, n: models.filter((m) => m.lab === l.slug).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .map((l) => l.name);
  const scoredSuites = [
    ...new Set(models.flatMap((m) => m.benchmarks.map((b) => b.suite))),
  ]
    .map((slug) => suites.find((s) => s.slug === slug)?.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 3);
  const sourceHosts = [...sources]
    .map((u) => {
      try {
        return new URL(u).hostname.replace(/^www\./, '');
      } catch {
        return null;
      }
    })
    .filter((h): h is string => Boolean(h));
  const topHosts = [...new Set(sourceHosts)].slice(0, 3);

  const stats = [
    { value: models.length, label: 'models indexed', examples: newest },
    { value: labs.length, label: 'labs covered', examples: biggestLabs },
    { value: benchmarkCount, label: 'sourced results', examples: scoredSuites },
    { value: sources.size, label: 'cited pages', examples: topHosts },
  ];

  return (
    <>
      <Hero
        points={points}
        stats={stats}
        labCount={labs.length}
        modelCount={models.length}
        sourceCount={sources.size}
        latest={models[0]?.released ?? ''}
      />

      <section className="section shell">
        <div className="section__head">
          <p className="eyebrow">The labs</p>
          <h2>Who is actually building the frontier.</h2>
          <p>
            {labs.length} labs, every model each one shipped, and the source behind every
            figure. Hover a card and the page takes that lab&rsquo;s own colours and type.
          </p>
        </div>

        <div className="lab-grid">
          {labs.map((lab) => (
            <LabCard
              key={lab.slug}
              lab={lab}
              models={models.filter((m) => m.lab === lab.slug)}
            />
          ))}
        </div>
      </section>

      <section className="section shell">
        <div className="section__head">
          <p className="eyebrow">Why this exists</p>
          <h2>Most comparison sites are quietly lying to you.</h2>
          <p>
            Two labs publish a SWE-bench score. One ran it with a custom agent scaffold and
            unlimited retries; the other ran it once, cold. Put those side by side in a
            ranked table and you have invented a result that nobody measured.
          </p>
        </div>

        <ul className="principles">
          <li>
            <span className="mono">01</span>
            <h3>Every number carries its page</h3>
            <p>
              {benchmarkCount} benchmark results are recorded here, and not one of them can
              exist in the data without a source URL and the date it was read. The schema
              refuses to store a bare number.
            </p>
          </li>
          <li>
            <span className="mono">02</span>
            <h3>Incomparable numbers are greyed, not ranked</h3>
            <p>
              Across {suites.length} benchmark suites, each result is flagged for whether it
              can honestly be set against another lab&rsquo;s. Where it can&rsquo;t, the
              comparison view greys the cell and tells you why instead of crowning a winner.
            </p>
          </li>
          <li>
            <span className="mono">03</span>
            <h3>A blocked source is reported, never guessed</h3>
            <p>
              The weekly scraper fails closed. If a lab&rsquo;s pricing page starts refusing
              robots — and two of them already do — the old figure stays put and the refresh
              says so in its pull request.
            </p>
          </li>
        </ul>
      </section>
    </>
  );
}

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

  // Map releases onto the hero spine: x by date, y raised by recency.
  const first = new Date(dated[0]?.released ?? '2023-01-01').getTime();
  const last = new Date(dated.at(-1)?.released ?? Date.now()).getTime();
  const span = Math.max(last - first, 1);

  const points = dated.map((m) => {
    const t = (new Date(m.released).getTime() - first) / span;
    return {
      x: 20 + t * 960,
      y: 250 - Math.pow(t, 1.7) * 190,
      lab: m.lab,
      name: m.name,
      released: m.released,
    };
  });

  const benchmarkCount = models.reduce((n, m) => n + m.benchmarks.length, 0);

  return (
    <>
      <Hero
        points={points}
        labCount={labs.length}
        modelCount={models.length}
        sourceCount={sources.size}
      />

      <section className="section shell">
        <div className="section__head">
          <p className="eyebrow">The labs</p>
          <h2>Who is actually building the frontier.</h2>
          <p>
            Ten labs get the full treatment — every model, every benchmark, the founders
            and the launch videos. Hover a card and the page shows you that lab&rsquo;s own
            colours and type before you even open it.
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

import Hero from '@/components/Hero';
import LabOrbit from '@/components/LabOrbit';
import CostBoard, { type CostRow } from '@/components/CostBoard';
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

  // Cost rankings. Blended price is a million tokens in plus a million out —
  // the simplest definition that can be stated in one sentence, so the ranking
  // does not hide a weighting inside a number.
  const costRows: CostRow[] = models
    .filter((m) => m.pricing)
    .map((m) => {
      const blended = m.pricing!.input_per_mtok + m.pricing!.output_per_mtok;
      return {
        id: m.id,
        lab: m.lab,
        labName: nameFor.get(m.lab) ?? m.lab,
        name: m.name,
        accent: accentFor.get(m.lab) ?? '#d97757',
        blended,
        inputPerMtok: m.pricing!.input_per_mtok,
        outputPerMtok: m.pricing!.output_per_mtok,
        context: m.context?.input_tokens,
        perDollar: m.context && blended > 0 ? m.context.input_tokens / blended : undefined,
        source: m.sources[0],
      };
    });

  // A model served free carries a real price of zero, which would take every
  // top slot and say nothing about cost. Ranked separately from the paid ones.
  const cheapest = costRows
    .filter((r) => r.blended > 0)
    .sort((a, b) => a.blended - b.blended)
    .slice(0, 6);

  const roomiest = costRows
    .filter((r) => r.perDollar)
    .sort((a, b) => (b.perDollar ?? 0) - (a.perDollar ?? 0))
    .slice(0, 6);

  const comparable = models.filter((m) =>
    m.benchmarks.some((b) => b.comparable),
  ).length;

  // The same shape /labs builds, so one component serves both.
  const orbit = labs.map((lab) => {
    const mine = models.filter((m) => m.lab === lab.slug);
    const newest = [...mine].sort((a, b) => b.released.localeCompare(a.released))[0];
    return {
      slug: lab.slug,
      name: lab.name,
      accent: lab.brand.accent,
      current: mine.filter((m) => m.status === 'current' || m.status === 'preview').length,
      total: mine.length,
      latest: newest ? { name: newest.name, released: newest.released } : undefined,
    };
  });

  const stats = [
    { value: models.length, label: 'models indexed' },
    { value: labs.length, label: 'labs covered' },
    { value: benchmarkCount, label: 'sourced results' },
    { value: sources.size, label: 'cited pages' },
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

      <CostBoard
        cheapest={cheapest}
        roomiest={roomiest}
        priced={costRows.length}
        total={models.length}
        scored={comparable}
      />

      <section className="section shell">
        <div className="section__head">
          <p className="eyebrow">The labs</p>
          <h2>Who is actually building the frontier.</h2>
          <p>
            {labs.length} labs, every model each one shipped, and the source behind every
            figure. Hover a mark and the page takes that lab&rsquo;s own colour.
          </p>
        </div>

        <LabOrbit labs={orbit} />
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

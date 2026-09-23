import type { Metadata } from 'next';
import { getLabs, getModels, getSuites } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'How this index sources benchmark numbers, when it refuses to rank them, and what it does when a source blocks it.',
};

export default function MethodologyPage() {
  const labs = getLabs();
  const models = getModels();
  const suites = getSuites();

  const results = models.flatMap((m) => m.benchmarks);
  const byType = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.source_type] = (acc[r.source_type] ?? 0) + 1;
    return acc;
  }, {});
  const uncomparable = results.filter((r) => !r.comparable).length;
  const observed = models.filter((m) => m.date_precision === 'observed').length;

  return (
    <article className="section shell page-top prose">
      <p className="eyebrow">Methodology</p>
      <h1>What this site will and will not claim.</h1>

      <p className="prose__lede">
        Comparison sites go wrong in a predictable way: they collect numbers that were
        never measured the same way, put them in one column, and sort it. The sort is
        the lie. Everything below exists to avoid that.
      </p>

      <h2>Every number carries its page</h2>
      <p>
        A benchmark result cannot exist in this dataset without a source URL, the date
        it was read, and a declared source type. That is enforced by the schema, not by
        discipline — there is no shape a bare number can take that the validator will
        accept, so a scraper cannot introduce one by accident.
      </p>
      <p>
        Right now that is {results.length} results across {suites.length} suites:{' '}
        {byType.official ?? 0} from labs&rsquo; own pages, {byType['third-party'] ?? 0}{' '}
        from independent evaluators, {byType.community ?? 0} from community
        reproductions.
      </p>

      <h2>Incomparable numbers are greyed, not ranked</h2>
      <p>
        Two labs can publish a SWE-bench score where one ran a custom agent scaffold
        with unlimited retries and the other ran a single cold attempt. Both numbers are
        true. Ranking them against each other produces a result nobody measured.
      </p>
      <p>
        Each result therefore carries an explicit comparability flag and, when it is
        false, a plain-language reason. {uncomparable} of {results.length} results are
        currently flagged. Those render hatched and greyed, and the comparison view
        refuses to rank them.
      </p>

      <h2>Missing is better than invented</h2>
      <p>
        Where a spec is unsourced, the field is absent and the page says so. Where a
        model has no announced release date, it records the day this index first
        observed it listed, marked &ldquo;seen&rdquo; rather than
        &ldquo;released&rdquo;, and it is excluded from the timeline entirely — a
        guessed date on a time axis is a lie with a shape. {observed} models are in that
        state today.
      </p>

      <h2>A blocked source is reported, never guessed</h2>
      <p>
        The weekly refresh fails closed. If a source errors, rate-limits or blocks
        automated readers, the existing value stays exactly as it was and the refresh
        reports the failure in its pull request. During the first research pass two of
        five primary sources were already unreachable: OpenAI&rsquo;s pricing page
        returns HTTP 403, and Artificial Analysis is intercepted by a TLS filter on the
        network this was built from. Neither produced a number.
      </p>

      <h2>Nothing merges itself</h2>
      <p>
        The scraper opens a pull request. A person reads the diff and merges it. An
        index that rewrites itself unattended is one bad selector away from publishing
        nonsense at scale with full confidence.
      </p>

      <h2>On the typefaces</h2>
      <p>
        Each lab is set in a different face, because {labs.length} labs reading in one
        font is a spreadsheet. The real identities — Anthropic&rsquo;s Copernicus and
        Styrene, OpenAI Sans, Google Sans — are licensed and cannot ship from a public
        repository, so every lab currently wears a free stand-in chosen to sit close to
        its character. Each is built as a slot: a purchased licence drops in with a
        one-line change and no other edits.
      </p>

      <h2>On the portraits and the logos</h2>
      <p>
        Model names and logos belong to their owners and appear here to identify what is
        being described. Founder portraits are shown with a credit and a link to their
        source, and a founder without a sourced photograph gets initials rather than a
        stock silhouette. Any photograph can be removed by deleting one field.
      </p>
    </article>
  );
}

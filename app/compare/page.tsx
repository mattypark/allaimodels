import type { Metadata } from 'next';
import Compare from '@/components/Compare';
import { getLabs, getModels, getSuites } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Compare',
  description:
    'Compare frontier AI models side by side — specs and benchmarks, with incomparable measurements greyed rather than ranked.',
};

export default function ComparePage() {
  const labs = getLabs();
  const models = getModels().filter((m) => m.status === 'current' || m.status === 'preview');

  const accents = Object.fromEntries(labs.map((l) => [l.slug, l.brand.accent]));
  const labNames = Object.fromEntries(labs.map((l) => [l.slug, l.name]));

  return (
    <section className="section shell page-top">
      <div className="section__head">
        <p className="eyebrow">Compare</p>
        <h2>Side by side, without the fake ranking.</h2>
        <p>
          Every current model, with the numbers we can actually cite. Where two labs
          measured the same benchmark under different conditions, the cells are greyed
          and the reason is one hover away.
        </p>
      </div>

      <Compare models={models} suites={getSuites()} accents={accents} labNames={labNames} />
    </section>
  );
}

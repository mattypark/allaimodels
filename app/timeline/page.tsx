import type { Metadata } from 'next';
import Timeline from '@/components/Timeline';
import { datedModels, getLabs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Timeline',
  description:
    'Every frontier AI model release with an announced date, on a single horizontal axis.',
};

export default function TimelinePage() {
  const labs = getLabs();
  const entries = datedModels().map((m) => {
    const lab = labs.find((l) => l.slug === m.lab);
    return {
      id: m.id,
      lab: m.lab,
      labName: lab?.name ?? m.lab,
      name: m.name,
      released: m.released,
      status: m.status,
      accent: lab?.brand.accent ?? '#d97757',
    };
  });

  return (
    <>
      <Timeline entries={entries} />

      <section className="section shell">
        <div className="section__head">
          <p className="eyebrow">How to read it</p>
          <h2>The gaps matter more than the dots.</h2>
          <p>
            A model only appears here if a lab announced a release date for it. Models
            we have found listed but never dated are kept off the axis entirely — they
            are marked &ldquo;seen&rdquo; on their lab page instead, because a guessed
            date on a timeline is a lie with a shape.
          </p>
        </div>
      </section>
    </>
  );
}

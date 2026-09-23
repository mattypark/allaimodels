import type { Metadata } from 'next';
import LabCard from '@/components/LabCard';
import LabOrbit from '@/components/LabOrbit';
import { getLabs, getModels } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Labs',
  description:
    'Every lab building frontier AI models, with their full release history, founders and sourced benchmarks.',
};

export default function LabsPage() {
  const labs = getLabs();
  const models = getModels();

  const orbit = labs.map((lab) => {
    const mine = models.filter((m) => m.lab === lab.slug);
    const latest = [...mine].sort((a, b) => b.released.localeCompare(a.released))[0];
    return {
      slug: lab.slug,
      name: lab.name,
      accent: lab.brand.accent,
      current: mine.filter((m) => m.status === 'current' || m.status === 'preview').length,
      total: mine.length,
      latest: latest ? { name: latest.name, released: latest.released } : undefined,
    };
  });

  return (
    <>
      <section className="section shell page-top">
        <div className="section__head">
          <p className="eyebrow">The labs</p>
          <h2>Everyone building the frontier.</h2>
        </div>

        <LabOrbit labs={orbit} />
      </section>

      <section className="section shell">
        <div className="section__head">
          <p className="eyebrow">In full</p>
          <h2>Every lab, with its latest release.</h2>
        </div>

        <div className="lab-grid">
          {labs.map((lab) => (
            <LabCard key={lab.slug} lab={lab} models={models.filter((m) => m.lab === lab.slug)} />
          ))}
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import LabCard from '@/components/LabCard';
import { getLabs, getModels } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Labs',
  description:
    'Every lab building frontier AI models, with their full release history, founders and sourced benchmarks.',
};

export default function LabsPage() {
  const labs = getLabs();
  const models = getModels();

  return (
    <section className="section shell page-top">
      <div className="section__head">
        <p className="eyebrow">The labs</p>
        <h2>Everyone building the frontier.</h2>
        <p>
          Tier one labs get the full treatment — every model they have shipped, the
          benchmarks with their sources, the founders, and the launch videos. Each card
          shows the lab&rsquo;s own palette and typeface.
        </p>
      </div>

      <div className="lab-grid">
        {labs.map((lab) => (
          <LabCard key={lab.slug} lab={lab} models={models.filter((m) => m.lab === lab.slug)} />
        ))}
      </div>
    </section>
  );
}

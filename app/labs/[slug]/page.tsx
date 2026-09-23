import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ModelList from '@/components/ModelList';
import { getLab, getLabs, modelsForLab, getSuites } from '@/lib/data';
import { fontsFor } from '@/lib/fonts/registry';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getLabs().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return {};
  return {
    title: lab.name,
    description: lab.summary,
    openGraph: { title: `${lab.name} — allaimodels`, description: lab.summary },
  };
}

export default async function LabPage({ params }: Params) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  const models = modelsForLab(slug);
  const suites = getSuites();
  const fonts = fontsFor(slug);

  const current = models.filter((m) => m.status === 'current' || m.status === 'preview');
  const past = models.filter((m) => m.status === 'legacy' || m.status === 'retired');

  // The whole page repaints from the lab's six tokens plus its type slots.
  const style = {
    '--bg': lab.brand.bg,
    '--ink': lab.brand.ink,
    '--muted': lab.brand.muted,
    '--accent': lab.brand.accent,
    '--accent-ink': lab.brand.accent_ink,
    // --paper and --line must be derived from the lab's own bg and ink, not
    // inherited. A lab theme that sets only six tokens leaves these two coming
    // from the root palette, so under a dark OS preference a light lab gets
    // dark paper behind dark ink — invisible text. Deriving them keeps a lab's
    // palette internally consistent whatever the viewer's system is set to.
    '--paper': `color-mix(in srgb, ${lab.brand.bg} 94%, ${lab.brand.ink})`,
    '--line': `color-mix(in srgb, ${lab.brand.ink} 14%, transparent)`,
    '--font-display': fonts.display,
    '--font-mono': fonts.mono,
  } as CSSProperties;

  return (
    <div data-lab={lab.slug} style={style} className="lab-page">
      <header className="shell page-top lab-head">
        <p className="eyebrow">
          <Link href="/labs">Labs</Link> · {lab.hq} · founded {lab.founded}
        </p>
        <h1>{lab.name}</h1>
        <p className="lab-head__summary">{lab.summary}</p>

        <p className="lab-head__type mono">
          Set in {fonts.standsInFor.split(' / ')[0]}&rsquo;s stand-in — see{' '}
          <Link href="/methodology">methodology</Link> for why the real face isn&rsquo;t here.
        </p>

        <ul className="lab-head__links">
          {Object.entries(lab.links).map(([k, v]) => (
            <li key={k}>
              <a href={v} target="_blank" rel="noopener noreferrer">
                {k}
              </a>
            </li>
          ))}
        </ul>
      </header>

      {lab.founders.length > 0 && (
        <section className="shell section founders-section">
          <div className="section__head">
            <p className="eyebrow">Founders</p>
            <h2>The people who started it.</h2>
          </div>
          <ul className="founders">
            {lab.founders.map((f) => (
              <li key={f.name}>
                {f.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="portrait"
                    src={f.portrait.src}
                    alt={f.name}
                    width={400}
                    height={500}
                    loading="lazy"
                  />
                ) : (
                  <span className="founders__initials" aria-hidden="true">
                    {f.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')}
                  </span>
                )}
                <h3>{f.name}</h3>
                <p className="founders__role mono">{f.role}</p>
                <p className="founders__bio">{f.bio}</p>
                {f.portrait && (
                  <p className="founders__credit">
                    Photo:{' '}
                    <a href={f.portrait.source_url} target="_blank" rel="noopener noreferrer">
                      {f.portrait.credit}
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shell section">
        <div className="section__head">
          <p className="eyebrow">Shipping now</p>
          <h2>{current.length} models currently available.</h2>
          <p>Open any model for its specs, sources, launch video and benchmarks.</p>
        </div>
        <ModelList models={current} suites={suites} />
      </section>

      {past.length > 0 && (
        <section className="shell section">
          <div className="section__head">
            <p className="eyebrow">History</p>
            <h2>{past.length} models retired or superseded.</h2>
            <p>
              Most carry a release date and nothing more. Specs are added as they are
              sourced, never filled in from memory.
            </p>
          </div>
          <ModelList models={past} suites={suites} />
        </section>
      )}
    </div>
  );
}

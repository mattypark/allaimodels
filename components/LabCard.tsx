import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { LabData, ModelData } from '@/lib/data';
import { fontsFor } from '@/lib/fonts/registry';
import LabMark from './LabMark';

/**
 * A lab card previews its own theme inside the default page.
 *
 * Every lab overrides the same six custom properties, so the card needs no
 * per-lab code — it sets the variables from data and the shared CSS does the
 * rest. Adding a lab is a JSON file, never a component.
 *
 * The summary used to sit here and made the grid a wall of paragraphs that
 * nobody reads twice. The card now carries the mark, the name in that lab's
 * own face, the counts, and the latest release. The prose still exists, on the
 * lab's own page, where someone has asked for it.
 */
export default function LabCard({ lab, models }: { lab: LabData; models: ModelData[] }) {
  const fonts = fontsFor(lab.slug);
  const current = models.filter((m) => m.status === 'current' || m.status === 'preview');

  // Newest by date, whatever the precision. Requiring an exact date left every
  // lab seeded from a listing with no "latest" line at all, which read as a
  // lab that had shipped nothing.
  const latest = [...models].sort((a, b) => b.released.localeCompare(a.released))[0];

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
    '--paper': `color-mix(in srgb, ${lab.brand.bg} 96%, ${lab.brand.ink})`,
    '--line': `color-mix(in srgb, ${lab.brand.ink} 14%, transparent)`,
    '--font-display': fonts.display,
    '--font-mono': fonts.mono,
  } as CSSProperties;

  return (
    <Link href={`/labs/${lab.slug}`} className="lab-card" data-lab={lab.slug} style={style}>
      <div className="lab-card__top">
        <span className="eyebrow">{lab.hq.split(',')[0]} · est. {lab.founded}</span>
        <span className="lab-card__count mono">
          {current.length} current / {models.length} total
        </span>
      </div>

      <div className="lab-card__mark">
        <LabMark lab={lab.slug} name={lab.name} size={64} />
      </div>

      <h3>{lab.name}</h3>

      <div className="lab-card__foot">
        {latest && (
          <span className="lab-card__latest">
            Latest — {latest.name}
            <time dateTime={latest.released}> · {latest.released}</time>
          </span>
        )}
        <span className="lab-card__go" aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

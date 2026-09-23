import { logoFor } from '@/lib/logos';

/**
 * A lab's real mark, or its initials.
 *
 * Marks are inlined from data/logos.json rather than loaded from public/, so
 * a page with twenty of them makes zero extra requests and nothing reflows
 * when they arrive. Every path is set to currentColor, which is what lets the
 * same file sit on cream and on near-black without a second asset.
 *
 * A lab with no free mark gets a monogram instead of someone else's logo.
 */
export default function LabMark({
  lab,
  name,
  size = 20,
  className,
}: {
  lab: string;
  /** Used for the monogram and the accessible label when no mark exists. */
  name?: string;
  size?: number;
  className?: string;
}) {
  const logo = logoFor(lab);
  const label = logo?.title ?? name ?? lab;

  if (!logo) {
    const initials = (name ?? lab)
      .split(/[\s-]+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

    return (
      <span
        className={['mark', 'mark--monogram', className].filter(Boolean).join(' ')}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
        role="img"
        aria-label={label}
      >
        {initials}
      </span>
    );
  }

  return (
    <svg
      className={['mark', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox={logo.viewBox}
      fill="currentColor"
      role="img"
      aria-label={label}
    >
      {logo.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

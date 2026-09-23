import logos from '@/data/logos.json' with { type: 'json' };

/**
 * Lab marks, inlined.
 *
 * data/logos.json is written by `npm run logos` and committed, so a mark costs
 * no request and no layout shift, and inherits currentColor in both themes.
 * The file also carries each mark's source URL, licence and read date — the
 * same rule every benchmark number obeys.
 */
export type Logo = {
  slug: string;
  title: string;
  viewBox: string;
  paths: string[];
  source_url: string;
  license: string;
  fetched_on: string;
};

const BY_SLUG: Record<string, Logo> = Object.fromEntries(
  (logos as Logo[]).map((l) => [l.slug, l]),
);

export function logoFor(slug: string | undefined): Logo | undefined {
  return slug ? BY_SLUG[slug] : undefined;
}

/** Every lab that has a real mark, for the credits line. */
export function allLogos(): Logo[] {
  return logos as Logo[];
}

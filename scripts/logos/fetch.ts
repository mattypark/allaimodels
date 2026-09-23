/**
 * Fetch every lab's mark once, normalise it, and write both the file and its
 * provenance.
 *
 * Normalising matters as much as fetching. A brand SVG arrives with a hard
 * fill, a fixed size and sometimes a <title>; inlined as-is it would ignore
 * the page theme and blow the CSP budget. Stripped to a viewBox and a path
 * set to currentColor, the same mark works on cream and on near-black, at
 * 14px in a table cell and at 200px in a logo wall, with no network request.
 *
 *   node --experimental-strip-types scripts/logos/fetch.ts
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { get } from '../scrape/lib/fetch.ts';
import { LOGO_SOURCES, simpleIconUrl, SIMPLE_ICONS_LICENSE } from './manifest.ts';

const OUT_SVG = 'public/logos';
const OUT_JSON = 'data/logos.json';
const MAX_BYTES = 24 * 1024;

export type LogoRecord = {
  slug: string;
  title: string;
  viewBox: string;
  paths: string[];
  source_url: string;
  license: string;
  fetched_on: string;
};

/** Anything here means the file is a wrapper around a raster or a script, not a mark. */
const REJECT = /<image\b|<script\b|<foreignObject\b|xlink:href\s*=\s*"data:/i;

function normalise(svg: string): { viewBox: string; paths: string[]; title: string } | string {
  if (svg.length > MAX_BYTES) return `svg is ${svg.length}B, over the ${MAX_BYTES}B ceiling`;
  if (REJECT.test(svg)) return 'svg embeds a raster, a script or an external reference';

  const viewBox = svg.match(/viewBox="([^"]+)"/i)?.[1];
  if (!viewBox) return 'svg has no viewBox, so it cannot scale';

  const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/gi)].map((m) => m[1]);
  if (!paths.length) return 'svg has no <path>, so it is not a flat mark';

  const title = svg.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
  return { viewBox, paths, title };
}

async function tryOne(slug: string): Promise<LogoRecord | { slug: string; reason: string }> {
  const source = LOGO_SOURCES[slug];
  if (!source) return { slug, reason: 'no source declared in the manifest' };

  const urls =
    source.kind === 'simple-icons' ? source.candidates.map(simpleIconUrl) : [source.url];
  const license = source.kind === 'simple-icons' ? SIMPLE_ICONS_LICENSE : source.license;

  const misses: string[] = [];
  for (const url of urls) {
    const res = await get(url);
    if (!res.ok) {
      misses.push(`${url} — ${res.reason}`);
      continue;
    }
    const shaped = normalise(res.body);
    if (typeof shaped === 'string') {
      misses.push(`${url} — ${shaped}`);
      continue;
    }
    return {
      slug,
      title: shaped.title || slug,
      viewBox: shaped.viewBox,
      paths: shaped.paths,
      source_url: url,
      license,
      fetched_on: res.fetchedAt,
    };
  }
  return { slug, reason: misses.join('; ') };
}

/** The file written to public/, for anyone who wants the mark on its own. */
function toFile(rec: LogoRecord) {
  const body = rec.paths.map((d) => `  <path d="${d}" />`).join('\n');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${rec.viewBox}" fill="currentColor" role="img" aria-label="${rec.title}">`,
    body,
    '</svg>',
    '',
  ].join('\n');
}

async function main() {
  await mkdir(OUT_SVG, { recursive: true });

  const slugs = Object.keys(LOGO_SOURCES);
  const got: LogoRecord[] = [];
  const missed: { slug: string; reason: string }[] = [];

  for (const slug of slugs) {
    const out = await tryOne(slug);
    if ('reason' in out) {
      missed.push(out);
      console.log(`  miss  ${slug}`);
      continue;
    }
    await writeFile(`${OUT_SVG}/${slug}.svg`, toFile(out), 'utf8');
    got.push(out);
    console.log(`  ok    ${slug}  <- ${out.source_url.split('/').pop()}`);
  }

  got.sort((a, b) => a.slug.localeCompare(b.slug));
  await writeFile(OUT_JSON, JSON.stringify(got, null, 2) + '\n', 'utf8');

  console.log(`\n${got.length} marks written, ${missed.length} without one.`);
  for (const m of missed) console.log(`  ${m.slug}: ${m.reason}`);
  if (!got.length) process.exitCode = 1;
}

main();

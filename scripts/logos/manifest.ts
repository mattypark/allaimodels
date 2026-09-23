/**
 * Where each lab's mark comes from.
 *
 * Two source families, both redistributable:
 *
 *   simple-icons  CC0-1.0, so the file can live in this repo. Candidates are
 *                 tried in order because the project renames icons between
 *                 releases and a lab can appear under its product name.
 *   wikimedia     Per-file licence, recorded alongside the mark.
 *
 * A lab with no entry, or whose every candidate 404s, gets no file. LabMark
 * then draws a monogram. A wrong logo is worse than no logo on a site whose
 * whole claim is that it does not guess.
 */

export type LogoSource =
  | { kind: 'simple-icons'; candidates: string[] }
  | { kind: 'wikimedia'; url: string; license: string };

export const LOGO_SOURCES: Record<string, LogoSource> = {
  anthropic:         { kind: 'simple-icons', candidates: ['anthropic', 'claude'] },
  openai:            { kind: 'simple-icons', candidates: ['openai'] },
  'google-deepmind': { kind: 'simple-icons', candidates: ['googledeepmind', 'googlegemini'] },
  meta:              { kind: 'simple-icons', candidates: ['meta'] },
  mistral:           { kind: 'simple-icons', candidates: ['mistralai'] },
  deepseek:          { kind: 'simple-icons', candidates: ['deepseek'] },
  qwen:              { kind: 'simple-icons', candidates: ['qwen', 'alibabadotcom', 'alibabacloud'] },
  xai:               { kind: 'simple-icons', candidates: ['xai', 'x'] },
  microsoft:         { kind: 'simple-icons', candidates: ['microsoft'] },
  amazon:            { kind: 'simple-icons', candidates: ['amazonwebservices', 'amazon'] },
  nvidia:            { kind: 'simple-icons', candidates: ['nvidia'] },
  cohere:            { kind: 'simple-icons', candidates: ['cohere'] },
  perplexity:        { kind: 'simple-icons', candidates: ['perplexity'] },
  baidu:             { kind: 'simple-icons', candidates: ['baidu'] },
  huggingface:       { kind: 'simple-icons', candidates: ['huggingface'] },
  moonshot:          { kind: 'simple-icons', candidates: ['moonshotai', 'kimi'] },
  minimax:           { kind: 'simple-icons', candidates: ['minimax'] },

  // Not in simple-icons. Wikimedia has these two under a free licence, resolved
  // through en.wikipedia.org because commons.wikimedia.org is unreachable from
  // this network (see docs/RESEARCH.md on the TLS filter).
  ai2: {
    kind: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Allen_Institute_for_Artificial_Intelligence.svg',
    license: 'Public domain',
  },
  inflection: {
    kind: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Inflection_AI_Logo.svg',
    license: 'Public domain',
  },

  // Deliberately absent, and they stay absent until a free mark exists:
  //   cohere — Wikipedia holds its logo as Fair use, which cannot ship here
  //   zhipu  — no free SVG found under Zhipu AI, Z.ai, ChatGLM or GLM
  //   reka   — no free SVG found
  // LabMark draws a monogram for each. A wrong mark is worse than no mark.
};

export const SIMPLE_ICONS_LICENSE = 'CC0-1.0';

/**
 * Unpinned on purpose. jsDelivr serves `simple-icons@latest` but 404s every
 * exact-version path for this package — `@16.32.0/icons/openai.svg` is a 404
 * while `@latest/icons/openai.svg` is a 200, for every icon tried. Pinning the
 * URL would mean fetching nothing.
 *
 * Reproducibility lives in the artifact instead: the mark is committed, and
 * data/logos.json records the exact URL and the date it was read. A refetch
 * that changes a mark shows up as a diff, which is the point.
 */
export const SIMPLE_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons';

export function simpleIconUrl(slug: string) {
  return `${SIMPLE_ICONS_BASE}/${slug}.svg`;
}

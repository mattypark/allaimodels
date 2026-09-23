import { get } from '../lib/fetch.ts';
import type { SourceResult, Finding } from '../lib/types.ts';

const URL = 'https://platform.claude.com/docs/en/about-claude/models/overview.md';

/**
 * Anthropic's docs serve a `.md` twin of every page: 17KB of clean markdown
 * against 389KB of app-shell HTML. Reading that instead of the rendered page
 * removes the entire class of breakage where a CSS refactor silently changes
 * what a selector matches.
 *
 * The comparison table is transposed — features run down the first column and
 * each model is a column — so it is parsed into feature -> per-model values.
 */

function parseTable(md: string): { models: string[]; rows: Map<string, string[]> } | null {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^\|\s*Feature\s*\|/i.test(l));
  if (start === -1) return null;

  const cells = (line: string) =>
    line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

  const header = cells(lines[start]);
  const models = header.slice(1);
  const rows = new Map<string, string[]>();

  for (let i = start + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) break;
    const c = cells(line);
    // Strip markdown links: "[Pricing](url)" -> "Pricing"
    const label = c[0].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
    rows.set(label, c.slice(1));
  }
  return { models, rows };
}

/** "Claude Opus 5.5" -> "opus-5-5", matching our file names. */
function toId(name: string): string {
  return name
    .replace(/^Claude\s+/i, '')
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function tokens(text: string): number | null {
  const m = text.match(/([\d.]+)\s*([MK])\s*tokens/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2].toUpperCase() === 'M' ? n * 1_000_000 : n * 1000;
}

export async function scrapeAnthropic(): Promise<SourceResult> {
  const res = await get(URL);
  if (!res.ok) {
    return { source: 'anthropic-docs', ok: false, reason: res.reason, findings: [], notes: [] };
  }

  const table = parseTable(res.body);
  if (!table) {
    // Layout changed. Report it; do not improvise a parser.
    return {
      source: 'anthropic-docs',
      ok: false,
      reason: 'could not locate the model comparison table — page layout changed',
      findings: [],
      notes: [],
    };
  }

  const findings: Finding[] = [];
  const notes: string[] = [];

  table.models.forEach((name, i) => {
    const id = toId(name);
    const at = (label: string) => table.rows.get(label)?.[i]?.trim() ?? '';

    const ctx = tokens(at('Context window'));
    if (ctx) findings.push({ lab: 'anthropic', modelId: id, field: 'context.input_tokens', value: ctx, sourceUrl: URL });

    const out = tokens(at('Max output'));
    if (out) findings.push({ lab: 'anthropic', modelId: id, field: 'context.output_tokens', value: out, sourceUrl: URL });

    const price = at('Pricing').match(/\$([\d.]+)\s*\/\s*input MTok,\s*\$([\d.]+)\s*\/\s*output MTok/i);
    if (price) {
      findings.push({ lab: 'anthropic', modelId: id, field: 'pricing.input_per_mtok', value: parseFloat(price[1]), sourceUrl: URL });
      findings.push({ lab: 'anthropic', modelId: id, field: 'pricing.output_per_mtok', value: parseFloat(price[2]), sourceUrl: URL });
    }

    const apiId = at('Claude API ID').replace(/`/g, '');
    if (apiId) findings.push({ lab: 'anthropic', modelId: id, field: 'api_ids.claude-api', value: apiId, sourceUrl: URL });

    const cutoff = at('Reliable knowledge cutoff');
    if (cutoff) findings.push({ lab: 'anthropic', modelId: id, field: 'knowledge_cutoff', value: cutoff, sourceUrl: URL });

    const retire = at('Retirement').match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
    if (retire) {
      const d = new Date(retire[1]);
      if (!Number.isNaN(d.getTime())) {
        findings.push({
          lab: 'anthropic',
          modelId: id,
          field: 'retirement_not_before',
          value: d.toISOString().slice(0, 10),
          sourceUrl: URL,
        });
      }
    }
  });

  // Legacy models are named in prose below the table, not in it.
  const legacy = [...res.body.matchAll(/\[Claude ([^\]]+)\]\(https:\/\/platform\.claude\.com\/docs\/en\/models\//g)].map(
    (m) => m[1],
  );
  const known = new Set(table.models.map(toId));
  const unknownLegacy = [...new Set(legacy.map(toId))].filter((id) => !known.has(id));
  if (unknownLegacy.length) {
    notes.push(`also linked as legacy: ${unknownLegacy.join(', ')}`);
  }

  notes.push(`${table.models.length} current models in the comparison table`);
  return { source: 'anthropic-docs', ok: true, findings, notes };
}

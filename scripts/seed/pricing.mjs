/**
 * Attach a price and a context window to every model we can match.
 *
 * Source is OpenRouter's public catalogue, which lists both for ~450 models
 * across every lab indexed here. That matters because the labs' own pages are
 * not uniformly readable — docs/RESEARCH.md already records OpenAI's pricing
 * page returning 403 — and because an open-weight model has no list price from
 * its lab at all, only what a host charges to serve it.
 *
 * The honest caveat, recorded on every figure rather than in a footnote:
 * OpenRouter is a reseller. Its price usually mirrors the lab's own, but it is
 * not the lab's own page, so source_type is 'third-party' and pricing.notes
 * says whose price it is. Anywhere a lab's own figure is already present, that
 * one wins and this script leaves it alone.
 *
 *   node --experimental-strip-types scripts/seed/pricing.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { getJson } from '../scrape/lib/fetch.ts';

const CATALOGUE = 'https://openrouter.ai/api/v1/models';

/** OpenRouter's vendor prefix -> our lab slug. */
const VENDORS = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google-deepmind',
  'meta-llama': 'meta',
  meta: 'meta',
  mistralai: 'mistral',
  deepseek: 'deepseek',
  qwen: 'qwen',
  'x-ai': 'xai',
  microsoft: 'microsoft',
  amazon: 'amazon',
  nvidia: 'nvidia',
  cohere: 'cohere',
  allenai: 'ai2',
  moonshotai: 'moonshot',
  'z-ai': 'zhipu',
  minimax: 'minimax',
  perplexity: 'perplexity',
  inflection: 'inflection',
  baidu: 'baidu',
};

const norm = (s) =>
  s
    .toLowerCase()
    .split(':')[0] // ":free", ":thinking" are serving variants of one model
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * The two catalogues name the same weights differently, so an exact match on
 * the normalised slug found under a fifth of them. Hugging Face carries the
 * repo name — "Qwen3-235B-A22B-Instruct-2507" — while OpenRouter carries a
 * product slug — "qwen3-235b-a22b-2507". The difference is almost always a
 * trailing word that describes the variant rather than the model, or a
 * release stamp.
 *
 * So each side generates a small set of keys, progressively stripped, and a
 * match is any shared key. Stripping is suffix-only and from a closed list:
 * dropping arbitrary tokens would start matching a 7B to a 70B.
 */
const VARIANT_WORDS = new Set([
  'instruct', 'instructed', 'chat', 'it', 'hf', 'base', 'preview', 'latest',
  'v1', 'v01', 'fp8', 'bf16', 'thinking', 'reasoning', 'nonreasoning',
]);

function keys(raw) {
  const out = new Set();
  let parts = norm(raw).split('-').filter(Boolean);
  out.add(parts.join('-'));

  // Strip trailing variant words, one at a time, keeping every step.
  while (parts.length > 1 && VARIANT_WORDS.has(parts[parts.length - 1])) {
    parts = parts.slice(0, -1);
    out.add(parts.join('-'));
  }

  // Then the same again without a trailing release stamp (2507, 0731, 20250114).
  let dated = [...parts];
  if (dated.length > 1 && /^\d{4,8}$/.test(dated[dated.length - 1])) {
    dated = dated.slice(0, -1);
    out.add(dated.join('-'));
    while (dated.length > 1 && VARIANT_WORDS.has(dated[dated.length - 1])) {
      dated = dated.slice(0, -1);
      out.add(dated.join('-'));
    }
  }

  out.delete('');
  return [...out];
}

const res = await getJson(CATALOGUE);
if (!res.ok) {
  console.error(`  catalogue unreachable: ${res.reason}`);
  console.error('  Nothing written. A price that cannot be read is not a price.');
  process.exit(1);
}

/** lab -> normalised model slug -> the catalogue row. */
const byLab = new Map();
for (const row of res.data.data) {
  const [vendor, ...rest] = row.id.split('/');
  const lab = VENDORS[vendor];
  if (!lab || !rest.length) continue;
  if (!byLab.has(lab)) byLab.set(lab, new Map());
  // First listing wins: the catalogue is newest-first, and a later duplicate is
  // an older serving variant of the same weights. Indexed under every key so a
  // lookup from either naming convention finds it.
  for (const key of keys(rest.join('-'))) {
    if (!byLab.get(lab).has(key)) byLab.get(lab).set(key, row);
  }
}

const today = new Date().toISOString().slice(0, 10);
let priced = 0;
let contexted = 0;
let kept = 0;
let seen = 0;

for (const lab of await readdir('data/models')) {
  const rows = byLab.get(lab);
  if (!rows) continue;

  for (const file of await readdir(`data/models/${lab}`)) {
    if (!file.endsWith('.json')) continue;
    seen += 1;

    const path = `data/models/${lab}/${file}`;
    const model = JSON.parse(await readFile(path, 'utf8'));
    let row;
    for (const key of [...keys(model.id), ...keys(model.name)]) {
      row = rows.get(key);
      if (row) break;
    }
    if (!row) continue;

    let touched = false;

    // A figure already sourced to the lab itself is better than a reseller's.
    if (model.pricing) {
      kept += 1;
    } else if (row.pricing?.prompt && row.pricing?.completion) {
      const input = Number(row.pricing.prompt) * 1e6;
      const output = Number(row.pricing.completion) * 1e6;
      if (Number.isFinite(input) && Number.isFinite(output)) {
        model.pricing = {
          input_per_mtok: Number(input.toFixed(4)),
          output_per_mtok: Number(output.toFixed(4)),
          currency: 'USD',
          notes:
            `Listed by OpenRouter as ${row.id}, read ${today}. This is a reseller's ` +
            `price, not the lab's own page` +
            (model.open_weights ? ', and an open-weight model has no list price from its lab.' : '.'),
        };
        priced += 1;
        touched = true;
      }
    }

    if (!model.context && Number.isFinite(row.context_length) && row.context_length > 0) {
      model.context = {
        input_tokens: row.context_length,
        tokenizer_note: `Context as served by OpenRouter for ${row.id}, read ${today}.`,
      };
      contexted += 1;
      touched = true;
    }

    if (touched) {
      const page = `https://openrouter.ai/${row.id}`;
      if (!model.sources.includes(page)) model.sources.push(page);
      await writeFile(path, JSON.stringify(model, null, 2) + '\n', 'utf8');
    }
  }
}

console.log(`  ${seen} models on disk`);
console.log(`  ${priced} given a price, ${contexted} given a context window`);
console.log(`  ${kept} already had a price from their own lab and were left alone`);

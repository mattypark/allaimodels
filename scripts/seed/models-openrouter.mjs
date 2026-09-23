/**
 * Seed the closed labs from OpenRouter's public catalogue.
 *
 * Hugging Face covers the open-weight half of the field and nothing else, so
 * after that pass OpenAI had eight models and Google had its curated handful.
 * OpenRouter lists what is actually servable — 99 OpenAI models, 41 Google, 28
 * Anthropic — each with a price and a context window, which is exactly the
 * data the comparison table exists to show.
 *
 * Two things are recorded rather than smoothed over:
 *
 *   `created` is when OpenRouter listed the model, not when the lab announced
 *   it, so every date here is date_precision 'observed'. It is usually within
 *   days of the announcement and occasionally is not.
 *
 *   The price is a reseller's. It usually mirrors the lab's own page, but it
 *   is not that page, so pricing.notes says so on every figure.
 *
 * A model already on disk is never overwritten — a file sourced to the lab's
 * own docs beats one sourced to a marketplace.
 *
 *   node --experimental-strip-types scripts/seed/models-openrouter.mjs
 */

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { getJson } from '../scrape/lib/fetch.ts';

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

const slug = (s) =>
  s.toLowerCase().split(':')[0].replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The part before the first number, same rule the Hugging Face seeder uses. */
function family(name) {
  const head = name.split(/[-_. ]/).find((p) => p && !/\d/.test(p));
  return head || name.split(/[-_. ]/)[0];
}

function modalities(row) {
  const input = row?.architecture?.input_modalities ?? ['text'];
  const output = row?.architecture?.output_modalities ?? ['text'];
  const allowedIn = new Set(['text', 'image', 'audio', 'video', 'pdf']);
  const allowedOut = new Set(['text', 'image', 'audio', 'video', 'embedding']);
  const keep = (xs, allow) => {
    const out = xs.filter((m) => allow.has(m));
    return out.length ? out : ['text'];
  };
  return { input: keep(input, allowedIn), output: keep(output, allowedOut) };
}

const res = await getJson('https://openrouter.ai/api/v1/models');
if (!res.ok) {
  console.error(`  catalogue unreachable: ${res.reason}. Nothing written.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const MONTH = 30 * 24 * 60 * 60 * 1000;
const now = Date.now();

// What is already on disk, so nothing sourced to a lab's own docs is replaced.
const existing = new Map();
for (const lab of await readdir('data/models')) {
  existing.set(lab, new Set((await readdir(`data/models/${lab}`)).map((f) => f.replace(/\.json$/, ''))));
}

const added = new Map();

for (const row of res.data.data) {
  const [vendor, ...rest] = row.id.split('/');
  const lab = VENDORS[vendor];
  if (!lab || !rest.length) continue;

  const id = slug(rest.join('-'));
  if (!id) continue;
  if (!existing.has(lab)) existing.set(lab, new Set());
  if (existing.get(lab).has(id)) continue;
  existing.get(lab).add(id);

  const createdMs = Number(row.created) * 1000;
  if (!Number.isFinite(createdMs) || createdMs <= 0) continue;
  const released = new Date(createdMs).toISOString().slice(0, 10);
  const page = `https://openrouter.ai/${row.id}`;
  const name = (row.name ?? '').split(':').slice(1).join(':').trim() || rest.join('/');

  const model = {
    id,
    lab,
    name,
    family: family(name),
    status: now - createdMs < 18 * MONTH ? 'current' : 'legacy',
    released,
    date_precision: 'observed',
    summary:
      `${name}, listed ${released} on OpenRouter. The date is when it appeared there, ` +
      `not when the lab announced it.`,
    api_ids: { openrouter: row.id },
    modalities: modalities(row),
    open_weights: false,
    links: {},
    benchmarks: [],
    sources: [page],
  };

  if (Number.isFinite(row.context_length) && row.context_length > 0) {
    model.context = {
      input_tokens: row.context_length,
      tokenizer_note: `Context as served by OpenRouter for ${row.id}, read ${today}.`,
    };
  }

  const input = Number(row.pricing?.prompt) * 1e6;
  const output = Number(row.pricing?.completion) * 1e6;
  if (Number.isFinite(input) && Number.isFinite(output) && (input > 0 || output > 0)) {
    model.pricing = {
      input_per_mtok: Number(input.toFixed(4)),
      output_per_mtok: Number(output.toFixed(4)),
      currency: 'USD',
      notes: `Listed by OpenRouter as ${row.id}, read ${today}. This is a reseller's price, not the lab's own page.`,
    };
  }

  await mkdir(`data/models/${lab}`, { recursive: true });
  await writeFile(`data/models/${lab}/${id}.json`, JSON.stringify(model, null, 2) + '\n', 'utf8');
  added.set(lab, (added.get(lab) ?? 0) + 1);
}

const total = [...added.values()].reduce((a, b) => a + b, 0);
for (const [lab, n] of [...added].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${lab.padEnd(18)} +${n}`);
}
console.log(`\n${total} models added from the catalogue.`);

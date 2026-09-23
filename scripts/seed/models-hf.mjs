/**
 * Seed open-weight models from the Hugging Face public API.
 *
 * This is where most of the roster comes from, and it is the only large source
 * where every release date is genuinely readable: `createdAt` is when the repo
 * was published, so no date here is inferred.
 *
 * Two honest limitations, both encoded rather than hidden:
 *
 *   date_precision: 'observed'  — the date is read off a listing, not an
 *   announcement, so it is the day the weights appeared rather than the day
 *   the lab said so. The schema already has a word for that.
 *
 *   status: 'current' | 'legacy' — open weights are never really retired, so
 *   "current" here means published within the last 18 months and nothing more.
 *   Closed models get a real status from their lab's own docs instead.
 *
 * Quantisations, adapters and format conversions are dropped: they are the
 * same model repackaged, and counting them would inflate the roster with
 * duplicates. Only text and multimodal generation is kept.
 *
 *   node --experimental-strip-types scripts/seed/models-hf.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { getJson } from '../scrape/lib/fetch.ts';

/** Hugging Face org -> the lab slug in data/labs. */
const ORGS = {
  'meta-llama': 'meta',
  mistralai: 'mistral',
  'deepseek-ai': 'deepseek',
  Qwen: 'qwen',
  microsoft: 'microsoft',
  nvidia: 'nvidia',
  allenai: 'ai2',
  moonshotai: 'moonshot',
  'zai-org': 'zhipu',
  MiniMaxAI: 'minimax',
  CohereLabs: 'cohere',
  baidu: 'baidu',
  'xai-org': 'xai',
  'perplexity-ai': 'perplexity',
  google: 'google-deepmind',
  'openai-community': 'openai',
};

/** Per org, so a prolific lab does not swamp the index. */
const PER_ORG = 30;

const KEEP_PIPELINE = new Set([
  'text-generation',
  'text2text-generation',
  'image-text-to-text',
  'video-text-to-text',
  'any-to-any',
]);

/** Real models, but not the kind this site indexes. */
const REJECT_PIPELINE = new Set([
  'automatic-speech-recognition',
  'text-to-speech',
  'text-to-audio',
  'text-to-image',
  'text-to-video',
  'image-classification',
  'object-detection',
  'image-segmentation',
  'depth-estimation',
  'feature-extraction',
  'sentence-similarity',
  'fill-mask',
  'token-classification',
  'text-classification',
  'audio-classification',
  'translation',
  'summarization',
  'robotics',
  'reinforcement-learning',
]);

/**
 * Hugging Face leaves pipeline_tag null on a lot of repos — most of Mistral's
 * lineup, for one — so a strict allow-list on it silently drops real models.
 * Fall back to the tag list, and when that is silent too, keep the repo: the
 * org filter already means it is a lab's own model.
 */
function isIndexable(m) {
  if (m.pipeline_tag) return KEEP_PIPELINE.has(m.pipeline_tag);
  const tags = new Set(m.tags ?? []);
  for (const t of REJECT_PIPELINE) if (tags.has(t)) return false;
  for (const t of KEEP_PIPELINE) if (tags.has(t)) return true;
  // No task declared anywhere. A dataset or a space would not be in this
  // endpoint, so what is left is a model whose card is simply thin.
  return true;
}

/** The same model repackaged, not another model. */
const REPACKAGED =
  /(gguf|awq|gptq|bnb|mlx|exl2|onnx|openvino|tensorrt|nf4|-int[48]\b|-fp8\b|-w[48]a|[-_.]\d+bit\b|quant|lora|adapter|draft|distill-quant)/i;

const MONTH = 30 * 24 * 60 * 60 * 1000;

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function modalities(pipeline, tags) {
  const t = new Set(tags ?? []);
  const input = ['text'];
  const vision = pipeline === 'image-text-to-text' || t.has('image-text-to-text');
  const video = pipeline === 'video-text-to-text' || t.has('video-text-to-text');
  const any = pipeline === 'any-to-any' || t.has('any-to-any');
  if (vision || video || any) input.push('image');
  if (video) input.push('video');
  if (any) input.push('audio');
  return { input: [...new Set(input)], output: ['text'] };
}

/** "Llama-3.1-8B-Instruct" -> "Llama". The family is the part before the first number. */
function family(name) {
  const head = name.split(/[-_.]/).find((p) => p && !/\d/.test(p));
  return head || name.split(/[-_.]/)[0];
}

async function seedOrg(org, lab) {
  const url =
    `https://huggingface.co/api/models?author=${encodeURIComponent(org)}` +
    `&sort=downloads&direction=-1&limit=200` +
    `&expand[]=createdAt&expand[]=downloads&expand[]=pipeline_tag&expand[]=tags`;

  const res = await getJson(url);
  if (!res.ok) return { lab, written: 0, reason: res.reason };

  const rows = res.data
    .filter(isIndexable)
    .filter((m) => !REPACKAGED.test(m.id))
    .filter((m) => m.createdAt)
    .slice(0, PER_ORG);

  await mkdir(`data/models/${lab}`, { recursive: true });

  const now = Date.now();
  let written = 0;
  const seen = new Set();

  for (const m of rows) {
    const repo = m.id.split('/').slice(1).join('/');
    const id = slugify(repo);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const released = m.createdAt.slice(0, 10);
    const age = now - new Date(m.createdAt).getTime();
    const page = `https://huggingface.co/${m.id}`;

    const model = {
      id,
      lab,
      name: repo,
      family: family(repo),
      status: age < 18 * MONTH ? 'current' : 'legacy',
      released,
      date_precision: 'observed',
      summary:
        `${repo}, published ${released} by ${org} on Hugging Face. ` +
        `Open weights. Specs beyond the release date are not yet sourced.`,
      api_ids: { huggingface: m.id },
      modalities: modalities(m.pipeline_tag, m.tags),
      open_weights: true,
      links: { weights: page },
      benchmarks: [],
      sources: [page],
    };

    await writeFile(`data/models/${lab}/${id}.json`, JSON.stringify(model, null, 2) + '\n', 'utf8');
    written += 1;
  }

  return { lab, written };
}

const results = [];
for (const [org, lab] of Object.entries(ORGS)) {
  const r = await seedOrg(org, lab);
  results.push({ org, ...r });
  console.log(`  ${r.reason ? 'miss' : 'ok  '}  ${org.padEnd(16)} -> ${lab.padEnd(18)} ${r.written}`);
}

const total = results.reduce((n, r) => n + r.written, 0);
console.log(`\n${total} open-weight models written.`);
for (const r of results.filter((x) => x.reason)) console.log(`  ${r.org}: ${r.reason}`);

/**
 * Seeds the Claude lineage from the research log.
 *
 * Current models carry full specs sourced from platform.claude.com. Legacy
 * models carry a release date and status only — everything else stays absent
 * rather than guessed, and the scraper fills them in later.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const DOCS = 'https://platform.claude.com/docs/en/about-claude/models/overview';
const WIKI = 'https://en.wikipedia.org/wiki/Claude_(language_model)';
const dir = 'data/models/anthropic';
mkdirSync(dir, { recursive: true });

const common = {
  lab: 'anthropic',
  modalities: { input: ['text', 'image'], output: ['text'] },
  open_weights: false,
};

const tokenizerNote =
  '1M tokens is roughly 555k words on the tokenizer introduced with Opus 4.7. Models before it fit about 750k words in the same window, so raw context numbers are not comparable across that boundary.';

const cacheNote =
  'Batch API requests are 50% off. Cache reads cost 10% of base input, except 2.5% on Fable 5.1 and Mythos 5.1 and 5% on Opus 5.5 — so effective price depends heavily on cache strategy.';

const current = [
  {
    id: 'opus-5-5', name: 'Claude Opus 5.5', family: 'Opus', released: '2026-09-22',
    summary: 'The first model in the 5.5 series. Anthropic positions it as the default for most work: it matches the far more expensive Fable on much agentic coding while costing $4 per million input tokens against Fable\'s $10.',
    api_ids: { 'claude-api': 'claude-opus-5-5', bedrock: 'anthropic.claude-opus-5-5', vertex: 'claude-opus-5-5', foundry: 'claude-opus-5-5' },
    context: { input_tokens: 1000000, output_tokens: 128000, tokenizer_note: tokenizerNote },
    pricing: { input_per_mtok: 4, output_per_mtok: 20, currency: 'USD', notes: cacheNote },
    knowledge_cutoff: 'Jun 2026', retirement_not_before: '2027-09-22',
    links: { docs: 'https://platform.claude.com/docs/en/models/opus-5-5/overview' },
    benchmarks: [
      { suite: 'swe-bench-pro', metric: 'resolved', value: 89.9, unit: 'percent', source_url: 'https://venturebeat.com/technology/anthropic-releases-claude-opus-5-5-beating-fable-5-1-on-key-agentic-benchmarks-at-60-cheaper-api-price', source_type: 'third-party', measured_on: '2026-09-22', comparable: false, harness_notes: 'Reported from Anthropic\'s launch table via press coverage. Not yet traced to the first-party model card, and scaffold details are unstated.' },
      { suite: 'terminal-bench', metric: 'resolved (v4.0)', value: 66.4, unit: 'percent', source_url: 'https://venturebeat.com/technology/anthropic-releases-claude-opus-5-5-beating-fable-5-1-on-key-agentic-benchmarks-at-60-cheaper-api-price', source_type: 'third-party', measured_on: '2026-09-22', comparable: false, harness_notes: 'Terminal-Bench 4.0. Not comparable with any 2.0 figure.' },
      { suite: 'aa-intelligence-index', metric: 'index', value: 58, unit: 'index', source_url: 'https://artificialanalysis.ai/leaderboards/models', source_type: 'third-party', measured_on: '2026-09-22', comparable: true, harness_notes: 'Run at max effort. Effort level changes this score.' },
      { suite: 'hle', metric: 'accuracy', value: 61.4, unit: 'percent', source_url: 'https://artificialanalysis.ai/leaderboards/models', source_type: 'third-party', measured_on: '2026-09-22', comparable: true },
      { suite: 'scicode', metric: 'accuracy', value: 66.9, unit: 'percent', source_url: 'https://artificialanalysis.ai/leaderboards/models', source_type: 'third-party', measured_on: '2026-09-22', comparable: true },
    ],
  },
  {
    id: 'fable-5-1', name: 'Claude Fable 5.1', family: 'Fable', released: '2026-09-01',
    summary: 'Anthropic\'s reasoning flagship, aimed at long-horizon agentic work and the cases where Opus at high effort still falls short. Thinking is adaptive and always on, and it is the most expensive model in the lineup by some distance.',
    api_ids: { 'claude-api': 'claude-fable-5-1', bedrock: 'anthropic.claude-fable-5-1', vertex: 'claude-fable-5-1', foundry: 'claude-fable-5-1' },
    context: { input_tokens: 1000000, output_tokens: 128000, tokenizer_note: tokenizerNote },
    pricing: { input_per_mtok: 10, output_per_mtok: 50, currency: 'USD', notes: cacheNote },
    knowledge_cutoff: 'Jun 2026', retirement_not_before: '2027-09-01',
    links: { docs: 'https://platform.claude.com/docs/en/models/fable-5-1/overview' },
    benchmarks: [
      { suite: 'lmarena-elo', metric: 'elo', value: 1762, unit: 'elo', source_url: 'https://en.wikipedia.org/wiki/Arena_(AI_platform)', source_type: 'third-party', measured_on: '2026-09-01', comparable: true, harness_notes: 'Reported as 73 points above Fable 5 on entry.' },
    ],
  },
  {
    id: 'sonnet-5', name: 'Claude Sonnet 5', family: 'Sonnet', released: '2026-06-30',
    summary: 'The balance point of the lineup — a million tokens of context at a fifth of Fable\'s price, which makes it the default for high-volume work that still needs frontier-adjacent quality.',
    api_ids: { 'claude-api': 'claude-sonnet-5', bedrock: 'anthropic.claude-sonnet-5', vertex: 'claude-sonnet-5', foundry: 'claude-sonnet-5' },
    context: { input_tokens: 1000000, output_tokens: 128000, tokenizer_note: tokenizerNote },
    pricing: { input_per_mtok: 2, output_per_mtok: 10, currency: 'USD', notes: cacheNote },
    knowledge_cutoff: 'Jan 2026', retirement_not_before: '2027-06-30',
    links: { docs: 'https://platform.claude.com/docs/en/models/sonnet-5/overview' },
  },
  {
    id: 'haiku-4-5', name: 'Claude Haiku 4.5', family: 'Haiku', released: '2025-10-15',
    summary: 'The fast one. A 200K window rather than a million and an older knowledge cutoff, traded for the lowest latency and price Anthropic offers.',
    api_ids: { 'claude-api': 'claude-haiku-4-5-20251001', bedrock: 'anthropic.claude-haiku-4-5', vertex: 'claude-haiku-4-5@20251001', foundry: 'claude-haiku-4-5' },
    context: { input_tokens: 200000, output_tokens: 64000 },
    pricing: { input_per_mtok: 1, output_per_mtok: 5, currency: 'USD', notes: cacheNote },
    knowledge_cutoff: 'Feb 2025', retirement_not_before: '2026-10-15',
    links: { docs: 'https://platform.claude.com/docs/en/models/haiku-4-5/overview' },
  },
];

// Release lineage. Only dates and status are claimed — see WIKI.
const lineage = [
  ['claude-1', 'Claude', 'Claude', '2023-03-14', 'retired'],
  ['claude-2', 'Claude 2', 'Claude', '2023-07-11', 'retired'],
  ['claude-instant-1-2', 'Claude Instant 1.2', 'Instant', '2023-08-09', 'retired'],
  ['claude-2-1', 'Claude 2.1', 'Claude', '2023-11-21', 'retired'],
  ['claude-3-opus', 'Claude 3 Opus', 'Opus', '2024-03-04', 'retired'],
  ['claude-3-sonnet', 'Claude 3 Sonnet', 'Sonnet', '2024-03-04', 'retired'],
  ['claude-3-haiku', 'Claude 3 Haiku', 'Haiku', '2024-03-13', 'retired'],
  ['claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'Sonnet', '2024-06-20', 'retired'],
  ['claude-3-5-sonnet-new', 'Claude 3.5 Sonnet (new)', 'Sonnet', '2024-10-22', 'retired'],
  ['claude-3-5-haiku', 'Claude 3.5 Haiku', 'Haiku', '2024-10-22', 'retired'],
  ['claude-3-7-sonnet', 'Claude 3.7 Sonnet', 'Sonnet', '2025-02-24', 'retired'],
  ['sonnet-4', 'Claude Sonnet 4', 'Sonnet', '2025-05-22', 'retired'],
  ['opus-4', 'Claude Opus 4', 'Opus', '2025-05-22', 'retired'],
  ['opus-4-1', 'Claude Opus 4.1', 'Opus', '2025-08-05', 'retired'],
  ['sonnet-4-5', 'Claude Sonnet 4.5', 'Sonnet', '2025-09-29', 'legacy'],
  ['opus-4-5', 'Claude Opus 4.5', 'Opus', '2025-11-24', 'legacy'],
  ['opus-4-6', 'Claude Opus 4.6', 'Opus', '2026-02-05', 'legacy'],
  ['sonnet-4-6', 'Claude Sonnet 4.6', 'Sonnet', '2026-02-17', 'legacy'],
  ['mythos-preview', 'Claude Mythos Preview', 'Mythos', '2026-04-07', 'preview'],
  ['opus-4-7', 'Claude Opus 4.7', 'Opus', '2026-04-16', 'legacy'],
  ['opus-4-8', 'Claude Opus 4.8', 'Opus', '2026-05-28', 'legacy'],
  ['mythos-5', 'Claude Mythos 5', 'Mythos', '2026-06-09', 'preview'],
  ['fable-5', 'Claude Fable 5', 'Fable', '2026-06-09', 'legacy'],
  ['opus-5', 'Claude Opus 5', 'Opus', '2026-07-24', 'legacy'],
  ['mythos-5-1', 'Claude Mythos 5.1', 'Mythos', '2026-09-01', 'preview'],
];

const summaries = {
  'mythos-preview': 'The first public sighting of the Mythos family, released to limited availability.',
  'mythos-5': 'Limited-availability Mythos release, shipped the same day as Fable 5.',
  'mythos-5-1': 'Limited availability. Anthropic\'s Opus 5.5 containment evaluation uses Mythos 5.1 as one of its two baselines.',
  'opus-4-7': 'Introduced the current tokenizer, which is why context-window figures before and after this model are not directly comparable.',
};

const files = [];

for (const m of current) {
  files.push({
    ...common, ...m, status: 'current',
    links: m.links ?? {}, benchmarks: m.benchmarks ?? [],
    sources: [DOCS, WIKI],
  });
}

for (const [id, name, family, released, status] of lineage) {
  files.push({
    ...common, id, name, family, released, status,
    summary: summaries[id] ?? `${name}, released ${released}. Specs beyond the release date are not yet sourced.`,
    api_ids: {}, links: {}, benchmarks: [], sources: [WIKI],
  });
}

for (const f of files) {
  writeFileSync(`${dir}/${f.id}.json`, JSON.stringify(f, null, 2) + '\n');
}
console.log(`wrote ${files.length} Anthropic model files`);

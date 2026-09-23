import { writeFileSync, mkdirSync } from 'node:fs';

const GPT_WIKI = 'https://en.wikipedia.org/wiki/GPT-5.5';
const GEM_DOCS = 'https://ai.google.dev/gemini-api/docs/models';
const GEM_WIKI = 'https://en.wikipedia.org/wiki/Gemini_(language_model)';

const text = { input: ['text', 'image'], output: ['text'] };

const openai = [
  {
    id: 'gpt-5-5', lab: 'openai', name: 'GPT-5.5', family: 'GPT-5', status: 'current',
    released: '2026-04-23',
    summary: 'Shipped under the internal codename "Spud" across Thinking and Pro tiers, with an Instant variant reaching the free tier two weeks later and a restricted Cyber preview after that.',
    modalities: text, open_weights: false, api_ids: {}, links: {},
    benchmarks: [
      { suite: 'terminal-bench', metric: 'resolved (v2.0)', value: 82.7, unit: 'percent', source_url: GPT_WIKI, source_type: 'third-party', measured_on: '2026-04-23', comparable: false, harness_notes: 'Terminal-Bench 2.0 — a different task set from the 4.0 figures other labs now report.' },
      { suite: 'frontiermath', metric: 'accuracy (Tier 1-3)', value: 51.7, unit: 'percent', source_url: GPT_WIKI, source_type: 'third-party', measured_on: '2026-04-23', comparable: true },
      { suite: 'frontiermath', metric: 'accuracy (Tier 4)', value: 35.4, unit: 'percent', source_url: GPT_WIKI, source_type: 'third-party', measured_on: '2026-04-23', comparable: true, harness_notes: 'Tier 4 is substantially harder than Tiers 1-3; the two figures are not interchangeable.' },
    ],
    sources: [GPT_WIKI],
  },
  ...[
    ['gpt-5-5-instant', 'GPT-5.5 Instant', '2026-05-05', 'Free-tier variant of GPT-5.5.'],
    ['gpt-5-5-cyber', 'GPT-5.5-Cyber', '2026-05-07', 'Limited preview. OpenAI scored it at 71.4% (±8.0) on AI Security Institute cyber tasks.'],
  ].map(([id, name, released, summary]) => ({
    id, lab: 'openai', name, family: 'GPT-5', status: 'current', released, summary,
    modalities: text, open_weights: false, api_ids: {}, links: {}, benchmarks: [], sources: [GPT_WIKI],
  })),
];

const gemini = [
  ['gemini-3-8-flash', 'Gemini 3.8 Flash', '2026-09-02', 'current', 'Google\'s current workhorse, aimed at long-horizon software engineering and autonomous agents.', 'gemini-3.8-flash'],
  ['gemini-3-8-live', 'Gemini 3.8 Live', '2026-09-02', 'current', 'Low-latency voice agents and real-time dialogue.', 'gemini-3.8-live'],
  ['gemini-3-7-flash', 'Gemini 3.7 Flash', null, 'current', 'Complex coding and agentic workflows. Release date not yet sourced.', 'gemini-3.7-flash'],
  ['gemini-3-6-flash', 'Gemini 3.6 Flash', null, 'current', 'Speed and multimodal breadth. Release date not yet sourced.', 'gemini-3.6-flash'],
  ['gemini-3-5-flash', 'Gemini 3.5 Flash', null, 'current', 'High-throughput baseline. Release date not yet sourced.', 'gemini-3.5-flash'],
  ['gemini-3-pro', 'Gemini 3 Pro', '2025-11-18', 'legacy', 'A one-million-token input window, and the last Pro-tier Gemini with a confirmed release date.', null],
  ['gemini-2-5-pro', 'Gemini 2.5 Pro', '2025-03-25', 'legacy', 'Topped the LMArena leaderboard on release.', null],
  ['gemini-2-5-flash', 'Gemini 2.5 Flash', '2025-04-17', 'legacy', '', null],
  ['gemini-2-0-flash', 'Gemini 2.0 Flash', '2025-01-30', 'legacy', '', null],
  ['gemini-2-0-pro', 'Gemini 2.0 Pro', '2025-02-05', 'legacy', '', null],
  ['gemini-2-0-flash-lite', 'Gemini 2.0 Flash-Lite', '2025-02-25', 'legacy', '', null],
  ['gemini-1-5-pro', 'Gemini 1.5 Pro', '2024-02-15', 'retired', 'The model that made million-token context windows ordinary.', null],
  ['gemini-1-5-flash', 'Gemini 1.5 Flash', '2024-05-14', 'retired', '', null],
  ['gemini-1-0-ultra', 'Gemini 1.0 Ultra', '2024-02-08', 'retired', 'Google reported it as the first model to outperform human experts on the 57-subject MMLU.', null],
  ['gemini-1-0-pro', 'Gemini 1.0 Pro', '2023-12-13', 'retired', '', null],
  ['gemini-1-0-nano', 'Gemini 1.0 Nano', '2023-12-06', 'retired', 'On-device Gemini, 32,768-token context.', null],
].map(([id, name, released, status, summary, apiId]) => {
  const m = {
    id, lab: 'google-deepmind', name, family: name.includes('Flash') ? 'Gemini Flash' : 'Gemini Pro',
    status,
    // No announced date: record the day we first observed it listed, and say so.
    released: released ?? '2026-09-23',
    date_precision: released ? 'exact' : 'observed',
    summary: summary || `${name}. Specs beyond the release date are not yet sourced.`,
    modalities: text, open_weights: false,
    api_ids: apiId ? { 'gemini-api': apiId } : {},
    links: {}, benchmarks: [], sources: released ? [GEM_WIKI, GEM_DOCS] : [GEM_DOCS],
  };
  if (!released) {
    m.summary +=
      ' No release date announced on the docs page; the date shown is when this index first observed the model listed.';
  }
  return m;
});

gemini[13].benchmarks = [
  { suite: 'hle', metric: 'MMLU (57-subject)', value: 90, unit: 'percent', source_url: GEM_WIKI, source_type: 'third-party', measured_on: '2024-02-08', comparable: false, harness_notes: 'MMLU, not HLE — recorded here only until a dedicated MMLU suite exists. Historical figure on a now-saturated benchmark.' },
];

mkdirSync('data/models/openai', { recursive: true });
mkdirSync('data/models/google-deepmind', { recursive: true });
for (const m of openai) writeFileSync(`data/models/openai/${m.id}.json`, JSON.stringify(m, null, 2) + '\n');
for (const m of gemini) writeFileSync(`data/models/google-deepmind/${m.id}.json`, JSON.stringify(m, null, 2) + '\n');
console.log(`wrote ${openai.length} OpenAI + ${gemini.length} Gemini model files`);

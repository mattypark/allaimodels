# Research log — ground truth as of 2026-09-23

Every fact here carries the URL it came from. Anything unsourced does not ship.
This file is the input to `data/**`; it is not itself the data.

## Method

Claude's training cutoff is June 2026. Today is 2026-09-23. Nothing in this file
comes from model memory — each row was fetched from a live page during this pass.

---

## Source reliability, measured not assumed

| Source | Status | Notes |
|---|---|---|
| `platform.claude.com/docs` | **OK** | Best-in-class: model IDs, context, pricing, cutoffs, retirement dates, all in one table |
| `ai.google.dev/gemini-api/docs/models` | **OK, partial** | Model IDs + capabilities; context windows absent from the page |
| `en.wikipedia.org` | **OK** | Strong for release-date lineage; weak/absent for benchmarks and pricing |
| `openai.com/api/pricing` | **BLOCKED — HTTP 403** | Needs a different route (docs mirror or third-party aggregator) |
| `artificialanalysis.ai` | **BLOCKED — TLS interception** | `Host: artificialanalysis.ai is not in cert's altnames: DNS:blocked.com-default.ws` — this network filters it |

Two of five primary sources are unreachable on the first attempt. That is the
argument for fail-closed scrapers: a blocked source must leave old data intact and
report itself, never silently write a guess.

---

## Anthropic — verified

Source: https://platform.claude.com/docs/en/about-claude/models/overview (fetched 2026-09-23)

### Current lineup

| Model | API ID | Context | Max output | Price in/out per MTok | Knowledge cutoff | Retirement not before |
|---|---|---|---|---|---|---|
| Claude Fable 5.1 | `claude-fable-5-1` | 1M | 128K | $10 / $50 | Jun 2026 | 2027-09-01 |
| Claude Opus 5.5 | `claude-opus-5-5` | 1M | 128K | $4 / $20 | Jun 2026 | 2027-09-22 |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | 128K | $2 / $10 | Jan 2026 | 2027-06-30 |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | 200K | 64K | $1 / $5 | Feb 2025 | 2026-10-15 |

Notes worth surfacing on the site, straight from the docs:
- Batch API is 50% off. Cache reads are 10% of base input — but **2.5% on Fable 5.1
  and Mythos 5.1, 5% on Opus 5.5**. Effective price depends on cache strategy, so a
  single "price" number is already a simplification.
- 1M tokens ≈ 555k words on the tokenizer introduced with Opus 4.7. Models before it
  fit ~750k words in 1M tokens. **Context windows are not comparable across
  tokenizer generations** — exactly the kind of footnote this site exists to keep.
- Batch API supports 300k output tokens on Opus 5.5 / Opus 5 / Sonnet 5 / Opus 4.8 /
  4.7 / 4.6 / Sonnet 4.6 via the `output-300k-2026-03-24` beta header.
- Legacy but still available: Fable 5, Opus 5, Opus 4.8, 4.7, 4.6, 4.5, Sonnet 4.6, 4.5.

### Full release lineage

Source: https://en.wikipedia.org/wiki/Claude_(language_model) (fetched 2026-09-23)

2023: Claude (03-14) · Claude 2 (07-11) · Instant 1.2 (08-09) · Claude 2.1 (11-21)
2024: 3 Sonnet + 3 Opus (03-04) · 3 Haiku (03-13) · 3.5 Sonnet (06-20) · 3.5 Sonnet new + 3.5 Haiku (10-22)
2025: 3.7 Sonnet (02-24) · Sonnet 4 + Opus 4 (05-22) · Opus 4.1 (08-05) · Sonnet 4.5 (09-29) · Haiku 4.5 (10-15) · Opus 4.5 (11-24)
2026: Opus 4.6 (02-05) · Sonnet 4.6 (02-17) · **Mythos Preview (04-07)** · Opus 4.7 (04-16) · Opus 4.8 (05-28) · **Mythos 5 + Fable 5 (06-09)** · Sonnet 5 (06-30) · Opus 5 (07-24) · **Mythos 5.1 + Fable 5.1 (09-01)** · Opus 5.5 (09-22)

**Mythos resolved.** It is an Anthropic family, limited availability, three releases
(Preview / 5 / 5.1). It has its own Wikipedia article. It was an open question in the
plan; it is now a confirmed Tier-1 family and gets a lane on the timeline.

### Opus 5.5 launch benchmarks — needs primary-source verification

Reported via search aggregation, **not yet traced to Anthropic's own page**, so these
are staged as `source_type: 'third-party'` until the model card is fetched:
SWE-bench Pro 89.9% · Terminal-Bench 4.0 66.4% · Artificial Analysis Intelligence
Index 58 at max effort · Humanity's Last Exam 61.4% · SciCode 66.9% · containment
evaluation: boundary-circumvention attempts ~85% below Opus 5 / Mythos 5.1.

---

## Google DeepMind — partial

Source: https://ai.google.dev/gemini-api/docs/models (fetched 2026-09-23)

Current: `gemini-3.8-flash`, `gemini-3.8-live`, `gemini-3.8-live-extended-thinking`,
`gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`, `gemini-3.7-flash`,
`gemini-3.6-flash`, `gemini-3.5-flash`.
Media: Nano Banana 2 (`gemini-3.1-flash-image`), Veo 3.1, Lyria 3.5, Gemini Embedding 2.

Lineage (Wikipedia): 1.0 Nano 2023-12-06 · 1.0 Pro 2023-12-13 · 1.0 Ultra 2024-02-08
(90% MMLU) · 1.5 Pro 2024-02-15 (1M ctx) · 1.5 Flash 2024-05-14 · 2.0 Flash 2025-01-30
· 2.0 Pro 2025-02-05 · 2.0 Flash-Lite 2025-02-25 · 2.5 Pro 2025-03-25 · 2.5 Flash
2025-04-17 · 3 Pro 2025-11-18 (1M input) · 3.8 Flash 2026-09-02.

**Gap:** no Pro-tier model listed above 3 Pro, and 3.5/3.6/3.7 have no release dates
yet. Resolve before the Google lab page ships.

---

## OpenAI — thin, needs a second pass

Source: https://en.wikipedia.org/wiki/GPT-5.5 (fetched 2026-09-23)

GPT-5.5 released 2026-04-23 (codename "Spud"). Variants: 5.5 Thinking + 5.5 Pro
(04-23, paid), 5.5 Instant (05-05, free tier), 5.5-Cyber (05-07, limited preview).
Benchmarks: Terminal-Bench 2.0 82.7% · FrontierMath T1–3 51.7% · FrontierMath T4
35.4% · AISI cyber tasks 71.4% (±8.0%).

Referenced but undated on that page: GPT-5, 5.1, 5.2, 5.4, 5.6, 6. Search results
also name **GPT-6 Astra** as a current frontier model. Pricing page is 403.

---

## Other labs named by live search, not yet verified

Leads only — each needs a primary source before it enters `data/`:
xAI Grok 4 · DeepSeek V3/R1 · Z.AI GLM-5 · Moonshot Kimi K3 · Alibaba Qwen 3.8 Max
(reported entering LMArena at 1686 Elo) · Claude Fable 5.1 (reported 1762 Elo, +73
over Fable 5).

---

## Open items

1. OpenAI: find a fetchable pricing/model source (docs mirror, or the models endpoint).
2. Google: dates for Gemini 3.5/3.6/3.7; confirm whether a Pro tier above 3 Pro exists.
3. Anthropic: fetch each model page for first-party benchmark tables.
4. Route around the two blocked sources, or record them as permanently unavailable.
5. Launch videos: no YouTube IDs collected yet — a dedicated pass per Tier-1 release.

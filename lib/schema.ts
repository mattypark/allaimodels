import { z } from 'zod';

/**
 * The contract for every fact on this site.
 *
 * The rule the whole project turns on: a benchmark number without a source URL,
 * a date, and a comparability judgement is not data, it is a rumour. The schema
 * makes that unrepresentable — `BenchmarkResult` has no shape where those are
 * optional, so a scraper cannot write a bare number even by accident.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dates are YYYY-MM-DD so they sort as strings');

/** Where a number came from, in descending order of trust. */
export const SourceType = z.enum([
  'official', // the lab's own model card, docs or announcement
  'third-party', // an independent evaluator: LMArena, Epoch, Artificial Analysis
  'community', // a reproduction someone published; useful, not authoritative
]);

export const BenchmarkResult = z.object({
  suite: z.string(), // slug into data/benchmarks/<suite>.json
  metric: z.string(), // "accuracy", "pass@1", "elo" — what the number counts
  value: z.number(),
  unit: z.enum(['percent', 'elo', 'index', 'score', 'seconds', 'usd']),
  source_url: z.string().url(),
  source_type: SourceType,
  measured_on: isoDate,

  /**
   * Why two labs' numbers for the "same" benchmark may not be the same thing:
   * scaffold, attempt budget, tool access, thinking effort. Written in plain
   * language because it renders directly into the comparison tooltip.
   */
  harness_notes: z.string().optional(),

  /**
   * False means: do not rank this against other labs' entries for this suite.
   * The compare view greys these rather than silently crowning a winner.
   */
  comparable: z.boolean(),
});

export const ModelStatus = z.enum(['current', 'legacy', 'preview', 'retired']);

export const Model = z.object({
  id: z.string(), // url slug, unique within a lab
  lab: z.string(), // slug into data/labs
  name: z.string(),
  family: z.string().optional(), // "Opus", "Mythos", "Gemini Flash"
  status: ModelStatus,
  released: isoDate,
  summary: z.string(),

  /** Platform -> exact API identifier. A model has many names; record them all. */
  api_ids: z.record(z.string(), z.string()).default({}),

  context: z
    .object({
      input_tokens: z.number().int().positive(),
      output_tokens: z.number().int().positive().optional(),
      /**
       * Tokenizers change. Anthropic's own docs note 1M tokens is ~555k words
       * after Opus 4.7 but ~750k before it — so raw context numbers are not
       * comparable across generations. This note travels with the number.
       */
      tokenizer_note: z.string().optional(),
    })
    .optional(),

  pricing: z
    .object({
      input_per_mtok: z.number().nonnegative(),
      output_per_mtok: z.number().nonnegative(),
      currency: z.string().default('USD'),
      /** Batch discounts and cache-read rates move the real price a lot. */
      notes: z.string().optional(),
    })
    .optional(),

  modalities: z.object({
    input: z.array(z.enum(['text', 'image', 'audio', 'video', 'pdf'])),
    output: z.array(z.enum(['text', 'image', 'audio', 'video', 'embedding'])),
  }),

  knowledge_cutoff: z.string().optional(),
  retirement_not_before: isoDate.optional(),
  open_weights: z.boolean().default(false),

  /** The launch video. Thumbnail is derived from the id, never stored. */
  video: z
    .object({
      youtube_id: z.string(),
      title: z.string().optional(),
      source_url: z.string().url().optional(),
    })
    .optional(),

  links: z
    .object({
      announcement: z.string().url().optional(),
      model_card: z.string().url().optional(),
      docs: z.string().url().optional(),
      weights: z.string().url().optional(),
    })
    .default({}),

  benchmarks: z.array(BenchmarkResult).default([]),
  sources: z.array(z.string().url()).min(1, 'every model cites at least one page'),
});

/** A photo of a real person carries its credit everywhere it goes. */
export const Portrait = z.object({
  src: z.string(),
  credit: z.string(),
  source_url: z.string().url(),
  license: z.string().optional(),
});

export const Founder = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  portrait: Portrait.optional(),
});

export const Lab = z.object({
  slug: z.string(),
  name: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  founded: z.string(),
  hq: z.string(),
  summary: z.string(),
  founders: z.array(Founder).default([]),

  /**
   * The page repaints itself in these when you enter a lab. Fonts are slots,
   * not files — see lib/fonts/registry.ts for how licensed faces drop in.
   */
  brand: z.object({
    scheme: z.enum(['light', 'dark']),
    bg: z.string(),
    ink: z.string(),
    muted: z.string(),
    accent: z.string(),
    accent_ink: z.string(),
  }),

  links: z.object({
    website: z.string().url(),
    docs: z.string().url().optional(),
    news: z.string().url().optional(),
    github: z.string().url().optional(),
    huggingface: z.string().url().optional(),
  }),

  sources: z.array(z.string().url()).min(1),
});

export const BenchmarkSuite = z.object({
  slug: z.string(),
  name: z.string(),
  measures: z.string(), // one sentence a non-specialist understands
  unit: z.enum(['percent', 'elo', 'index', 'score', 'seconds', 'usd']),
  higher_is_better: z.boolean(),
  leaderboard_url: z.string().url().optional(),
  /** Why identical scores can mean different things on this suite. */
  comparability_warning: z.string().optional(),
});

export type BenchmarkResult = z.infer<typeof BenchmarkResult>;
export type Model = z.infer<typeof Model>;
export type Lab = z.infer<typeof Lab>;
export type Founder = z.infer<typeof Founder>;
export type BenchmarkSuite = z.infer<typeof BenchmarkSuite>;
export type SourceType = z.infer<typeof SourceType>;

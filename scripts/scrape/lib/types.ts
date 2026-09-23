/** What every source module returns. Findings are proposals, not writes. */
export type Finding = {
  /** data/models/<lab>/<id>.json this concerns. */
  lab: string;
  modelId: string;
  /** Dotted path within the model file, e.g. "pricing.input_per_mtok". */
  field: string;
  value: unknown;
  sourceUrl: string;
};

export type SourceResult = {
  source: string;
  ok: boolean;
  /** Present when ok is false — surfaced in the pull request body verbatim. */
  reason?: string;
  findings: Finding[];
  notes: string[];
};

import { getJson } from '../lib/fetch.ts';
import type { SourceResult } from '../lib/types.ts';

type HfModel = { id: string; downloads: number; likes: number; createdAt: string };

const ORGS: Record<string, string> = {
  deepseek: 'deepseek-ai',
  qwen: 'Qwen',
  mistral: 'mistralai',
  meta: 'meta-llama',
  microsoft: 'microsoft',
};

/**
 * Open-weight releases, straight from HuggingFace's public API.
 *
 * This is the only source that can discover models we do not already know
 * about, which is what keeps the long tail from going stale. It reports what
 * it found; it does not create model files on its own, because an org's
 * repository list contains far more than its flagship releases.
 */
export async function scrapeHuggingFace(): Promise<SourceResult> {
  const notes: string[] = [];
  let anyOk = false;

  for (const [lab, org] of Object.entries(ORGS)) {
    const url = `https://huggingface.co/api/models?author=${org}&sort=createdAt&direction=-1&limit=8`;
    const res = await getJson<HfModel[]>(url);
    if (!res.ok) {
      notes.push(`${lab} (${org}): ${res.reason}`);
      continue;
    }
    anyOk = true;
    const recent = res.data
      .map((m) => `${m.id} (${m.createdAt?.slice(0, 10) ?? 'undated'})`)
      .join(', ');
    notes.push(`${lab}: newest on HuggingFace — ${recent || 'nothing returned'}`);
  }

  return {
    source: 'huggingface',
    ok: anyOk,
    reason: anyOk ? undefined : 'every HuggingFace org query failed',
    findings: [],
    notes,
  };
}

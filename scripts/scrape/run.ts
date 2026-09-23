/**
 * Weekly refresh.
 *
 * Reads every source, compares what it found against what is on disk, and
 * either writes the changes or prints them (--dry-run). It is deliberately
 * boring and deliberately timid:
 *
 *   - A source that fails leaves its data untouched and says so in the report.
 *   - A finding that matches disk is not a change.
 *   - A finding for a model file that does not exist is reported, not created.
 *   - Nothing is ever merged automatically. This writes a branch; a person
 *     reads the diff.
 *
 * The reason for all of that: an index that rewrites itself unattended is one
 * bad selector away from publishing nonsense at scale, with total confidence.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { scrapeAnthropic } from './sources/anthropic.ts';
import { scrapeHuggingFace } from './sources/huggingface.ts';
import { scrapeYouTube } from './sources/youtube.ts';
import type { SourceResult } from './lib/types.ts';

const DRY = process.argv.includes('--dry-run');
const ROOT = join(process.cwd(), 'data', 'models');

function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts.slice(0, -1)) {
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts.at(-1)!] = value;
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, p) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[p];
    return undefined;
  }, obj);
}

function existingVideos() {
  const out: { lab: string; modelId: string; youtubeId: string }[] = [];
  if (!existsSync(ROOT)) return out;
  for (const lab of readdirSync(ROOT)) {
    for (const f of readdirSync(join(ROOT, lab))) {
      if (!f.endsWith('.json')) continue;
      const m = JSON.parse(readFileSync(join(ROOT, lab, f), 'utf8'));
      if (m.video?.youtube_id) out.push({ lab, modelId: m.id, youtubeId: m.video.youtube_id });
    }
  }
  return out;
}

const results: SourceResult[] = [];
results.push(await scrapeAnthropic());
results.push(await scrapeHuggingFace());
results.push(await scrapeYouTube(existingVideos()));

const changes: string[] = [];
const missing: string[] = [];
const touched = new Map<string, Record<string, unknown>>();

for (const r of results) {
  if (!r.ok) continue;
  for (const f of r.findings) {
    const path = join(ROOT, f.lab, `${f.modelId}.json`);
    if (!existsSync(path)) {
      missing.push(`${f.lab}/${f.modelId} — found by ${r.source}, no file on disk`);
      continue;
    }
    const model = touched.get(path) ?? JSON.parse(readFileSync(path, 'utf8'));
    touched.set(path, model);

    const before = getPath(model, f.field);
    if (JSON.stringify(before) === JSON.stringify(f.value)) continue;

    changes.push(
      `${f.lab}/${f.modelId} · ${f.field}: ${JSON.stringify(before) ?? 'absent'} → ${JSON.stringify(f.value)}  [${r.source}]`,
    );
    setPath(model, f.field, f.value);
  }
}

if (!DRY) {
  for (const [path, model] of touched) {
    writeFileSync(path, JSON.stringify(model, null, 2) + '\n');
  }
}

// ── Report. This becomes the pull request body verbatim. ──
const lines: string[] = [];
lines.push(`## Data refresh — ${new Date().toISOString().slice(0, 10)}`, '');

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  lines.push('### Sources that failed', '');
  lines.push('These left their existing data untouched. No value was guessed.', '');
  for (const r of failed) lines.push(`- **${r.source}** — ${r.reason}`);
  lines.push('');
}

lines.push('### Changes', '');
if (changes.length === 0) {
  lines.push('Nothing changed. Every sourced field already matches the live pages.');
} else {
  for (const c of changes) lines.push(`- ${c}`);
}
lines.push('');

if (missing.length) {
  lines.push('### Models seen but not indexed', '');
  lines.push('Reported, not created — a new model file needs a human to write its summary.', '');
  for (const m of missing) lines.push(`- ${m}`);
  lines.push('');
}

lines.push('### Source notes', '');
for (const r of results) {
  lines.push(`**${r.source}** — ${r.ok ? 'ok' : 'FAILED'}`);
  for (const n of r.notes) lines.push(`  - ${n}`);
}

const report = lines.join('\n');
console.log(report);

if (!DRY) writeFileSync(join(process.cwd(), 'refresh-report.md'), report + '\n');

// Signals the workflow: 0 = changes to review, 78 = nothing to do.
process.exit(changes.length > 0 ? 0 : 78);

/**
 * Data gate. Runs in CI and before every build.
 *
 * Fails loudly on anything the site would otherwise render as a confident
 * falsehood: a benchmark pointing at a suite that does not exist, a model
 * belonging to no lab, a duplicate id, or a source list that is empty.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Lab, Model, BenchmarkSuite } from '../lib/schema.ts';

const ROOT = join(process.cwd(), 'data');
const errors: string[] = [];
const warnings: string[] = [];

function read(p: string) {
  return JSON.parse(readFileSync(p, 'utf8'));
}
function files(dir: string) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
}

const labs = files(join(ROOT, 'labs')).map((f) => {
  const r = Lab.safeParse(read(join(ROOT, 'labs', f)));
  if (!r.success) errors.push(`labs/${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  return r.success ? r.data : null;
});

const suites = files(join(ROOT, 'benchmarks')).map((f) => {
  const r = BenchmarkSuite.safeParse(read(join(ROOT, 'benchmarks', f)));
  if (!r.success) errors.push(`benchmarks/${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  return r.success ? r.data : null;
});

const labSlugs = new Set(labs.filter(Boolean).map((l) => l!.slug));
const suiteSlugs = new Set(suites.filter(Boolean).map((s) => s!.slug));

const seen = new Set<string>();
let modelCount = 0;
let benchCount = 0;
let uncomparable = 0;

const modelsDir = join(ROOT, 'models');
for (const labDir of existsSync(modelsDir) ? readdirSync(modelsDir) : []) {
  for (const f of files(join(modelsDir, labDir))) {
    const where = `models/${labDir}/${f}`;
    const r = Model.safeParse(read(join(modelsDir, labDir, f)));
    if (!r.success) {
      errors.push(`${where}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    const m = r.data;
    modelCount++;

    if (m.lab !== labDir) errors.push(`${where}: lab field "${m.lab}" does not match its directory "${labDir}"`);
    if (!labSlugs.has(m.lab)) errors.push(`${where}: references unknown lab "${m.lab}"`);

    const key = `${m.lab}/${m.id}`;
    if (seen.has(key)) errors.push(`${where}: duplicate model id "${key}"`);
    seen.add(key);

    for (const b of m.benchmarks) {
      benchCount++;
      if (!b.comparable) uncomparable++;
      if (!suiteSlugs.has(b.suite)) {
        errors.push(`${where}: benchmark cites unknown suite "${b.suite}"`);
      }
      if (b.unit === 'percent' && (b.value < 0 || b.value > 100)) {
        errors.push(`${where}: ${b.suite} is a percentage but the value is ${b.value}`);
      }
      if (!b.comparable && !b.harness_notes) {
        warnings.push(`${where}: ${b.suite} is marked not comparable but gives no reason — the UI has nothing to show in the tooltip`);
      }
    }

    if (m.status === 'current' && m.benchmarks.length === 0) {
      warnings.push(`${where}: current model with no benchmarks yet`);
    }
  }
}

console.log(
  `\n  ${labs.length} labs · ${modelCount} models · ${suites.length} benchmark suites · ` +
    `${benchCount} benchmark results (${uncomparable} flagged not comparable)\n`,
);

for (const w of warnings) console.log(`  warn  ${w}`);
if (warnings.length) console.log('');

if (errors.length) {
  for (const e of errors) console.error(`  FAIL  ${e}`);
  console.error(`\n${errors.length} error(s). Data gate failed.\n`);
  process.exit(1);
}
console.log('  Data gate passed.\n');

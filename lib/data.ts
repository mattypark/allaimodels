import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Lab, Model, BenchmarkSuite } from './schema';
import type { Lab as TLab, Model as TModel, BenchmarkSuite as TSuite } from './schema';

/**
 * Reads data/** at build time and validates every file on the way through.
 * Server-only: these run during the static build, never in the browser.
 */

const ROOT = join(process.cwd(), 'data');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json'));
}

let labCache: TLab[] | null = null;
let modelCache: TModel[] | null = null;
let suiteCache: TSuite[] | null = null;

export function getLabs(): TLab[] {
  if (labCache) return labCache;
  const dir = join(ROOT, 'labs');
  labCache = jsonFiles(dir)
    .map((f) => Lab.parse(readJson(join(dir, f))))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  return labCache;
}

export function getModels(): TModel[] {
  if (modelCache) return modelCache;
  const dir = join(ROOT, 'models');
  const out: TModel[] = [];
  if (existsSync(dir)) {
    for (const labDir of readdirSync(dir)) {
      const full = join(dir, labDir);
      for (const f of jsonFiles(full)) {
        out.push(Model.parse(readJson(join(full, f))));
      }
    }
  }
  // Newest first everywhere; the timeline reverses it itself.
  modelCache = out.sort((a, b) => b.released.localeCompare(a.released));
  return modelCache;
}

export function getSuites(): TSuite[] {
  if (suiteCache) return suiteCache;
  const dir = join(ROOT, 'benchmarks');
  suiteCache = jsonFiles(dir).map((f) => BenchmarkSuite.parse(readJson(join(dir, f))));
  return suiteCache;
}

export function getLab(slug: string): TLab | undefined {
  return getLabs().find((l) => l.slug === slug);
}

export function getModel(lab: string, id: string): TModel | undefined {
  return getModels().find((m) => m.lab === lab && m.id === id);
}

export function modelsForLab(slug: string): TModel[] {
  return getModels().filter((m) => m.lab === slug);
}

export function getSuite(slug: string): TSuite | undefined {
  return getSuites().find((s) => s.slug === slug);
}

/** Models that are shipping today, newest first — the site's front door. */
export function currentModels(): TModel[] {
  return getModels().filter((m) => m.status === 'current' || m.status === 'preview');
}

/** Only models with a real announced date belong on a time axis. */
export function datedModels(): TModel[] {
  return getModels()
    .filter((m) => m.date_precision === 'exact')
    .sort((a, b) => a.released.localeCompare(b.released));
}

export type { TLab as LabData, TModel as ModelData, TSuite as SuiteData };

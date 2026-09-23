/**
 * Write the lab roster, refusing any lab whose citation is dead.
 *
 * The facts in scripts/seed/labs.json — founding year, headquarters, founders —
 * are checked against the Wikipedia article each lab cites. The `brand` block
 * is not a sourced claim and is not presented as one: it is an editorial
 * reading of the lab's own site, so the page can repaint in its colours.
 * Contrast is enforced downstream by --accent-strong.
 *
 * Reka is deliberately absent. No article to cite, no freely licensed mark —
 * there is nothing there that would not be a guess.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { get } from '../scrape/lib/fetch.ts';

const labs = JSON.parse(await readFile('scripts/seed/labs.json', 'utf8'));
const refused = [];
let written = 0;

for (const lab of labs) {
  const check = await get(lab.sources[0]);
  if (!check.ok) {
    refused.push(`${lab.slug}: ${lab.sources[0]} — ${check.reason}`);
    console.log(`  refused  ${lab.slug}`);
    continue;
  }
  await writeFile(`data/labs/${lab.slug}.json`, JSON.stringify(lab, null, 2) + '\n', 'utf8');
  written += 1;
  console.log(`  ok       ${lab.slug}`);
}

console.log(`\n${written} labs written, ${refused.length} refused.`);
for (const r of refused) console.log(`  ${r}`);

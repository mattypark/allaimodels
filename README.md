# allaimodels

Every AI lab, every model, every benchmark — and the source for every number.

Most comparison sites collect figures that were never measured the same way,
put them in one column and sort it. The sort is the lie. This one records where
each number came from, when it was read, and whether it can honestly be
compared with anyone else's — and greys the ones that can't instead of ranking
them.

## Running it

```sh
npm install
npm run dev        # http://localhost:3020
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3020 |
| `npm run build` | Static production build |
| `npm run validate` | Data gate — fails on unsourced or inconsistent data |
| `npm run scrape:dry` | Run every source, print the diff, write nothing |
| `npm run scrape` | Run every source and write changes |

No API keys. Every source is public and keyless, so the site builds and deploys
with an empty environment. `.env.example` exists only to say so.

## How the data works

```
data/labs/<slug>.json          the lab, its founders, its six brand tokens
data/models/<lab>/<id>.json    one model
data/benchmarks/<suite>.json   what a benchmark actually measures
```

A benchmark result cannot exist without a source URL, the date it was read, and
an explicit `comparable` flag. That is enforced by the Zod schema in
`lib/schema.ts`, not by discipline — there is no shape a bare number can take
that `npm run validate` will accept.

Two fields exist specifically to hold honest uncertainty:

- **`date_precision`** — `exact` is an announced release date; `observed` means
  we only know the day we first saw the model listed. Observed models are kept
  off the timeline entirely, because a guessed date on a time axis is a lie
  with a shape.
- **`comparable`** — false means do not rank this against another lab's figure
  for the same suite, with `harness_notes` giving the reason in plain language.

### Adding a lab

Write `data/labs/<slug>.json`, add a font row to `lib/fonts/registry.ts`, run
`npm run validate`. There is no per-lab component code: every lab page is built
from the same six CSS custom properties, so the JSON is the whole change.

## The weekly refresh

`.github/workflows/refresh.yml` runs each Monday, scrapes every source, and
opens a pull request if anything disagreed with the committed data. It never
merges itself.

It fails closed. A source that errors, rate-limits or blocks robots leaves its
data exactly as it was and reports the failure in the pull request body. During
the first research pass two of five primary sources were already unreachable —
OpenAI's pricing page returns 403, and Artificial Analysis was TLS-intercepted
by a network filter — and neither produced a number.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Zod · GSAP + ScrollTrigger ·
Lenis · Framer Motion · anime.js · Three.js. Statically exported.

See [docs/METHODOLOGY](app/methodology/page.tsx) for the rules, `docs/FONTS.md`
for the typography slots, and `docs/RESEARCH.md` for the sourcing log.

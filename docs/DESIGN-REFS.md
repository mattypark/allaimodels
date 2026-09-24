# Design references

What the charts and lab pages are built from. Every value here was read off the live page
with `getComputedStyle`, not remembered. Re-read the source before changing a component.

Captured 2026-09-23.

## Browser note

References are opened in **real Google Chrome**, not Comet. `openai.com` serves a Cloudflare
interstitial to a CDP-driven Chrome, so the numbers below were read through the Claude
extension in the browser that was already connected. Bot detection is not worked around.

---

## openai.com/index/gpt-6-astra/ — the benchmark card system

The page Matthew pointed at. Its charts are Vega-Lite (`svg.marks`, viewBox `0 0 633 422`)
wrapped in a themed scope. We are not adopting Vega — we are adopting its structure and its
token layout, hand-written in SVG so it inherits our own theme vars.

### Ground

| Thing | Value |
| --- | --- |
| Page background | `rgb(0, 0, 0)` |
| Page ink | `rgb(255, 255, 255)` |
| Face | `OpenAI Sans`, sans-serif fallback |
| Hero motif | A spiral galaxy of ~2,000 small light dots on near-black, brightest at the core, with blue and warm-white stars. Behind it: `radial-gradient(transparent 0%, rgb(35 67 95 / 0.0625) 25%, … rgb(35,67,95) 100%)` — the field is a gradient, the stars sit on top. |
| Vignette | `radial-gradient(circle, transparent 47%, rgb(0 0 0 / 0.18) 72%, rgb(0 0 0 / 0.78) 100%)` |

### Suite tab pills

One pill per benchmark, in a row above the card.

| Property | Value |
| --- | --- |
| Radius | `9999px` |
| Padding | `12px 16px` |
| Font size | `14px` |
| Selected | `background: rgba(255,255,255,0.12)` |
| Unselected | `background: transparent` |
| Ink | `rgb(255,255,255)` both states |

Selection is a fill, not a border and not a colour change. Worth copying exactly — it is
why the row reads as one object.

### Chart card

**The card is transparent.** The galaxy backdrop runs straight through it — stars are
visible behind the plot area and behind the tab row. Only a hairline rounded border marks
the card's edge. That is the single biggest difference from a normal dashboard chart, and
it is what makes the section feel like part of the page rather than an embed. Our lab pages
get the same treatment: the `LabBackdrop` sits behind, `ChartCard` has no opaque fill.

- The tab row is itself a capsule — a rounded pill-shaped container with a hairline border,
  holding the individual pills. Not a bare row of buttons.
- The plot sits in a padded column (`0 20px`) inside a `.dotcom-chart-theme-scope` wrapper
  at ~634px.
- Axis tick labels: `12px`, full-strength ink (not muted). Currency ticks render as `$0 $20
  $40 $60 $80`; percentage ticks as `20% 30% … 70%`. **The unit lives in the tick, not in a
  separate axis label** — that is what makes the plot readable without a legend.
- Axis titles are present and small: `API Cost` under x, `Resolution rate` rotated on y.
- Caption sits under the plot in italic, and carries the claim *and* its caveat — on
  ARC-AGI-3 it names the harness ("our responses API harness"), links it, and states what
  the competitor would have scored under it. That caption is the part worth stealing: it is
  the same job our `harness_notes` / `comparability_warning` fields already do.
- A download control sits top-right of the card.
- A metric dropdown (`API Cost ⌄`) sits under the title when the suite has more than one
  measurable axis.

### Chart colour system — the thing to copy

Colours are not per-series hexes. They are **numbered ramps per hue, with three roles each**:

```
--dotcom-chart-theme-blue-1-ink: #e8f3fe
--dotcom-chart-theme-blue-2-ink: #a4cdfb
--dotcom-chart-theme-blue-3-ink: #63a8f8
--dotcom-chart-theme-blue-3-bounded-fill: #539af8
--dotcom-chart-theme-blue-3-keyline: #e8f3fe
…
--dotcom-chart-color-foreground: var(--color-primary-solid-100)
--dotcom-chart-color-muted-foreground: var(--color-primary-solid-60)
--dotcom-chart-color-grid / -control-border / -popover-background
```

Three roles per step: `ink` (line/point), `bounded-fill` (bar/area, slightly deeper so it
holds against its own keyline), `keyline` (the light outline). Our per-lab accent should be
expanded the same way, so a bar, a dot and a stroke of the same series are three different
values, not one.

### Marker shapes

The cost-vs-score scatter gives **each model its own shape as well as its own colour** —
star, circle, square, diamond, triangle — and joins one model's points into an effort curve.
Shape carries the series when colour can't (colour-blindness, print, greyscale). We do the
same; our a11y score is 100 and colour-only encoding would cost it.

---

## Anthropic benchmark card (the first reference)

Ranked horizontal bars on a light card:

- Card: light cream (`--paper`), hairline border, generous radius.
- Title bold, then a muted subtitle stating the metric and direction — `Accuracy, % (higher
  is better)`.
- Rows: model name left-aligned in a fixed gutter, bar on a light track, value right-aligned.
  **Leader bar in the brand accent and its value in bold; every other bar grey.**
- Source paragraph under the chart in small muted text, naming the publication, the table,
  the standard error and the effort setting the scores were run at.

The ranking is honest because the caption says what the run conditions were. Same rule.

---

## Per-lab takeover

`app/labs/[slug]/page.tsx` already repaints the page from six brand vars plus a font slot.
The backdrop is the missing piece. One motif per lab, all rendered by the same component:

| Lab | Ground | Backdrop motif |
| --- | --- | --- |
| openai | near-black | `stars` — spiral galaxy field over a blue radial gradient, per the Astra page |
| anthropic | cream | `none` — Anthropic's own pages are flat paper |
| google-deepmind | white | `mesh` — soft multi-hue gradient mesh |
| meta | white/blue | `grid` |
| mistral | cream/orange | `rings` |
| deepseek | white/blue | `grid` |
| xai | black | `stars`, sparse |
| everything else | per brand | `none` until its own page is read |

Filled in per lab as each one's site is actually opened and read. A row here without a
"read on" date is a guess and should be treated as one.

---

## Captured frames

| File | What it shows |
| --- | --- |
| `docs/refs/openai-astra-hero.jpg` | The galaxy hero — star density, the blue/warm mix, the split `GPT` / `Astra` wordmarks, the vignette |
| `docs/refs/openai-astra-chartcard.jpg` | The tab capsule, the transparent chart card over the starfield, the shape legend, the effort curves |

Read the frames before rebuilding a chart. Descriptions drift; the frames do not.

---

## vclense.ch/ycglobe — the dotted globe, the lens, the gate, the tour

Matthew's second reference, and the one that changes the home page. Four separate ideas on
one site. Read by driving it, not by looking at it: the hover was performed and the frames
compared before and after.

### Ground

| Thing | Value |
| --- | --- |
| Page background | `rgb(255, 247, 240)` — warm cream, very close to our own `--bg: #f0eee6` |
| Face | `Inter, system-ui, sans-serif` |
| Accent | A saturated orange, used for the lens, the primary button and every number |
| Stack | `maplibre-gl@5` for the real map inside the app; the landing globe is a **plain 2D canvas**, full viewport, no WebGL |

### The globe, and what the lens actually does

The landing globe is **not** a 3D scene and not SVG. It is one full-bleed `<canvas>` 2D
context, a point cloud arranged on a sphere and projected flat, drawn as **small squares,
not circles** — roughly 2–4px, axis-aligned, which is what gives it the pixel-dust texture
rather than a bubble texture.

The hover is a **lens**, hence the company name. Hovering did not push the dots around.
Comparing the two frames, within roughly a 150px radius of the cursor each dot gets:

1. **colour** lerped from near-black toward the accent orange,
2. **alpha** raised,
3. **size** raised a step,

all weighted by `1 - distance / radius` so the effect is densest under the cursor and dies
smoothly at the rim. It reads as liquid because the falloff is smooth and the underlying
sphere keeps rotating underneath it — the highlight is a field over moving points, not a
deformation of them. There is also a light outward displacement near the very centre.

That is directly reusable and it is *better* on our data than on theirs: every dot here is a
model that already has a lab accent, so the lens can reveal each lab's own colour instead of
one brand orange. Sweeping the cursor across the sphere would light up Anthropic coral in
one region and OpenAI green in another.

Cost: one canvas, one rAF loop, `O(n)` per frame over ~400 points — cheaper than the
three.js scatter already on `/compare`.

### Floating stat cards

Four cards float around the globe, not in a rail: white, heavily rounded, soft shadow,
placed asymmetrically at roughly the four diagonals. Each is a big accent number, a small
uppercase mono label, and then **a short rotating list of real examples underneath**
(`6,100+ / YC COMPANIES / Airbnb, Stripe, DoorDash`). The examples are what make the number
feel true rather than marketing.

Ours map one-for-one: models indexed, labs covered, benchmark results with a source, cited
sources — each with three real names cycling under it.

### The gate

Under the globe: product name, one-line claim, a freshness line
(`Data verified daily · last refresh Sep 17`), then a full-width accent **Continue as
guest** button, and below it an email field beside a **Get updates** button.

Guest is the primary path and is not gated behind the email. Worth copying exactly — the
freshness line especially, because this site's entire pitch is that its numbers carry a date.

### The onboarding tour

On entering the app, a coach-mark tour runs: the page dims and blurs behind, a small white
rounded card appears anchored near the thing it describes, containing a brand lockup, a bold
title, a sentence, then a row of `Skip` · progress dots · a filled accent `Next`. Five steps.
The card moves to the region it is describing — over the globe for step 1, over the filter
rail for step 2.

### The app layout, for later

Left filter rail (search, then collapsible facet groups each with counts and a `+ N more`),
globe centre, right column of small leaderboard cards with inline bar fills, a bottom strip
of entity chips each carrying its logo, and an "Ask" panel that searches by meaning. The
counts beside every facet are the detail worth stealing — they turn a filter list into a
second dataset view.

---

## tresmarescapital.com — the page transition, measured

Matthew pointed at this site for its navigation animation. Driven, not watched: clicked
between Portfolio and Team repeatedly while sampling the DOM every 55ms.

**The finding is that there is no exit animation.** This is a WordPress site with ordinary
full-page navigation, no SPA router. Through the whole click-to-navigate window `#app` holds
`opacity: 1` and `transform: none`, nothing is inserted over it, and no element takes a
z-index above the content. The ~330ms gap before the URL changes is network, not animation.
The only overlaid elements found were the cookie-consent modal.

So everything Matthew is reacting to happens on the **incoming** page:

| Element | Measured |
| --- | --- |
| The page as a whole | Fades in: opacity **0.53 → 0.886 → 1** across roughly 250ms |
| `.mask` wrappers | Start at `opacity: 0.0001` — GSAP `autoAlpha`, a masked line reveal |
| Hero images | Sit at `scale(1.1)` and settle to `1` |
| Nav underline | `scaleX(0) → 1` |
| Menu items | Translated in, e.g. `translateX(-255px)` settling to 0 |

Stack: GSAP + Lenis + Three.js, a custom cursor at `#cursor` (`position: fixed`,
`z-index: 1080`), and PP Neue Montreal with PP Fragment Serif.

**What to copy.** The feel is a page that *assembles* rather than one that slides. A short
whole-page fade carries the arrival, then individual pieces settle in a stagger just behind
it — headline, then supporting text, then the grid. Nothing waits on the old page, which is
why it feels fast despite the reveal being about 700ms end to end.

**What not to copy.** The 0.0001 opacity trick is GSAP's way of keeping an element
measurable while invisible. It also means a reader with JavaScript off, or a failed script,
gets a blank page. Reveals here start from a visible state and are animated *from* it, so a
broken script leaves the page readable.

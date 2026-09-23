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

# Fonts

Each lab is set in a different face, because thirteen labs in one font is a
spreadsheet. The real identities are licensed and cannot ship from a public
repository, so every lab currently wears a free stand-in chosen to sit close to
its character.

| Lab | Stand-in | Stands in for |
| --- | --- | --- |
| Anthropic | Newsreader | Copernicus / Styrene |
| OpenAI | Inter Tight + IBM Plex Mono | OpenAI Sans |
| Google DeepMind | Instrument Sans | Google Sans |
| Meta | Archivo | Optimistic |
| xAI | Space Mono | Aeonik Mono |
| DeepSeek | Space Grotesk | Inter Display |
| Mistral | Outfit | Mistral Sans |
| Alibaba Qwen | Manrope | Alibaba Sans |
| Microsoft | Plus Jakarta Sans | Segoe UI Variable |
| Amazon | Figtree | Amazon Ember |

## Dropping in a licensed face

Once a licence is bought, three steps, one lab at a time:

1. Put the files in `public/fonts/licensed/<lab>/`. That directory is
   gitignored — licensed fonts must never be committed to a public repo.

2. Declare it in `lib/fonts/registry.ts` next to its stand-in:

   ```ts
   import localFont from 'next/font/local';

   export const copernicus = localFont({
     src: [
       { path: '../../public/fonts/licensed/anthropic/Copernicus-Book.woff2', weight: '400' },
       { path: '../../public/fonts/licensed/anthropic/Copernicus-Medium.woff2', weight: '500' },
     ],
     variable: '--font-copernicus',
     display: 'swap',
     preload: false,
   });
   ```

3. Point the lab's slot at it and add its variable to `allFontVariables`:

   ```ts
   anthropic: { display: 'var(--font-copernicus)', mono: 'var(--font-jetbrains)', standsInFor: 'Copernicus' },
   ```

Nothing else changes. No component names a font — they read `--font-display`
and `--font-mono`, which the lab page sets from this registry.

## Why every lab face sets `preload: false`

next/font preloads by default. With thirteen declared faces that would download
all thirteen on every page. `preload: false` leaves them as ordinary
`@font-face` rules, so a browser fetches only the face it actually needs to
render text on the page in front of it — one lab's, not thirteen.

Only the base stack preloads: Inter, JetBrains Mono, Newsreader. Those are the
site's own typography, per the standing rule, and they appear on every page.

## The licensing line

Stand-ins are free fonts under open licences, used as themselves. They are not
modified to impersonate a licensed face, and each lab page says in its header
which face it is standing in for and links to the methodology page explaining
why the real one is absent.

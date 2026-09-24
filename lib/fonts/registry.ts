import {
  Geist,
  Geist_Mono,
  Inter,
  Newsreader,
  JetBrains_Mono,
  Inter_Tight,
  IBM_Plex_Mono,
  Instrument_Sans,
  Archivo,
  Space_Grotesk,
  Space_Mono,
  Outfit,
  Manrope,
  Plus_Jakarta_Sans,
  Figtree,
} from 'next/font/google';

/**
 * Per-lab typography as swappable slots.
 *
 * Every face below is a free stand-in. The real identities — Anthropic's
 * Copernicus and Styrene, OpenAI Sans, Google Sans, Meta's Optimistic — are
 * licensed and cannot ship from a public repo. When a licence is bought:
 *
 *   1. drop the files in public/fonts/licensed/<lab>/   (gitignored)
 *   2. add a localFont() declaration next to its stand-in
 *   3. point the lab's `display` at it
 *
 * One line per lab, no other file changes. See docs/FONTS.md.
 *
 * Only the base stack preloads. Lab faces set `preload: false`, so a visitor
 * downloads the one lab they actually open rather than all thirteen.
 */

// next/font requires a literal object at every call site — the loader reads
// these at build time and cannot evaluate a spread or a shared constant. So
// each declaration is written out in full. Only the base stack preloads.

// ── Base system — the only preloaded faces ──
//
// Geist is the interface face. Matthew asked for the SF Pro / OpenAI Sans
// feel; both of those are licensed and cannot ship from a public repo, and
// Geist is the closest thing that can — a neo-grotesk cut for screens, under
// the SIL Open Font License. next/font self-hosts it at build time, so there
// is no request to Google at runtime and no layout shift when it lands.
export const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-geist' });
export const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-geist-mono' });

export const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-inter' });
export const jetbrains = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains' });
export const newsreader = Newsreader({ subsets: ['latin'], display: 'swap', variable: '--font-newsreader' });

// ── Lab display faces: preload:false, so one lab's face downloads, not thirteen ──
export const interTight = Inter_Tight({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-inter-tight' });
export const plexMono = IBM_Plex_Mono({ subsets: ['latin'], display: 'swap', preload: false, weight: ['400', '600'], variable: '--font-plex-mono' });
export const instrument = Instrument_Sans({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-instrument' });
export const archivo = Archivo({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-archivo' });
export const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-space-grotesk' });
export const spaceMono = Space_Mono({ subsets: ['latin'], display: 'swap', preload: false, weight: ['400', '700'], variable: '--font-space-mono' });
export const outfit = Outfit({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-outfit' });
export const manrope = Manrope({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-manrope' });
export const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-jakarta' });
export const figtree = Figtree({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-figtree' });

/** Every font variable, for the <html> className. */
export const allFontVariables = [
  geist, geistMono, inter, jetbrains, newsreader, interTight, plexMono, instrument,
  archivo, spaceGrotesk, spaceMono, outfit, manrope, jakarta, figtree,
]
  .map((f) => f.variable)
  .join(' ');

type Slot = {
  /** CSS var for the lab's display face. */
  display: string;
  /** CSS var for its mono. Body stays Inter everywhere for readability. */
  mono: string;
  /** The licensed face this stands in for — rendered as a credit in the UI. */
  standsInFor: string;
};

export const LAB_FONTS: Record<string, Slot> = {
  anthropic:   { display: 'var(--font-newsreader)',     mono: 'var(--font-jetbrains)',    standsInFor: 'Copernicus / Styrene' },
  openai:      { display: 'var(--font-inter-tight)',    mono: 'var(--font-plex-mono)',    standsInFor: 'OpenAI Sans' },
  'google-deepmind': { display: 'var(--font-instrument)', mono: 'var(--font-jetbrains)',  standsInFor: 'Google Sans' },
  meta:        { display: 'var(--font-archivo)',        mono: 'var(--font-jetbrains)',    standsInFor: 'Optimistic' },
  xai:         { display: 'var(--font-space-mono)',     mono: 'var(--font-space-mono)',   standsInFor: 'Aeonik Mono' },
  deepseek:    { display: 'var(--font-space-grotesk)',  mono: 'var(--font-jetbrains)',    standsInFor: 'Inter Display' },
  mistral:     { display: 'var(--font-outfit)',         mono: 'var(--font-jetbrains)',    standsInFor: 'Mistral Sans' },
  qwen:        { display: 'var(--font-manrope)',        mono: 'var(--font-jetbrains)',    standsInFor: 'Alibaba Sans' },
  microsoft:   { display: 'var(--font-jakarta)',        mono: 'var(--font-jetbrains)',    standsInFor: 'Segoe UI Variable' },
  amazon:      { display: 'var(--font-figtree)',        mono: 'var(--font-jetbrains)',    standsInFor: 'Amazon Ember' },

  // The nine labs added in the roster expansion. These reuse faces already
  // declared above rather than pulling in nine more: a slot is a pairing of
  // display and mono, so reusing a display with a different mono still gives a
  // lab its own voice, and the page weight does not move.
  nvidia:      { display: 'var(--font-archivo)',        mono: 'var(--font-jetbrains)',    standsInFor: 'NVIDIA Sans' },
  cohere:      { display: 'var(--font-figtree)',        mono: 'var(--font-plex-mono)',    standsInFor: 'CohereText' },
  ai2:         { display: 'var(--font-instrument)',     mono: 'var(--font-jetbrains)',    standsInFor: 'Manrope' },
  moonshot:    { display: 'var(--font-space-grotesk)',  mono: 'var(--font-plex-mono)',    standsInFor: 'Kimi Sans' },
  zhipu:       { display: 'var(--font-manrope)',        mono: 'var(--font-jetbrains)',    standsInFor: 'Z.ai Sans' },
  minimax:     { display: 'var(--font-outfit)',         mono: 'var(--font-jetbrains)',    standsInFor: 'MiniMax Sans' },
  perplexity:  { display: 'var(--font-jakarta)',        mono: 'var(--font-plex-mono)',    standsInFor: 'FK Grotesk' },
  inflection:  { display: 'var(--font-figtree)',        mono: 'var(--font-jetbrains)',    standsInFor: 'Inflection Sans' },
  baidu:       { display: 'var(--font-manrope)',        mono: 'var(--font-plex-mono)',    standsInFor: 'Baidu Sans' },
};

export const DEFAULT_FONTS: Slot = LAB_FONTS.anthropic;

export function fontsFor(labSlug: string | undefined): Slot {
  return (labSlug && LAB_FONTS[labSlug]) || DEFAULT_FONTS;
}

import {
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

const base = { subsets: ['latin'] as const, display: 'swap' as const };
const lab = { ...base, preload: false };

// ── Base system — the global rule's stack, and the only preloaded faces ──
export const inter = Inter({ ...base, variable: '--font-inter' });
export const jetbrains = JetBrains_Mono({ ...base, variable: '--font-jetbrains' });
export const newsreader = Newsreader({ ...base, variable: '--font-newsreader' });

// ── Lab display faces ──
export const interTight = Inter_Tight({ ...lab, variable: '--font-inter-tight' });
export const plexMono = IBM_Plex_Mono({ ...lab, weight: ['400', '600'], variable: '--font-plex-mono' });
export const instrument = Instrument_Sans({ ...lab, variable: '--font-instrument' });
export const archivo = Archivo({ ...lab, variable: '--font-archivo' });
export const spaceGrotesk = Space_Grotesk({ ...lab, variable: '--font-space-grotesk' });
export const spaceMono = Space_Mono({ ...lab, weight: ['400', '700'], variable: '--font-space-mono' });
export const outfit = Outfit({ ...lab, variable: '--font-outfit' });
export const manrope = Manrope({ ...lab, variable: '--font-manrope' });
export const jakarta = Plus_Jakarta_Sans({ ...lab, variable: '--font-jakarta' });
export const figtree = Figtree({ ...lab, variable: '--font-figtree' });

/** Every font variable, for the <html> className. */
export const allFontVariables = [
  inter, jetbrains, newsreader, interTight, plexMono, instrument,
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
};

export const DEFAULT_FONTS: Slot = LAB_FONTS.anthropic;

export function fontsFor(labSlug: string | undefined): Slot {
  return (labSlug && LAB_FONTS[labSlug]) || DEFAULT_FONTS;
}

/**
 * Design tokens (docs/SPEC.md §2.0).
 *
 * Two palettes share one shape so either can be swapped in:
 *  - `calm`    "Earthy Harmony", the default.
 *  - `vibrant` emerald / mint / gold / cream variant drawn on the wireframe canvas.
 * Screens never use raw hex values; they read `useTheme().color`.
 */

export type PaletteId = 'calm' | 'vibrant';

export interface Palette {
  /** App background on light screens. */
  bg: string;
  /** Cards, list rows, image panels. */
  surface: string;
  /** Primary buttons, selected chips, line art strokes. */
  accent: string;
  /** Decorative only on light screens (dividers, tracks, breath circle). */
  accentMuted: string;
  /** Achievement fill (streak pill, element pills). Never used as text. */
  warm: string;
  ink: string;
  inkMuted: string;
  onAccent: string;
  /** Practice screen background (always dark). */
  night: string;
  nightSurface: string;
  nightText: string;
  /** Secondary text and the breath circle on the Practice screen. */
  nightMuted: string;
}

export const palettes: Record<PaletteId, Palette> = {
  calm: {
    bg: '#E2DFDA',
    surface: '#CBDED3',
    accent: '#3B6255',
    accentMuted: '#8BA49A',
    warm: '#D2C49E',
    ink: '#1F2B27',
    inkMuted: '#4A5652',
    onAccent: '#FFFFFF',
    night: '#14201C',
    nightSurface: '#1C2B26',
    nightText: '#E2DFDA',
    nightMuted: '#8BA49A',
  },
  vibrant: {
    bg: '#F3EDE0',
    surface: '#B4E4C9',
    accent: '#156B4F',
    accentMuted: '#4E9A7C',
    warm: '#E2B84A',
    ink: '#10261E',
    inkMuted: '#3C5249',
    onAccent: '#FFFFFF',
    night: '#0B3A2D',
    nightSurface: '#0F4A39',
    nightText: '#F3EDE0',
    nightMuted: '#B4E4C9',
  },
};

export const fonts = {
  outfitMedium: 'Outfit_500Medium',
  outfitSemiBold: 'Outfit_600SemiBold',
  geistRegular: 'Geist_400Regular',
  geistMedium: 'Geist_500Medium',
} as const;

export const type = {
  display: { fontFamily: fonts.outfitSemiBold, fontSize: 64, lineHeight: 72 },
  h1: { fontFamily: fonts.outfitSemiBold, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fonts.outfitMedium, fontSize: 20, lineHeight: 26 },
  overline: {
    fontFamily: fonts.outfitMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  body: { fontFamily: fonts.geistRegular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.geistMedium, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.geistRegular, fontSize: 13, lineHeight: 18 },
} as const;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, gutter: 24 } as const;

export const radius = { card: 12, sheet: 16, pill: 999 } as const;

/** Minimum touch target (dp). */
export const hitTarget = 48;

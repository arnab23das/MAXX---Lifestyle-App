import { darkColors, ThemeColors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 18,
  pill: 999,
} as const;

// Inter, loaded via @expo-google-fonts/inter in App.tsx (see useAppFonts).
export const fontFamily = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  display: { fontSize: 33, fontFamily: fontFamily.bold, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 38 },
  h1: { fontSize: 23, fontFamily: fontFamily.bold, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 29 },
  h2: { fontSize: 17, fontFamily: fontFamily.bold, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 23 },
  body: { fontSize: 15, fontFamily: fontFamily.regular, fontWeight: '400' as const, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontFamily: fontFamily.semibold, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12.5, fontFamily: fontFamily.regular, fontWeight: '400' as const, lineHeight: 17 },
  eyebrow: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  tiny: { fontSize: 11, fontFamily: fontFamily.semibold, fontWeight: '600' as const, lineHeight: 14 },
};

/** The "Duolingo 3D lip" elevation used on primary buttons, path nodes, and highlighted rows. */
export const lip = {
  height: 5,
  heightLarge: 6,
} as const;

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  lip: typeof lip;
  dark: boolean;
}

// The reference is a single-theme (always-dark) design — see colors.ts.
export function useTheme(): Theme {
  return {
    colors: darkColors,
    spacing,
    radii,
    typography,
    fontFamily,
    lip,
    dark: true,
  };
}

export * from './colors';

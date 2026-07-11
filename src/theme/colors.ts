// MAXX color system — restyled to match the "Nocturne" UI reference
// (design_handoff_maxx_app): a dark, near-black ground with a single blurple
// accent. Per that spec: "keep the palette mono — do not introduce a second
// hue." The two intentional exceptions are the SOS crisis banner and
// right/wrong quiz feedback, where a distinct danger color is a safety/
// legibility requirement, not a style choice — see README "Design system".

export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  bgBase: '#0F111A',
  bgCanvas: '#05060A',
  surface: '#171923',
  surfaceAlt: '#232532',
  avatarBg: '#2B2D3A',

  textPrimary: '#F3F5FE',
  textBase: '#E9E9ED',
  textMuted: 'rgba(233,233,237,0.55)',
  textMutedFaint: 'rgba(233,233,237,0.45)',
  hairline: 'rgba(233,233,237,0.08)',
  hairlineFaint: 'rgba(233,233,237,0.06)',

  accent: '#9184D9',
  accentBright: '#B5ABFC',
  accentDeep: '#5D5294',
  accentTint: 'rgba(145,132,217,0.14)',
  accentTintFaint: 'rgba(145,132,217,0.10)',
  onAccent: '#14151D',

  lockedBg: '#3F424D',
  lockedIcon: '#5B5E70',
  lockedLip: '#101019',

  // Safety-only exceptions to the mono palette (see note above).
  danger: '#E2555A',
  dangerDeep: '#B33A3F',
  dangerTint: 'rgba(226,85,90,0.14)',
  success: '#57C278',
} as const;

export const darkColors = {
  background: palette.bgBase,
  canvas: palette.bgCanvas,
  surface: palette.surface,
  surfaceRaised: palette.surfaceAlt,
  border: palette.hairline,
  borderFaint: palette.hairlineFaint,
  textPrimary: palette.textPrimary,
  textSecondary: palette.textMuted,
  textInverse: palette.onAccent,

  primary: palette.accent,
  primaryPressed: palette.accentDeep,
  primarySoft: palette.accentTint,
  primaryBright: palette.accentBright,
  primaryLip: palette.accentDeep,
  onPrimary: palette.onAccent,

  // Level-type system (§4 of the spec): shape is the primary differentiator;
  // color stays within the mono accent family per the reference's "no second
  // hue" rule — lesson/exercise/documentation vary by tint/shade, not hue.
  lesson: palette.accent,
  lessonSoft: palette.accentTint,
  exercise: palette.accentBright,
  exerciseSoft: palette.accentTintFaint,
  documentation: palette.accentDeep,
  documentationSoft: palette.accentTint,

  xp: palette.accent,
  credit: palette.accent,
  creditSoft: palette.accentTint,
  streak: palette.accent,
  streakSoft: palette.accentTint,

  success: palette.success,
  successSoft: 'rgba(87,194,120,0.14)',
  danger: palette.danger,
  dangerSoft: palette.dangerTint,

  sos: palette.danger,
  sosSoft: palette.dangerTint,
  sosDeep: palette.dangerDeep,

  locked: palette.lockedIcon,
  lockedSoft: palette.lockedBg,
  lockedLip: palette.lockedLip,
} as const;

// The reference is an intentionally single-theme (dark) design; light mode
// reuses the same tokens so the app doesn't fragment its visual identity
// based on system appearance (see README "Design system" for the rationale).
export const lightColors: typeof darkColors = darkColors;

export type ThemeColors = typeof darkColors;

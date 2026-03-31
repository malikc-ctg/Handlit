// lib/theme.ts
// Design token constants for the dark-mode-first Handlit palette.

export const Colors = {
  background: '#0D0D0F',
  surface: '#18181B',
  surfaceElevated: '#27272A',
  surfaceHover: '#303036',
  accent: '#7C3AED',
  accentDim: '#4C1D95',
  accentLight: '#A78BFA',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  success: '#22C55E',
  successDim: '#14532D',
  warning: '#F59E0B',
  warningDim: '#78350F',
  destructive: '#EF4444',
  destructiveDim: '#7F1D1D',
  border: '#3F3F46',
  borderMuted: '#27272A',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const TIME_LABELS: Record<number, string> = {
  5: '5 min',
  15: '15 min',
  30: '30 min',
  60: '1 hr',
  90: '90 min',
};

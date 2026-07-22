/**
 * Design tokens — single source of truth for the app's visual identity.
 * Aligned with the ClearEarth web app's brand palette (emerald → teal gradient,
 * deep navy hero backgrounds) so the mobile app feels like the same product.
 * Mirrored (as static hex values) into tailwind.config.js since Metro/NativeWind
 * can't import TS at config-resolution time.
 */

export const BRAND = {
  green: '#10b981',
  teal: '#06b6d4',
  dark: '#0a1628',
} as const;

export const palette = {
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  accent: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#0A1628',
  },
  status: {
    overdue: { fg: '#C23B3B', bg: '#FCEAEA', bgDark: '#3A1D1D' },
    today: { fg: '#C9791A', bg: '#FDF0DC', bgDark: '#3A2A0F' },
    upcoming: { fg: '#2571A0', bg: '#E4F1F8', bgDark: '#12293A' },
    completed: { fg: '#059669', bg: '#ECFDF5', bgDark: '#0B3B2C' },
  },
  danger: {
    500: '#D64545',
    600: '#B93838',
  },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const typography = {
  fontFamily: {
    sans: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export type PickupPriority = 'overdue' | 'today' | 'upcoming' | 'completed';

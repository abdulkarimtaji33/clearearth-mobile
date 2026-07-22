/**
 * Design tokens — single source of truth for the app's visual identity.
 * Mirrored (as static hex values) into tailwind.config.js since Metro/NativeWind
 * can't import TS at config-resolution time.
 */

export const palette = {
  primary: {
    50: '#EFFAF3',
    100: '#D7F2E1',
    200: '#B0E5C5',
    300: '#7FD1A2',
    400: '#4DB87F',
    500: '#2F9E63',
    600: '#1F7F4E',
    700: '#176440',
    800: '#144F35',
    900: '#0F3A27',
  },
  accent: {
    50: '#FDF3EC',
    100: '#FAE1CD',
    200: '#F3C299',
    300: '#EA9E63',
    400: '#DE7C3B',
    500: '#C9642A',
    600: '#A94F20',
    700: '#833D19',
    800: '#5F2C13',
    900: '#3E1C0C',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8F9F7',
    100: '#F1F3EF',
    200: '#E3E7DF',
    300: '#CBD1C5',
    400: '#A4AC9B',
    500: '#7C8571',
    600: '#5D6455',
    700: '#454B3F',
    800: '#2E322A',
    900: '#1B1E17',
    950: '#101209',
  },
  status: {
    overdue: { fg: '#C23B3B', bg: '#FCEAEA', bgDark: '#3A1D1D' },
    today: { fg: '#C9791A', bg: '#FDF0DC', bgDark: '#3A2A0F' },
    upcoming: { fg: '#2571A0', bg: '#E4F1F8', bgDark: '#12293A' },
    completed: { fg: '#1F7F4E', bg: '#E7F7EE', bgDark: '#123326' },
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
    shadowColor: '#0F3A27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F3A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F3A27',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export type PickupPriority = 'overdue' | 'today' | 'upcoming' | 'completed';

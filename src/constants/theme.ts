import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1D1B20', textSecondary: '#625F66', background: '#FBF8FF', backgroundElement: '#F0EAF5', backgroundSelected: '#EADDFF', surface: '#FFFFFF',
    surfaceVariant: '#F0EAF5', primary: '#6750A4', primaryContainer: '#EADDFF', outline: '#E1DCE5',
    error: '#BA1A1A', success: '#386A20',
  },
  dark: {
    text: '#E8E1EA', textSecondary: '#CAC3CC', background: '#141217', backgroundElement: '#211F23', backgroundSelected: '#4F378B', surface: '#211F23',
    surfaceVariant: '#49454F', primary: '#D0BCFF', primaryContainer: '#4F378B', outline: '#49454F',
    error: '#FFB4AB', success: '#A7D78B',
  },
} as const;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', serif: 'ui-serif', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', serif: 'serif', mono: 'monospace' },
  default: { sans: 'sans-serif', rounded: 'sans-serif-medium', serif: 'serif', mono: 'monospace' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 10, md: 16, lg: 24, full: 999 } as const;
export const MaxContentWidth = 760;
export const BottomTabInset = Platform.select({ ios: 58, android: 82, default: 0 }) ?? 0;

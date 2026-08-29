import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export function useAppTheme() {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

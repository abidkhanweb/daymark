import { usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors, TabAccents } from '@/constants/theme';

export function useAppTheme() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const pathname = usePathname();
  const tab = pathname.includes('expenses') ? 'expenses' : pathname.includes('notes') ? 'notes' : pathname.includes('tasks') ? 'tasks' : 'today';
  return { ...Colors[mode], ...TabAccents[tab][mode] };
}

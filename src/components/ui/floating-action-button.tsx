import { styles } from './floating-action-button.styles';
import { Pressable } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

import { AppIcon, type AppIconName } from './app-icon';

export function FloatingActionButton({ label, onPress, icon = 'add' }: { label: string; onPress: () => void; icon?: AppIconName }) {
  const colors = useAppTheme();
  return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? .8 : 1 }]}><AppIcon name={icon} size={28} tintColor="#FFFFFF" /></Pressable>;
}

import { styles } from './app-tabs.styles';
import { TabList, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, Text } from 'react-native';

import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function AppTabs() {
  const colors = useAppTheme();
  return <Tabs><TabSlot style={{ height: '100%' }} /><TabList style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.outline }]}><TabTrigger name="today" href="/" asChild><Tab icon="today">Today</Tab></TabTrigger><TabTrigger name="tasks" href="/tasks" asChild><Tab icon="checklist">Tasks</Tab></TabTrigger><TabTrigger name="notes" href="/notes" asChild><Tab icon="notes">Notes</Tab></TabTrigger><TabTrigger name="expenses" href="/expenses" asChild><Tab icon="account-balance-wallet">Expenses</Tab></TabTrigger></TabList></Tabs>;
}

function Tab({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: AppIconName }) {
  const colors = useAppTheme();
  const tint = isFocused ? colors.primary : colors.textSecondary;
  return <Pressable {...props} style={({ pressed }) => [styles.tab, { backgroundColor: isFocused ? colors.primaryContainer : 'transparent', opacity: pressed ? .7 : 1 }]}><AppIcon name={icon} size={20} tintColor={tint} /><Text style={{ color: tint, fontWeight: isFocused ? '800' : '600' }}>{children}</Text></Pressable>;
}

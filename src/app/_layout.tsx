import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { DemoModeProvider, useDemoMode } from '@/features/demo/demo-mode';
import { ExpenseProvider } from '@/features/expenses/expense-store';
import { TaskProvider } from '@/features/tasks/task-store';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return <ThemeProvider value={dark ? DarkTheme : DefaultTheme}><DemoModeProvider><TaskProvider><ExpenseProvider><AppContent dark={dark} /></ExpenseProvider></TaskProvider></DemoModeProvider></ThemeProvider>;
}

function AppContent({ dark }: { dark: boolean }) {
  const { isDemo, session } = useDemoMode();
  return <View style={{ flex: 1 }}><StatusBar style={dark ? 'light' : 'dark'} /><AppTabs key={isDemo ? `demo-${session}` : 'personal'} /></View>;
}

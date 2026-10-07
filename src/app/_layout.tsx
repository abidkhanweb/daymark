import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';

import { BackupProvider } from '@/features/backup/backup-context';
import { DemoModeProvider } from '@/features/demo/demo-mode';
import { ExpenseProvider } from '@/features/expenses/expense-store';
import { TaskProvider } from '@/features/tasks/task-store';
import { TrashProvider } from '@/features/trash/trash-store';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return <ThemeProvider value={dark ? DarkTheme : DefaultTheme}><DemoModeProvider><TrashProvider><TaskProvider><ExpenseProvider><BackupProvider><AppContent dark={dark} /></BackupProvider></ExpenseProvider></TaskProvider></TrashProvider></DemoModeProvider></ThemeProvider>;
}

function AppContent({ dark }: { dark: boolean }) {
  return <View style={{ flex: 1 }}><StatusBar style={dark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="settings" options={{ animation: 'slide_from_left' }} /><Stack.Screen name="trash" options={{ presentation: 'modal' }} /></Stack></View>;
}

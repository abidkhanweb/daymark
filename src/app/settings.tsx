import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useBackup } from '@/features/backup/backup-context';
import { useDemoMode } from '@/features/demo/demo-mode';
import { canUseDemoMode } from '@/features/tasks/profile-utils';
import { useTasks } from '@/features/tasks/task-store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { checkAndInstallUpdate } from '@/services/app-updates';
import { styles } from '@/styles/screens/settings.styles';

export default function SettingsScreen() {
  const colors = useAppTheme();
  const router = useRouter();
  const { isDemo, enterDemo, exitDemo } = useDemoMode();
  const { profileName, profileNickname, setProfile } = useTasks();
  const { autoBackupEnabled, exportNow, importFromFile } = useBackup();
  const [name, setName] = useState(profileName);
  const [nickname, setNickname] = useState(profileNickname);
  const [busy, setBusy] = useState(false);
  const showDemo = isDemo || canUseDemoMode(nickname);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await action(); } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };
  const importData = () => Alert.alert('Import backup?', 'Your current personal data will be replaced.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Import', onPress: () => run(async () => { if (await importFromFile()) Alert.alert('Import complete', 'Your DayMark data has been restored.'); }) },
  ]);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}><SafeAreaView style={styles.screen} edges={['top']}><ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Close settings" onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.primaryContainer }]}><AppIcon name="arrow-back" size={22} tintColor={colors.primary} /></Pressable><View style={styles.headerCopy}><Text style={[styles.kicker, { color: colors.primary }]}>DAYMARK</Text><Text style={[styles.title, { color: colors.text }]}>Settings</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Profile, privacy, backups and app updates.</Text></View></View>

    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROFILE</Text><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <TextInput value={name} onChangeText={setName} placeholder="Name (optional)" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.outline }]} />
      <TextInput autoCapitalize="none" autoCorrect={false} value={nickname} onChangeText={setNickname} placeholder="Nickname (optional)" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.outline }]} />
      <Pressable onPress={() => { setProfile(name, nickname); Alert.alert('Profile saved'); }} style={[styles.save, { backgroundColor: colors.primary }]}><Text style={styles.saveText}>Save profile</Text></Pressable>
    </View></View>

    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BACKUP</Text>
      <SettingRow icon="file-download" title="Import backup" text="Restore tasks, notes, images and expenses." onPress={importData} disabled={busy || isDemo} />
      <SettingRow icon="backup" title={autoBackupEnabled ? 'Backup now' : 'Choose backup folder'} text={autoBackupEnabled ? 'Automatic File Manager backup is on.' : 'Choose once; DayMark keeps one file updated.'} onPress={() => run(async () => { if (await exportNow()) Alert.alert('Backup saved', 'Automatic File Manager backup is on.'); })} disabled={busy || isDemo} />
    </View>

    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APP</Text>
      <SettingRow icon="system-update-alt" title={busy ? 'Please wait…' : 'Install latest update'} text="Download a compatible EAS update and restart DayMark." disabled={busy} onPress={() => run(async () => {
        const result = await checkAndInstallUpdate();
        if (result === 'current') Alert.alert('DayMark is up to date');
        if (result === 'disabled') Alert.alert('No update available', 'Please try again later.');
      })} />
      {showDemo && <SettingRow icon={isDemo ? 'visibility-off' : 'visibility'} title={isDemo ? 'Exit Demo Mode' : 'Enter Demo Mode'} text={isDemo ? 'Fingerprint is required to return to personal data.' : 'Show sample data while keeping yours hidden.'} onPress={() => run(async () => {
        if (isDemo) await exitDemo();
        else { setProfile(name, nickname); enterDemo(); }
      })} disabled={busy} />}
    </View>
  </ScrollView></SafeAreaView></View>;
}

function SettingRow({ icon, title, text, onPress, disabled }: { icon: AppIconName; title: string; text: string; onPress: () => void; disabled?: boolean }) {
  const colors = useAppTheme();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.outline, opacity: disabled ? .5 : pressed ? .7 : 1 }]}><AppIcon name={icon} size={22} tintColor={colors.primary} /><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.rowText, { color: colors.textSecondary }]}>{text}</Text></View><AppIcon name="chevron-right" size={20} tintColor={colors.textSecondary} /></Pressable>;
}

import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useExpenses } from '@/features/expenses/expense-store';
import type { LedgerAccount, LedgerEntry } from '@/features/expenses/model';
import type { Category, Folder, Note, Task } from '@/features/tasks/model';
import { useTasks } from '@/features/tasks/task-store';
import { type TrashItem, useTrash } from '@/features/trash/trash-store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { removeNoteImage } from '@/services/note-images';
import { styles } from '@/styles/screens/trash.styles';
import { confirmAction } from '@/utils/confirm-action';
import { formatDate } from '@/utils/date';

const icons: Record<TrashItem['kind'], AppIconName> = { task: 'task-alt', note: 'notes', folder: 'folder', category: 'category', account: 'account-balance-wallet', entry: 'receipt-long' };

export default function TrashScreen() {
  const colors = useAppTheme();
  const router = useRouter();
  const { items, removeFromTrash, emptyTrash } = useTrash();
  const tasks = useTasks();
  const expenses = useExpenses();

  const restore = async (item: TrashItem) => {
    if (item.kind === 'task') await tasks.restoreTask(item.data as Task);
    if (item.kind === 'note') tasks.restoreNote(item.data as Note);
    if (item.kind === 'folder') tasks.restoreFolder(item.data as Folder);
    if (item.kind === 'category') tasks.restoreCategory(item.data as Category);
    if (item.kind === 'account') { const data = item.data as { account: LedgerAccount; entries: LedgerEntry[] }; expenses.restoreAccount(data.account, data.entries); }
    if (item.kind === 'entry') {
      const entry = item.data as LedgerEntry;
      if (!expenses.accounts.some((account) => account.id === entry.accountId)) { Alert.alert('Restore its account first', 'This entry belongs to a deleted account.'); return; }
      expenses.restoreEntry(entry);
    }
    removeFromTrash(item.id);
  };
  const permanentlyDelete = (item: TrashItem) => confirmAction('Delete permanently?', `“${item.label}” cannot be restored after this.`, () => {
    if (item.kind === 'note') (item.data as Note).imageUris.forEach(removeNoteImage);
    removeFromTrash(item.id);
  });

  return <View style={[styles.screen, { backgroundColor: colors.background }]}><SafeAreaView style={styles.screen} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Close recycle bin" onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.primaryContainer }]}><AppIcon name="arrow-back" tintColor={colors.primary} /></Pressable><View style={styles.headerCopy}><Text style={[styles.title, { color: colors.text }]}>Recycle bin</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>{items.length} deleted item{items.length === 1 ? '' : 's'}</Text></View>{!!items.length && <Pressable onPress={() => confirmAction('Empty recycle bin?', 'Every deleted item will be removed permanently.', () => { items.filter((item) => item.kind === 'note').forEach((item) => (item.data as Note).imageUris.forEach(removeNoteImage)); emptyTrash(); })} style={styles.emptyAll}><Text style={{ color: colors.error, fontWeight: '800' }}>Empty</Text></Pressable>}</View>
    {items.length ? <View style={styles.list}>{items.map((item) => <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}><AppIcon name={icons[item.kind]} tintColor={colors.primary} /></View><View style={styles.copy}><Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>{item.label}</Text><Text style={[styles.meta, { color: colors.textSecondary }]}>{item.kind} · {item.context} · {formatDate(item.deletedAt)}</Text></View><Pressable accessibilityLabel={`Restore ${item.label}`} onPress={() => void restore(item)} style={styles.action}><AppIcon name="restore" tintColor={colors.primary} /></Pressable><Pressable accessibilityLabel={`Delete ${item.label} permanently`} onPress={() => permanentlyDelete(item)} style={styles.action}><AppIcon name="delete-forever" tintColor={colors.error} /></Pressable></View>)}</View> : <View style={styles.empty}><AppIcon name="delete-outline" size={48} tintColor={colors.textSecondary} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Recycle bin is empty</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Deleted tasks, notes, folders and expenses will appear here.</Text></View>}
  </ScrollView></SafeAreaView></View>;
}

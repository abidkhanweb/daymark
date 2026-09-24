import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import { confirmAction } from '@/utils/confirm-action';
import { formatDate, formatTime } from '@/utils/date';

import { EntryForm } from './expense-forms';
import { useExpenses } from './expense-store';
import { entriesForPeriod, formatMoney, summarizeDailyEntries, summarizeEntries } from './expense-utils';
import type { LedgerAccount, LedgerEntry, LedgerPeriod, MoneyFlow } from './model';
import { styles } from './person-ledger.styles';

const periods: { value: LedgerPeriod; label: string }[] = [{ value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }];
const flowDetails: Record<MoneyFlow, { title: string; icon: AppIconName; outgoing: boolean }> = {
  given: { title: 'Money given', icon: 'north-east', outgoing: true },
  received: { title: 'Money received', icon: 'south-west', outgoing: false },
  purchase: { title: 'Purchase', icon: 'shopping-basket', outgoing: true },
  payment: { title: 'Payment', icon: 'payments', outgoing: false },
};

export function AccountLedger({ account, onBack }: { account: LedgerAccount; onBack: () => void }) {
  const colors = useAppTheme();
  const { entries, deleteEntry } = useExpenses();
  const [period, setPeriod] = useState<LedgerPeriod>('all');
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>();
  const isDaily = account.kind === 'daily';
  const accountEntries = useMemo(() => entries.filter((entry) => entry.accountId === account.id).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)), [account.id, entries]);
  const visibleEntries = entriesForPeriod(accountEntries, period);
  const personTotals = summarizeEntries(visibleEntries);
  const dailyTotals = summarizeDailyEntries(visibleEntries);
  const hasAdvance = isDaily && dailyTotals.advance > 0;
  const balance = isDaily ? (hasAdvance ? dailyTotals.advance : dailyTotals.due) : Math.abs(personTotals.pending);
  const balanceLabel = isDaily ? (hasAdvance ? 'Advance paid' : 'Amount due') : (personTotals.pending >= 0 ? 'Pending from them' : 'Advance received');
  const stats = isDaily
    ? [{ label: 'Purchased', value: dailyTotals.purchased, icon: 'shopping-basket' as const, color: colors.error }, { label: 'Paid', value: dailyTotals.paid, icon: 'payments' as const, color: colors.success }, { label: hasAdvance ? 'Advance' : 'Due', value: hasAdvance ? dailyTotals.advance : dailyTotals.due, icon: 'account-balance-wallet' as const, color: colors.primary }]
    : [{ label: 'Given', value: personTotals.given, icon: 'north-east' as const, color: colors.error }, { label: 'Received', value: personTotals.received, icon: 'south-west' as const, color: colors.success }, { label: 'Pending', value: personTotals.pending, icon: 'account-balance-wallet' as const, color: colors.primary }];

  return <View style={[styles.screen, { backgroundColor: colors.background }]}><SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Back to accounts" onPress={onBack} style={[styles.back, { backgroundColor: colors.surface }]}><AppIcon name="arrow-back" tintColor={colors.text} /></Pressable><View style={styles.headerCopy}><Text style={[styles.kicker, { color: colors.primary }]}>{isDaily ? 'DAILY ACCOUNT' : 'PERSON LEDGER'}</Text><Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{account.name}</Text></View></View>
    <View style={[styles.balance, { backgroundColor: colors.primary }]}><Text style={styles.balanceLabel}>{balanceLabel}</Text><Text style={styles.balanceValue}>{formatMoney(balance)}</Text><Text style={styles.balanceHint}>{periods.find((item) => item.value === period)?.label}</Text></View>
    <View style={styles.periods}>{periods.map((item) => <Pressable key={item.value} onPress={() => setPeriod(item.value)} style={[styles.period, { backgroundColor: period === item.value ? colors.primaryContainer : colors.surface, borderColor: period === item.value ? colors.primary : colors.outline }]}><Text style={{ color: colors.text, fontWeight: '700' }}>{item.label}</Text></Pressable>)}</View>
    <View style={styles.stats}>{stats.map((item) => <MoneyStat key={item.label} {...item} />)}</View>
    <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.text }]}>Timeline</Text><Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>{visibleEntries.length} entr{visibleEntries.length === 1 ? 'y' : 'ies'}</Text></View></View>
    <View style={styles.timeline}>{visibleEntries.map((entry) => {
      const detail = flowDetails[entry.flow];
      const methods = entry.paymentMethods.map((method) => method === 'cash' ? 'Cash' : 'Online').join(' + ');
      return <View key={entry.id} style={[styles.entry, { backgroundColor: colors.surface, borderColor: colors.outline }]}><Pressable accessibilityLabel="View and edit entry" onPress={() => setEditingEntry(entry)} style={({ pressed }) => [styles.entryOpen, { opacity: pressed ? .72 : 1 }]}>
        <View style={[styles.entryIcon, { backgroundColor: detail.outgoing ? '#FFDAD6' : '#D7F4D1' }]}><AppIcon name={detail.icon} size={19} tintColor={detail.outgoing ? colors.error : colors.success} /></View>
        <View style={styles.entryCopy}><Text style={[styles.entryTitle, { color: colors.text }]}>{detail.title}</Text><Text style={[styles.entryMeta, { color: colors.textSecondary }]}>{formatDate(entry.occurredAt)} · {formatTime(entry.occurredAt)}{methods ? ` · ${methods}` : ''}{entry.note ? ` · ${entry.note}` : ''}</Text></View>
        <Text style={[styles.entryAmount, { color: detail.outgoing ? colors.error : colors.success }]}>{detail.outgoing ? '+' : '-'}{formatMoney(entry.amountPaise)}</Text>
      </Pressable><Pressable accessibilityLabel="Delete entry" onPress={() => confirmAction('Delete entry?', `${formatMoney(entry.amountPaise)} will be removed from ${account.name}.`, () => deleteEntry(entry.id))} style={styles.entryDelete}><AppIcon name="delete-outline" size={19} tintColor={colors.textSecondary} /></Pressable></View>;
    })}{!visibleEntries.length && <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name="receipt-long" size={28} tintColor={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.text }]}>No entries in this period</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>{isDaily ? 'Add a purchase or payment to start the timeline.' : 'Add money given or received to start the timeline.'}</Text></View>}</View>
  </ScrollView></SafeAreaView><FloatingActionButton label={`Add entry for ${account.name}`} onPress={() => setEditingEntry(null)} />{editingEntry !== undefined && <EntryForm account={account} entry={editingEntry} onClose={() => setEditingEntry(undefined)} />}</View>;
}

function MoneyStat({ label, value, icon, color }: { label: string; value: number; icon: AppIconName; color: string }) {
  const colors = useAppTheme();
  return <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name={icon} size={19} tintColor={color} /><Text style={[styles.statValue, { color: colors.text }]}>{formatMoney(value)}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text></View>;
}

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { AccountLedger } from '@/features/expenses/account-ledger';
import { AccountForm } from '@/features/expenses/expense-forms';
import { useExpenses } from '@/features/expenses/expense-store';
import { formatMoney, summarizeDailyBalances, summarizeDailyEntries, summarizeEntries } from '@/features/expenses/expense-utils';
import type { AccountKind, LedgerAccount } from '@/features/expenses/model';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from '@/styles/screens/expenses.styles';
import { confirmAction } from '@/utils/confirm-action';

export default function ExpensesScreen() {
  const colors = useAppTheme();
  const { accounts, entries, deleteAccount } = useExpenses();
  const [section, setSection] = useState<AccountKind>('person');
  const [selected, setSelected] = useState<LedgerAccount | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const isDaily = section === 'daily';
  const visibleAccounts = useMemo(() => accounts.filter((account) => account.kind === section).sort((a, b) => a.name.localeCompare(b.name)), [accounts, section]);
  const visibleIds = useMemo(() => new Set(visibleAccounts.map((account) => account.id)), [visibleAccounts]);
  const visibleEntries = useMemo(() => entries.filter((entry) => visibleIds.has(entry.accountId)), [entries, visibleIds]);
  const personTotals = summarizeEntries(visibleEntries);
  const dailyTotals = summarizeDailyEntries(visibleEntries);
  const dailyBalances = summarizeDailyBalances(visibleEntries);
  const totalDailyDue = dailyBalances.due;
  const totalDailyAdvance = dailyBalances.advance;

  if (selected) return <AccountLedger account={selected} onBack={() => setSelected(null)} />;

  const overviewValue = isDaily ? totalDailyDue : personTotals.pending;
  const overviewLabel = isDaily ? 'TOTAL DUE' : 'TOTAL PENDING';
  const overviewHint = `${visibleAccounts.length} ${isDaily ? (visibleAccounts.length === 1 ? 'account' : 'accounts') : (visibleAccounts.length === 1 ? 'person' : 'people')} tracked${isDaily && totalDailyAdvance ? ` · ${formatMoney(totalDailyAdvance)} advance` : ''}`;

  return <View style={[styles.screen, { backgroundColor: colors.background }]}><SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View><Text style={[styles.kicker, { color: colors.primary }]}>MONEY LEDGER</Text><Text style={[styles.title, { color: colors.text }]}>Expenses</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track personal lending and everyday shop or service balances.</Text></View>
    <View style={styles.sections}><SectionButton label="People" icon="people-outline" selected={!isDaily} onPress={() => setSection('person')} /><SectionButton label="Daily accounts" icon="storefront" selected={isDaily} onPress={() => setSection('daily')} /></View>
    <View style={[styles.overview, { backgroundColor: colors.primary }]}><View><Text style={styles.overviewLabel}>{overviewLabel}</Text><Text style={styles.overviewValue}>{formatMoney(overviewValue)}</Text><Text style={styles.overviewHint}>{overviewHint}</Text></View><AppIcon name={isDaily ? 'storefront' : 'account-balance-wallet'} size={44} tintColor="#FFFFFFCC" /></View>
    <View style={styles.stats}>{isDaily ? <><Summary label="Total purchased" value={dailyTotals.purchased} color={colors.error} /><Summary label="Total paid" value={dailyTotals.paid} color={colors.success} /><Summary label="Total advance" value={totalDailyAdvance} color={colors.primary} /></> : <><Summary label="Total given" value={personTotals.given} color={colors.error} /><Summary label="Total received" value={personTotals.received} color={colors.success} /></>}</View>
    <View><Text style={[styles.sectionTitle, { color: colors.text }]}>{isDaily ? 'Daily accounts' : 'People'}</Text><Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>{isDaily ? 'Milkman, vegetable shop, meat shop and other regular services.' : 'Tap a person to view weekly, monthly and full history.'}</Text></View>
    <View style={styles.people}>{visibleAccounts.map((account) => <AccountCard key={account.id} account={account} entries={entries} onOpen={() => setSelected(account)} onDelete={() => confirmAction(`Delete ${isDaily ? 'daily account' : 'person'}?`, `${account.name} and all ledger entries will be permanently deleted.`, () => deleteAccount(account.id))} />)}{!visibleAccounts.length && <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name={isDaily ? 'add-business' : 'group-add'} size={28} tintColor={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>Add your first {isDaily ? 'daily account' : 'person'}</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>{isDaily ? 'Add a shop or service, then record purchases and payments to see what is due.' : 'Add someone, then record money given or received to keep the remaining balance accurate.'}</Text><Pressable onPress={() => setShowAccountForm(true)} style={[styles.emptyButton, { backgroundColor: colors.primary }]}><Text style={styles.emptyButtonText}>Add {isDaily ? 'account' : 'person'}</Text></Pressable></View>}</View>
  </ScrollView></SafeAreaView><FloatingActionButton icon={isDaily ? 'add-business' : 'person-add'} label={`Add ${isDaily ? 'daily account' : 'person'}`} onPress={() => setShowAccountForm(true)} />{showAccountForm && <AccountForm kind={section} onClose={() => setShowAccountForm(false)} onCreated={() => setShowAccountForm(false)} />}</View>;
}

function SectionButton({ label, icon, selected, onPress }: { label: string; icon: 'people-outline' | 'storefront'; selected: boolean; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.sectionButton, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><AppIcon name={icon} tintColor={selected ? colors.primary : colors.textSecondary} /><Text style={{ color: colors.text, fontWeight: '800' }}>{label}</Text></Pressable>;
}

function AccountCard({ account, entries, onOpen, onDelete }: { account: LedgerAccount; entries: ReturnType<typeof useExpenses>['entries']; onOpen: () => void; onDelete: () => void }) {
  const colors = useAppTheme();
  const accountEntries = entries.filter((entry) => entry.accountId === account.id);
  const isDaily = account.kind === 'daily';
  const personTotals = summarizeEntries(accountEntries);
  const dailyTotals = summarizeDailyEntries(accountEntries);
  const balance = isDaily ? (dailyTotals.due || dailyTotals.advance) : personTotals.pending;
  const balanceLabel = isDaily ? (dailyTotals.advance ? 'advance' : 'due') : (balance >= 0 ? 'pending' : 'advance');
  const meta = isDaily ? `Purchased ${formatMoney(dailyTotals.purchased)} · Paid ${formatMoney(dailyTotals.paid)}` : `Given ${formatMoney(personTotals.given)} · Received ${formatMoney(personTotals.received)}`;
  const balanceColor = isDaily ? (dailyTotals.due ? colors.error : colors.success) : (balance > 0 ? colors.error : colors.success);
  return <View style={[styles.person, { backgroundColor: colors.surface, borderColor: colors.outline }]}><Pressable onPress={onOpen} style={({ pressed }) => [styles.personOpen, { opacity: pressed ? .72 : 1 }]}><View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>{isDaily ? <AppIcon name="storefront" size={21} tintColor={colors.primary} /> : <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>{account.name.slice(0, 1).toLocaleUpperCase()}</Text>}</View><View style={styles.personCopy}><Text style={[styles.personName, { color: colors.text }]}>{account.name}</Text><Text style={[styles.personMeta, { color: colors.textSecondary }]}>{meta}</Text></View><View style={styles.personBalance}><Text style={[styles.personAmount, { color: balanceColor }]}>{formatMoney(Math.abs(balance))}</Text><Text style={[styles.personPending, { color: colors.textSecondary }]}>{balanceLabel}</Text></View></Pressable><Pressable accessibilityLabel={`Delete ${account.name}`} hitSlop={6} onPress={onDelete} style={styles.personDelete}><AppIcon name="delete-outline" size={20} tintColor={colors.error} /></Pressable></View>;
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useAppTheme();
  return <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.summaryDot, { backgroundColor: color }]} /><View><Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(value)}</Text><Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text></View></View>;
}

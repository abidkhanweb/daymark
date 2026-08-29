import { styles } from '@/styles/screens/expenses.styles';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { PersonForm } from '@/features/expenses/expense-forms';
import { useExpenses } from '@/features/expenses/expense-store';
import { formatMoney, summarizeEntries } from '@/features/expenses/expense-utils';
import type { LedgerPerson } from '@/features/expenses/model';
import { PersonLedger } from '@/features/expenses/person-ledger';
import { useAppTheme } from '@/hooks/use-app-theme';
import { confirmAction } from '@/utils/confirm-action';

export default function ExpensesScreen() {
  const colors = useAppTheme();
  const { people, entries, deletePerson } = useExpenses();
  const [selected, setSelected] = useState<LedgerPerson | null>(null);
  const [showPerson, setShowPerson] = useState(false);
  const totals = summarizeEntries(entries);
  const orderedPeople = useMemo(() => [...people].sort((a, b) => a.name.localeCompare(b.name)), [people]);

  if (selected) return <PersonLedger person={selected} onBack={() => setSelected(null)} />;

  return <View style={[styles.screen, { backgroundColor: colors.background }]}><SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View><Text style={[styles.kicker, { color: colors.primary }]}>MONEY LEDGER</Text><Text style={[styles.title, { color: colors.text }]}>Expenses</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track money given, received and still pending by person.</Text></View>
    <View style={[styles.overview, { backgroundColor: colors.primary }]}><View><Text style={styles.overviewLabel}>TOTAL PENDING</Text><Text style={styles.overviewValue}>{formatMoney(totals.pending)}</Text><Text style={styles.overviewHint}>{people.length} {people.length === 1 ? 'person' : 'people'} tracked</Text></View><AppIcon name="account-balance-wallet" size={44} tintColor="#FFFFFFCC" /></View>
    <View style={styles.stats}><Summary label="Total given" value={totals.given} color={colors.error} /><Summary label="Total received" value={totals.received} color={colors.success} /></View>
    <View><Text style={[styles.sectionTitle, { color: colors.text }]}>People</Text><Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>Tap a person to view weekly, monthly and full history.</Text></View>
    <View style={styles.people}>{orderedPeople.map((person) => {
      const personTotals = summarizeEntries(entries.filter((entry) => entry.personId === person.id));
      return <View key={person.id} style={[styles.person, { backgroundColor: colors.surface, borderColor: colors.outline }]}><Pressable onPress={() => setSelected(person)} style={({ pressed }) => [styles.personOpen, { opacity: pressed ? .72 : 1 }]}><View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}><Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>{person.name.slice(0, 1).toLocaleUpperCase()}</Text></View><View style={styles.personCopy}><Text style={[styles.personName, { color: colors.text }]}>{person.name}</Text><Text style={[styles.personMeta, { color: colors.textSecondary }]}>Given {formatMoney(personTotals.given)} · Received {formatMoney(personTotals.received)}</Text></View><View style={styles.personBalance}><Text style={[styles.personAmount, { color: personTotals.pending > 0 ? colors.error : colors.success }]}>{formatMoney(personTotals.pending)}</Text><Text style={[styles.personPending, { color: colors.textSecondary }]}>{personTotals.pending >= 0 ? 'pending' : 'advance'}</Text></View></Pressable><Pressable accessibilityLabel={`Delete ${person.name}`} hitSlop={6} onPress={() => confirmAction('Delete person?', `${person.name} and all ledger entries will be permanently deleted.`, () => deletePerson(person.id))} style={styles.personDelete}><AppIcon name="delete-outline" size={20} tintColor={colors.error} /></Pressable></View>;
    })}{!orderedPeople.length && <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name="group-add" size={28} tintColor={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>Add your first person</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add someone, then record money given or received to keep the remaining balance accurate.</Text><Pressable onPress={() => setShowPerson(true)} style={[styles.emptyButton, { backgroundColor: colors.primary }]}><Text style={styles.emptyButtonText}>Add person</Text></Pressable></View>}</View>
  </ScrollView></SafeAreaView><FloatingActionButton icon="person-add" label="Add person" onPress={() => setShowPerson(true)} />{showPerson && <PersonForm onClose={() => setShowPerson(false)} onCreated={() => setShowPerson(false)} />}</View>;
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useAppTheme();
  return <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.summaryDot, { backgroundColor: color }]} /><View><Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(value)}</Text><Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text></View></View>;
}

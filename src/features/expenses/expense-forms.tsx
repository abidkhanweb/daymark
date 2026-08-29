import { styles } from './expense-forms.styles';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { DateTimeField } from '@/components/ui/date-time-field';
import { useAppTheme } from '@/hooks/use-app-theme';

import { useExpenses } from './expense-store';
import { parseAmountToPaise } from './expense-utils';
import type { LedgerEntry, LedgerPerson, MoneyFlow, PaymentMethod } from './model';

export function PersonForm({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const colors = useAppTheme();
  const { addPerson } = useExpenses();
  const [name, setName] = useState('');
  const save = () => {
    const id = addPerson(name);
    if (!id) { Alert.alert('Name already exists', 'Enter a new person name.'); return; }
    onCreated(id);
  };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={styles.backdrop}><View style={[styles.dialog, { backgroundColor: colors.surface }]}><View style={styles.dialogTitle}><View style={[styles.dialogIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name="person-add" tintColor={colors.primary} /></View><View><Text style={[styles.title, { color: colors.text }]}>Add person</Text><Text style={[styles.caption, { color: colors.textSecondary }]}>Keep one balance and timeline per person.</Text></View></View><TextInput autoFocus value={name} onChangeText={setName} onSubmitEditing={save} placeholder="Person name" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.outline }]} /><View style={styles.actions}><Pressable onPress={onClose}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text></Pressable><Pressable onPress={save} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>Add</Text></Pressable></View></View></View></Modal>;
}

export function EntryForm({ person, entry, onClose }: { person: LedgerPerson; entry?: LedgerEntry | null; onClose: () => void }) {
  const colors = useAppTheme();
  const { addEntry, updateEntry } = useExpenses();
  const [flow, setFlow] = useState<MoneyFlow>(entry?.flow ?? 'given');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(entry?.paymentMethods ?? ['online']);
  const [amount, setAmount] = useState(entry ? String(entry.amountPaise / 100) : '');
  const [occurredAt, setOccurredAt] = useState(entry ? new Date(entry.occurredAt) : new Date());
  const [note, setNote] = useState(entry?.note ?? '');
  const toggleMethod = (method: PaymentMethod) => setPaymentMethods((current) => current.includes(method) ? current.filter((item) => item !== method) : [...current, method]);
  const save = () => {
    const amountPaise = parseAmountToPaise(amount);
    if (!amountPaise) { Alert.alert('Valid amount required', 'Enter an amount greater than zero with up to two decimal places.'); return; }
    if (!paymentMethods.length) { Alert.alert('Payment method required', 'Select Cash, Online, or both.'); return; }
    const input = { personId: person.id, flow, paymentMethods, amountPaise, occurredAt: occurredAt.toISOString(), note: note.trim() };
    if (entry) updateEntry(entry.id, input); else addEntry(input);
    onClose();
  };
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
      <View style={styles.sheetHeader}><Pressable hitSlop={12} onPress={onClose}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text></Pressable><Text style={[styles.sheetTitle, { color: colors.text }]}>{entry ? 'Edit money entry' : 'Money entry'}</Text><Pressable hitSlop={12} onPress={save}><Text style={{ color: colors.primary, fontWeight: '800' }}>Save</Text></Pressable></View>
      <View><Text style={[styles.personName, { color: colors.text }]}>{person.name}</Text><Text style={[styles.caption, { color: colors.textSecondary }]}>Record money given or received.</Text></View>
      <View style={styles.flowRow}><FlowButton label="Given" icon="north-east" selected={flow === 'given'} onPress={() => setFlow('given')} /><FlowButton label="Received" icon="south-west" selected={flow === 'received'} onPress={() => setFlow('received')} /></View>
      <View><Text style={[styles.label, { color: colors.text }]}>Amount</Text><View style={[styles.amountBox, { backgroundColor: colors.surface, borderColor: colors.outline }]}><Text style={[styles.currency, { color: colors.textSecondary }]}>₹</Text><TextInput autoFocus keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={colors.textSecondary} style={[styles.amountInput, { color: colors.text }]} /></View></View>
      <View><Text style={[styles.label, { color: colors.text }]}>Payment method</Text><View style={styles.methodRow}><MethodButton label="Online" selected={paymentMethods.includes('online')} onPress={() => toggleMethod('online')} /><MethodButton label="Cash" selected={paymentMethods.includes('cash')} onPress={() => toggleMethod('cash')} /></View><Text style={[styles.methodHint, { color: colors.textSecondary }]}>Select both for a mixed payment and mention the split in notes.</Text></View>
      <View><Text style={[styles.label, { color: colors.text }]}>Date and time</Text><DateTimeField label="Money entry date and time" maximumDate={new Date()} value={occurredAt} onChange={setOccurredAt} /></View>
      <View><Text style={[styles.label, { color: colors.text }]}>Note (optional)</Text><TextInput value={note} onChangeText={setNote} placeholder="e.g. ₹500 cash + ₹500 online" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.outline }]} /></View>
    </SafeAreaView>
  </Modal>;
}

function FlowButton({ label, icon, selected, onPress }: { label: string; icon: 'north-east' | 'south-west'; selected: boolean; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable onPress={onPress} style={[styles.flowButton, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><AppIcon name={icon} tintColor={selected ? colors.primary : colors.textSecondary} /><Text style={{ color: colors.text, fontWeight: '800' }}>{label}</Text></Pressable>;
}

function MethodButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.methodButton, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><AppIcon name={selected ? 'check-box' : 'check-box-outline-blank'} tintColor={selected ? colors.primary : colors.textSecondary} /><Text style={{ color: colors.text, fontWeight: '800' }}>{label}</Text></Pressable>;
}

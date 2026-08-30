import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { DateTimeField } from '@/components/ui/date-time-field';
import { useAppTheme } from '@/hooks/use-app-theme';

import { styles } from './expense-forms.styles';
import { useExpenses } from './expense-store';
import { formatMoney, parseAmountToPaise } from './expense-utils';
import type { AccountKind, LedgerAccount, LedgerEntry, MoneyFlow, PaymentMethod } from './model';

type PurchasePaymentStatus = 'unpaid' | 'full' | 'partial';

export function AccountForm({ kind, onClose, onCreated }: { kind: AccountKind; onClose: () => void; onCreated: (id: string) => void }) {
  const colors = useAppTheme();
  const { addAccount } = useExpenses();
  const [name, setName] = useState('');
  const isDaily = kind === 'daily';
  const save = () => {
    const id = addAccount(name, kind);
    if (!id) {
      Alert.alert('Name already exists', `Enter a new ${isDaily ? 'shop or service' : 'person'} name.`);
      return;
    }
    onCreated(id);
  };

  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={[styles.dialog, { backgroundColor: colors.surface }]}>
      <View style={styles.dialogTitle}>
        <View style={[styles.dialogIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name={isDaily ? 'storefront' : 'person-add'} tintColor={colors.primary} /></View>
        <View><Text style={[styles.title, { color: colors.text }]}>Add {isDaily ? 'daily account' : 'person'}</Text><Text style={[styles.caption, { color: colors.textSecondary }]}>{isDaily ? 'Track purchases, payments and due balance.' : 'Keep one balance and timeline per person.'}</Text></View>
      </View>
      <TextInput autoFocus value={name} onChangeText={setName} onSubmitEditing={save} placeholder={isDaily ? 'e.g. Milkman or vegetable shop' : 'Person name'} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.outline }]} />
      <View style={styles.actions}><Pressable onPress={onClose}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text></Pressable><Pressable onPress={save} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>Add</Text></Pressable></View>
    </View></View>
  </Modal>;
}

export function EntryForm({ account, entry, onClose }: { account: LedgerAccount; entry?: LedgerEntry | null; onClose: () => void }) {
  const colors = useAppTheme();
  const { addEntries, addEntry, updateEntry } = useExpenses();
  const isDaily = account.kind === 'daily';
  const [flow, setFlow] = useState<MoneyFlow>(entry?.flow ?? (isDaily ? 'purchase' : 'given'));
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(entry?.paymentMethods ?? ['online']);
  const [amount, setAmount] = useState(entry ? String(entry.amountPaise / 100) : '');
  const [paidNow, setPaidNow] = useState('');
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState<PurchasePaymentStatus>('unpaid');
  const [occurredAt, setOccurredAt] = useState(entry ? new Date(entry.occurredAt) : new Date());
  const [note, setNote] = useState(entry?.note ?? '');
  const showPurchasePayment = isDaily && flow === 'purchase' && !entry;
  const purchaseAmountPaise = parseAmountToPaise(amount) ?? 0;
  const paidNowPaise = purchasePaymentStatus === 'full' ? purchaseAmountPaise : purchasePaymentStatus === 'partial' ? parseAmountToPaise(paidNow) ?? 0 : 0;
  const recordsPayment = flow !== 'purchase' || (showPurchasePayment && purchasePaymentStatus !== 'unpaid');
  const toggleMethod = (method: PaymentMethod) => setPaymentMethods((current) => current.includes(method) ? current.filter((item) => item !== method) : [...current, method]);
  const save = () => {
    const amountPaise = parseAmountToPaise(amount);
    if (!amountPaise) {
      Alert.alert('Valid amount required', 'Enter an amount greater than zero with up to two decimal places.');
      return;
    }
    if (showPurchasePayment && purchasePaymentStatus === 'partial' && !paidNowPaise) {
      Alert.alert('Valid payment required', 'Enter a paid amount greater than zero with up to two decimal places.');
      return;
    }
    if (showPurchasePayment && purchasePaymentStatus === 'partial' && paidNowPaise >= amountPaise) {
      Alert.alert('Partial payment must be lower', 'Choose Paid in full when the complete purchase amount was paid.');
      return;
    }
    if (recordsPayment && !paymentMethods.length) {
      Alert.alert('Payment method required', 'Select Cash, Online, or both.');
      return;
    }
    const input = { accountId: account.id, flow, paymentMethods: flow === 'purchase' ? [] : paymentMethods, amountPaise, occurredAt: occurredAt.toISOString(), note: note.trim() };
    if (entry) updateEntry(entry.id, input);
    else if (showPurchasePayment && paidNowPaise) addEntries([input, { ...input, flow: 'payment', paymentMethods, amountPaise: paidNowPaise, note: 'Paid with purchase' }]);
    else addEntry(input);
    onClose();
  };

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
      <View style={styles.sheetHeader}><Pressable hitSlop={12} onPress={onClose}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text></Pressable><Text style={[styles.sheetTitle, { color: colors.text }]}>{entry ? 'Edit entry' : 'New entry'}</Text><Pressable hitSlop={12} onPress={save}><Text style={{ color: colors.primary, fontWeight: '800' }}>Save</Text></Pressable></View>
      <View><Text style={[styles.personName, { color: colors.text }]}>{account.name}</Text><Text style={[styles.caption, { color: colors.textSecondary }]}>{isDaily ? 'Record a purchase or payment.' : 'Record money given or received.'}</Text></View>
      <View style={styles.flowRow}>{isDaily
        ? <><FlowButton label="Purchase" icon="shopping-basket" selected={flow === 'purchase'} onPress={() => setFlow('purchase')} /><FlowButton label="Payment" icon="payments" selected={flow === 'payment'} onPress={() => setFlow('payment')} /></>
        : <><FlowButton label="Given" icon="north-east" selected={flow === 'given'} onPress={() => setFlow('given')} /><FlowButton label="Received" icon="south-west" selected={flow === 'received'} onPress={() => setFlow('received')} /></>}
      </View>
      <View><Text style={[styles.label, { color: colors.text }]}>Amount</Text><View style={[styles.amountBox, { backgroundColor: colors.surface, borderColor: colors.outline }]}><Text style={[styles.currency, { color: colors.textSecondary }]}>₹</Text><TextInput autoFocus keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={colors.textSecondary} style={[styles.amountInput, { color: colors.text }]} /></View></View>
      {showPurchasePayment && <View><Text style={[styles.label, { color: colors.text }]}>Payment status</Text><View style={styles.paymentStatusRow}><PaymentStatusButton label="Unpaid" selected={purchasePaymentStatus === 'unpaid'} onPress={() => setPurchasePaymentStatus('unpaid')} /><PaymentStatusButton label="Paid in full" selected={purchasePaymentStatus === 'full'} onPress={() => setPurchasePaymentStatus('full')} /><PaymentStatusButton label="Partially paid" selected={purchasePaymentStatus === 'partial'} onPress={() => setPurchasePaymentStatus('partial')} /></View>{purchasePaymentStatus === 'partial' && <><Text style={[styles.label, styles.paidAmountLabel, { color: colors.text }]}>Amount paid</Text><View style={[styles.amountBox, { backgroundColor: colors.surface, borderColor: colors.outline }]}><Text style={[styles.currency, { color: colors.textSecondary }]}>₹</Text><TextInput keyboardType="decimal-pad" value={paidNow} onChangeText={setPaidNow} placeholder="0" placeholderTextColor={colors.textSecondary} style={[styles.amountInput, { color: colors.text }]} /></View></>}{purchaseAmountPaise > 0 && <View style={[styles.pendingPreview, { backgroundColor: colors.primaryContainer }]}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Pending after save</Text><Text style={{ color: colors.primary, fontWeight: '900' }}>{formatMoney(Math.max(purchaseAmountPaise - paidNowPaise, 0))}</Text></View>}</View>}
      {recordsPayment && <View><Text style={[styles.label, { color: colors.text }]}>Payment method</Text><View style={styles.methodRow}><MethodButton label="Online" selected={paymentMethods.includes('online')} onPress={() => toggleMethod('online')} /><MethodButton label="Cash" selected={paymentMethods.includes('cash')} onPress={() => toggleMethod('cash')} /></View><Text style={[styles.methodHint, { color: colors.textSecondary }]}>Select both for a mixed payment and mention the split in notes.</Text></View>}
      <View><Text style={[styles.label, { color: colors.text }]}>Date and time</Text><DateTimeField label="Entry date and time" maximumDate={new Date()} value={occurredAt} onChange={setOccurredAt} /></View>
      <View><Text style={[styles.label, { color: colors.text }]}>{flow === 'purchase' ? 'Items or note (optional)' : 'Note (optional)'}</Text><TextInput value={note} onChangeText={setNote} placeholder={flow === 'purchase' ? 'e.g. Milk and curd' : 'e.g. ₹500 cash + ₹500 online'} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.outline }]} /></View>
    </SafeAreaView>
  </Modal>;
}

function FlowButton({ label, icon, selected, onPress }: { label: string; icon: 'north-east' | 'south-west' | 'shopping-basket' | 'payments'; selected: boolean; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable onPress={onPress} style={[styles.flowButton, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><AppIcon name={icon} tintColor={selected ? colors.primary : colors.textSecondary} /><Text style={{ color: colors.text, fontWeight: '800' }}>{label}</Text></Pressable>;
}

function MethodButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.methodButton, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><AppIcon name={selected ? 'check-box' : 'check-box-outline-blank'} tintColor={selected ? colors.primary : colors.textSecondary} /><Text style={{ color: colors.text, fontWeight: '800' }}>{label}</Text></Pressable>;
}

function PaymentStatusButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.paymentStatusButton, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><Text style={{ color: selected ? colors.primary : colors.text, fontWeight: '800', textAlign: 'center' }}>{label}</Text></Pressable>;
}

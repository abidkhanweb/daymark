import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000077', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }, dialog: { width: '100%', maxWidth: 440, borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.xl }, dialogTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, dialogIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 21, fontWeight: '800' }, caption: { fontSize: 12, marginTop: 3 }, input: { height: 52, borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.lg, fontSize: 16 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.xl }, primaryButton: { paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.full }, primaryText: { color: '#FFFFFF', fontWeight: '800' },
  sheet: { flex: 1, padding: Spacing.xl, gap: Spacing.xl }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sheetTitle: { fontSize: 18, fontWeight: '800' }, personName: { fontSize: 28, fontWeight: '800' }, flowRow: { flexDirection: 'row', gap: Spacing.md }, flowButton: { flex: 1, height: 64, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm }, label: { fontSize: 13, fontWeight: '800', marginBottom: Spacing.sm }, amountBox: { height: 64, borderWidth: 1, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg }, currency: { fontSize: 27, fontWeight: '800' }, amountInput: { flex: 1, fontSize: 28, fontWeight: '800', paddingHorizontal: Spacing.sm },
  paymentStatusRow: { flexDirection: 'row', gap: Spacing.sm },
  paymentStatusButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, alignItems: 'center', justifyContent: 'center' },
  paidAmountLabel: { marginTop: Spacing.lg },
  pendingPreview: { minHeight: 48, marginTop: Spacing.sm, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodRow: { flexDirection: 'row', gap: Spacing.md },
  methodButton: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  methodHint: { fontSize: 11, lineHeight: 16, marginTop: Spacing.sm },
});

import { Platform, StyleSheet } from 'react-native';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.xl, paddingTop: Platform.OS === 'web' ? 72 : Spacing.xl, paddingBottom: 80, gap: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, back: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, title: { fontSize: 29, fontWeight: '800' }, subtitle: { fontSize: 13, marginTop: 3 }, emptyAll: { minHeight: 42, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  list: { gap: Spacing.sm }, card: { minHeight: 76, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, label: { fontSize: 15, fontWeight: '800' }, meta: { fontSize: 11, marginTop: 3, textTransform: 'capitalize' }, action: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }, emptyTitle: { fontSize: 19, fontWeight: '800' }, emptyText: { textAlign: 'center', fontSize: 13 },
});

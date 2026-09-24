import { Platform, StyleSheet } from 'react-native';

import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { width: '100%' },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.xl, paddingTop: Platform.OS === 'web' ? 108 : Spacing.xl, paddingBottom: BottomTabInset + 80, gap: Spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  headerCopy: { flex: 1, minWidth: 0 },
  back: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 31, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.1 },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  input: { height: 52, borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.lg, fontSize: 16 },
  save: { alignSelf: 'flex-end', borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: 11 },
  saveText: { color: '#FFFFFF', fontWeight: '800' },
  row: { minHeight: 68, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  rowText: { fontSize: 11, lineHeight: 16, marginTop: 2 },
});

import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 }, details: { gap: 6 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { flex: 1, fontSize: 16, fontWeight: '600' }, notes: { fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }, dot: { width: 7, height: 7, borderRadius: 4 }, metaText: { fontSize: 12 }, repeatMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  subtasks: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, gap: 7 }, subtask: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, subtaskText: { flex: 1, fontSize: 13 },
});

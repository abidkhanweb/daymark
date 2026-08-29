import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  bar: { position: 'absolute', zIndex: 10, top: Spacing.md, width: '92%', maxWidth: 560, alignSelf: 'center', height: 64, borderWidth: 1, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm, gap: Spacing.sm, shadowColor: '#1D1B20', shadowOpacity: .1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  tab: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: Radius.full },
});

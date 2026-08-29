import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  button: { minHeight: 48, flex: 1, borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  text: { fontSize: 14, fontWeight: '700' },
});

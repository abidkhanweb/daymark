import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  button: { position: 'absolute', zIndex: 5, right: Spacing.xl, bottom: Spacing.xl, width: 60, height: 60, borderRadius: 19, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: .25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});

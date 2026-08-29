import { styles } from './date-time-field.styles';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { formatDate, formatTime } from '@/utils/date';

import { AppIcon } from './app-icon';
import type { DateTimeFieldProps } from './date-time-field.types';

export function DateTimeField({ value, onChange, minimumDate, maximumDate }: DateTimeFieldProps) {
  const colors = useAppTheme();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const update = (_event: DateTimePickerEvent, selected?: Date) => {
    setMode(null);
    if (selected) onChange(selected);
  };

  return <View style={styles.row}>
    <Pressable onPress={() => setMode('date')} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name="calendar-today" size={19} tintColor={colors.primary} /><Text style={[styles.text, { color: colors.text }]}>{formatDate(value, true)}</Text></Pressable>
    <Pressable onPress={() => setMode('time')} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name="schedule" size={19} tintColor={colors.primary} /><Text style={[styles.text, { color: colors.text }]}>{formatTime(value)}</Text></Pressable>
    {mode && <DateTimePicker value={value} mode={mode} minimumDate={minimumDate} maximumDate={maximumDate} onChange={update} />}
  </View>;
}

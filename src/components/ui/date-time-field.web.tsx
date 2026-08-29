import { CSSProperties } from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';

import type { DateTimeFieldProps } from './date-time-field.types';
const toInputValue = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export function DateTimeField({ value, onChange, label = 'Date and time', minimumDate, maximumDate }: DateTimeFieldProps) {
  const colors = useAppTheme();
  const style: CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 50, borderRadius: 10, border: `1px solid ${colors.outline}`, padding: '0 14px', background: colors.surface, color: colors.text, font: '600 14px system-ui', colorScheme: colors.background === '#141217' ? 'dark' : 'light' };
  return <input aria-label={label} type="datetime-local" min={minimumDate ? toInputValue(minimumDate) : undefined} max={maximumDate ? toInputValue(maximumDate) : undefined} value={toInputValue(value)} onChange={(event) => onChange(new Date(event.currentTarget.value))} style={style} />;
}

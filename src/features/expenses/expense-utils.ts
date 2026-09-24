import type { LedgerEntry, LedgerPeriod } from './model';

export const parseAmountToPaise = (value: string) => {
  const normalized = value.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const paise = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(paise) && paise > 0 ? paise : null;
};

export const formatMoney = (paise: number) => `${paise < 0 ? '-' : ''}₹${(Math.abs(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function periodStart(period: LedgerPeriod, now = new Date()) {
  if (period === 'all') return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'month') start.setDate(1);
  else start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export function entriesForPeriod(entries: LedgerEntry[], period: LedgerPeriod, now = new Date()) {
  const start = periodStart(period, now);
  return start ? entries.filter((entry) => new Date(entry.occurredAt) >= start && new Date(entry.occurredAt) <= now) : entries;
}

export function summarizeEntries(entries: LedgerEntry[]) {
  const given = entries.reduce((sum, entry) => sum + (entry.flow === 'given' ? entry.amountPaise : 0), 0);
  const received = entries.reduce((sum, entry) => sum + (entry.flow === 'received' ? entry.amountPaise : 0), 0);
  return { given, received, pending: given - received };
}

export function summarizeDailyEntries(entries: LedgerEntry[]) {
  const purchased = entries.reduce((sum, entry) => sum + (entry.flow === 'purchase' ? entry.amountPaise : 0), 0);
  const paid = entries.reduce((sum, entry) => sum + (entry.flow === 'payment' ? entry.amountPaise : 0), 0);
  const balance = purchased - paid;
  return { purchased, paid, due: Math.max(balance, 0), advance: Math.max(-balance, 0) };
}

export function summarizeDailyBalances(entries: LedgerEntry[]) {
  const balances = new Map<string, number>();
  entries.forEach((entry) => {
    const change = entry.flow === 'purchase' ? entry.amountPaise : entry.flow === 'payment' ? -entry.amountPaise : 0;
    balances.set(entry.accountId, (balances.get(entry.accountId) ?? 0) + change);
  });
  return [...balances.values()].reduce((totals, balance) => ({
    due: totals.due + Math.max(balance, 0),
    advance: totals.advance + Math.max(-balance, 0),
  }), { due: 0, advance: 0 });
}

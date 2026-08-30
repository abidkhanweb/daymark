export type AccountKind = 'person' | 'daily';
export type MoneyFlow = 'given' | 'received' | 'purchase' | 'payment';
export type PaymentMethod = 'cash' | 'online';
export type LedgerPeriod = 'week' | 'month' | 'all';

export type LedgerAccount = { id: string; name: string; kind: AccountKind; createdAt: string };
export type LedgerEntry = { id: string; accountId: string; flow: MoneyFlow; paymentMethods: PaymentMethod[]; amountPaise: number; occurredAt: string; note: string };
export type ExpenseData = { accounts: LedgerAccount[]; entries: LedgerEntry[] };
export type LedgerEntryInput = Omit<LedgerEntry, 'id'>;

export const initialExpenseData: ExpenseData = { accounts: [], entries: [] };

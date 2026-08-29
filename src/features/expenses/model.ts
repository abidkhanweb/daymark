export type MoneyFlow = 'given' | 'received';
export type PaymentMethod = 'cash' | 'online';
export type LedgerPeriod = 'week' | 'month' | 'all';

export type LedgerPerson = { id: string; name: string; createdAt: string };
export type LedgerEntry = { id: string; personId: string; flow: MoneyFlow; paymentMethods: PaymentMethod[]; amountPaise: number; occurredAt: string; note: string };
export type ExpenseData = { people: LedgerPerson[]; entries: LedgerEntry[] };

export const initialExpenseData: ExpenseData = { people: [], entries: [] };

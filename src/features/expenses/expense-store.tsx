import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { createDemoExpenseData } from '@/features/demo/demo-data';
import { useDemoMode } from '@/features/demo/demo-mode';

import { AccountKind, ExpenseData, initialExpenseData, LedgerEntry, LedgerEntryInput } from './model';

const STORAGE_KEY = 'daymark.expenses.v1';
type StoredEntry = Omit<LedgerEntry, 'accountId'> & { accountId?: string; personId?: string };
type StoredExpenseData = Partial<Omit<ExpenseData, 'entries'>> & { people?: { id: string; name: string; createdAt: string }[]; entries?: StoredEntry[] };

type ExpenseStore = ExpenseData & {
  addAccount: (name: string, kind: AccountKind) => string | null;
  deleteAccount: (id: string) => void;
  addEntry: (input: LedgerEntryInput) => void;
  addEntries: (inputs: LedgerEntryInput[]) => void;
  updateEntry: (id: string, input: LedgerEntryInput) => void;
  deleteEntry: (id: string) => void;
};

const Context = createContext<ExpenseStore | null>(null);

export function ExpenseProvider({ children }: PropsWithChildren) {
  const { isDemo } = useDemoMode();
  const [personalData, setPersonalData] = useState(initialExpenseData);
  const [demoData, setDemoData] = useState(createDemoExpenseData);
  const [hydrated, setHydrated] = useState(false);
  const data = isDemo ? demoData : personalData;
  const setData = isDemo ? setDemoData : setPersonalData;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      const stored = JSON.parse(value) as StoredExpenseData;
      setPersonalData({
        accounts: stored.accounts ?? stored.people?.map((person) => ({ ...person, kind: 'person' as const })) ?? [],
        entries: (stored.entries ?? []).map((entry) => ({ ...entry, accountId: entry.accountId ?? entry.personId ?? '', paymentMethods: entry.paymentMethods ?? [] })),
      });
    }).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(personalData));
  }, [personalData, hydrated]);

  const store = useMemo<ExpenseStore>(() => ({
    ...data,
    addAccount: (name, kind) => {
      const trimmed = name.trim();
      if (!trimmed || data.accounts.some((account) => account.kind === kind && account.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return null;
      const id = `${Date.now()}`;
      setData((current) => ({ ...current, accounts: [...current.accounts, { id, name: trimmed, kind, createdAt: new Date().toISOString() }] }));
      return id;
    },
    deleteAccount: (id) => setData((current) => ({
      accounts: current.accounts.filter((account) => account.id !== id),
      entries: current.entries.filter((entry) => entry.accountId !== id),
    })),
    addEntry: (input) => setData((current) => ({ ...current, entries: [{ ...input, id: `${Date.now()}` } as LedgerEntry, ...current.entries] })),
    addEntries: (inputs) => setData((current) => {
      const timestamp = Date.now();
      return { ...current, entries: [...inputs.map((input, index) => ({ ...input, id: `${timestamp}-${index}` } as LedgerEntry)), ...current.entries] };
    }),
    updateEntry: (id, input) => setData((current) => ({ ...current, entries: current.entries.map((entry) => entry.id === id ? { ...entry, ...input } : entry) })),
    deleteEntry: (id) => setData((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== id) })),
  }), [data, setData]);

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useExpenses() {
  const store = useContext(Context);
  if (!store) throw new Error('useExpenses must be used inside ExpenseProvider');
  return store;
}

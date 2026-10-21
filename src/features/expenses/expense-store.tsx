import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { createDemoExpenseData } from '@/features/demo/demo-data';
import { useDemoMode } from '@/features/demo/demo-mode';
import { useTrash } from '@/features/trash/trash-store';

import { AccountKind, ExpenseData, initialExpenseData, LedgerAccount, LedgerEntry, LedgerEntryInput } from './model';

const STORAGE_KEY = 'daymark.expenses.v1';
type StoredEntry = Omit<LedgerEntry, 'accountId'> & { accountId?: string; personId?: string };
type StoredExpenseData = Partial<Omit<ExpenseData, 'entries'>> & { people?: { id: string; name: string; createdAt: string }[]; entries?: StoredEntry[] };

function migrateExpenseData(stored: StoredExpenseData): ExpenseData {
  return {
    accounts: stored.accounts ?? stored.people?.map((person) => ({ ...person, kind: 'person' as const })) ?? [],
    entries: (stored.entries ?? []).map((entry) => ({ ...entry, accountId: entry.accountId ?? entry.personId ?? '', paymentMethods: entry.paymentMethods ?? [] })),
  };
}

type ExpenseStore = ExpenseData & {
  hydrated: boolean;
  addAccount: (name: string, kind: AccountKind) => string | null;
  deleteAccount: (id: string) => void;
  addEntry: (input: LedgerEntryInput) => void;
  addEntries: (inputs: LedgerEntryInput[]) => void;
  updateEntry: (id: string, input: LedgerEntryInput) => void;
  deleteEntry: (id: string) => void;
  restoreAccount: (account: LedgerAccount, entries: LedgerEntry[]) => void;
  restoreEntry: (entry: LedgerEntry) => void;
  importData: (data: Partial<ExpenseData>) => void;
};

const Context = createContext<ExpenseStore | null>(null);

export function ExpenseProvider({ children }: PropsWithChildren) {
  const { isDemo } = useDemoMode();
  const { moveToTrash } = useTrash();
  const [personalData, setPersonalData] = useState(initialExpenseData);
  const [demoData, setDemoData] = useState(createDemoExpenseData);
  const [hydrated, setHydrated] = useState(false);
  const data = isDemo ? demoData : personalData;
  const setData = isDemo ? setDemoData : setPersonalData;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      setPersonalData(migrateExpenseData(JSON.parse(value) as StoredExpenseData));
    }).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(personalData));
  }, [personalData, hydrated]);

  const store = useMemo<ExpenseStore>(() => ({
    ...data,
    hydrated,
    addAccount: (name, kind) => {
      const trimmed = name.trim();
      if (!trimmed || data.accounts.some((account) => account.kind === kind && account.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return null;
      const id = `${Date.now()}`;
      setData((current) => ({ ...current, accounts: [...current.accounts, { id, name: trimmed, kind, createdAt: new Date().toISOString() }] }));
      return id;
    },
    deleteAccount: (id) => {
      const account = data.accounts.find((item) => item.id === id);
      if (!account) return;
      const accountEntries = data.entries.filter((entry) => entry.accountId === id);
      if (!isDemo) moveToTrash({ kind: 'account', label: account.name, context: account.kind === 'daily' ? 'Daily account' : 'Person', data: { account, entries: accountEntries } });
      setData((current) => ({ accounts: current.accounts.filter((item) => item.id !== id), entries: current.entries.filter((entry) => entry.accountId !== id) }));
    },
    addEntry: (input) => setData((current) => ({ ...current, entries: [{ ...input, id: `${Date.now()}` } as LedgerEntry, ...current.entries] })),
    addEntries: (inputs) => setData((current) => {
      const timestamp = Date.now();
      return { ...current, entries: [...inputs.map((input, index) => ({ ...input, id: `${timestamp}-${index}` } as LedgerEntry)), ...current.entries] };
    }),
    updateEntry: (id, input) => setData((current) => ({ ...current, entries: current.entries.map((entry) => entry.id === id ? { ...entry, ...input } : entry) })),
    deleteEntry: (id) => {
      const entry = data.entries.find((item) => item.id === id);
      if (!entry) return;
      if (!isDemo) moveToTrash({ kind: 'entry', label: entry.note || entry.flow, context: data.accounts.find((account) => account.id === entry.accountId)?.name ?? 'Expense', data: entry });
      setData((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== id) }));
    },
    restoreAccount: (account, entries) => setData((current) => ({ accounts: [...current.accounts.filter((item) => item.id !== account.id), account], entries: [...entries, ...current.entries.filter((entry) => entry.accountId !== account.id)] })),
    restoreEntry: (entry) => setData((current) => current.accounts.some((account) => account.id === entry.accountId) ? { ...current, entries: [entry, ...current.entries.filter((item) => item.id !== entry.id)] } : current),
    importData: (input) => setPersonalData(migrateExpenseData(input)),
  }), [data, hydrated, isDemo, moveToTrash, setData]);

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useExpenses() {
  const store = useContext(Context);
  if (!store) throw new Error('useExpenses must be used inside ExpenseProvider');
  return store;
}

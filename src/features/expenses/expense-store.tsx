import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { createDemoExpenseData } from '@/features/demo/demo-data';
import { useDemoMode } from '@/features/demo/demo-mode';

import { ExpenseData, initialExpenseData, LedgerEntry, MoneyFlow, PaymentMethod } from './model';

const STORAGE_KEY = 'daymark.expenses.v1';

type ExpenseStore = ExpenseData & {
  addPerson: (name: string) => string | null;
  deletePerson: (id: string) => void;
  addEntry: (input: { personId: string; flow: MoneyFlow; paymentMethods: PaymentMethod[]; amountPaise: number; occurredAt: string; note: string }) => void;
  updateEntry: (id: string, input: { personId: string; flow: MoneyFlow; paymentMethods: PaymentMethod[]; amountPaise: number; occurredAt: string; note: string }) => void;
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
      const stored = JSON.parse(value) as Partial<ExpenseData>;
      setPersonalData({ people: stored.people ?? [], entries: (stored.entries ?? []).map((entry) => ({ ...entry, paymentMethods: entry.paymentMethods ?? [] })) });
    }).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(personalData));
  }, [personalData, hydrated]);

  const store = useMemo<ExpenseStore>(() => ({
    ...data,
    addPerson: (name) => {
      const trimmed = name.trim();
      if (!trimmed || data.people.some((person) => person.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return null;
      const id = `${Date.now()}`;
      setData((current) => ({ ...current, people: [...current.people, { id, name: trimmed, createdAt: new Date().toISOString() }] }));
      return id;
    },
    deletePerson: (id) => setData((current) => ({
      people: current.people.filter((person) => person.id !== id),
      entries: current.entries.filter((entry) => entry.personId !== id),
    })),
    addEntry: (input) => setData((current) => ({ ...current, entries: [{ ...input, id: `${Date.now()}` } as LedgerEntry, ...current.entries] })),
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

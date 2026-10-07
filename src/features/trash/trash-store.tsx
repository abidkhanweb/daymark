import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'daymark.trash.v1';

export type TrashKind = 'task' | 'note' | 'folder' | 'category' | 'account' | 'entry';
export type TrashItem = { id: string; kind: TrashKind; label: string; context: string; deletedAt: string; data: unknown };

type TrashStore = {
  items: TrashItem[];
  moveToTrash: (item: Omit<TrashItem, 'id' | 'deletedAt'>) => void;
  removeFromTrash: (id: string) => void;
  emptyTrash: () => void;
};

const Context = createContext<TrashStore | null>(null);

export function TrashProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => value && setItems(JSON.parse(value))).finally(() => setHydrated(true)); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [hydrated, items]);

  const store = useMemo<TrashStore>(() => ({
    items,
    moveToTrash: (item) => setItems((current) => [{ ...item, id: `${Date.now()}-${Math.random()}`, deletedAt: new Date().toISOString() }, ...current]),
    removeFromTrash: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    emptyTrash: () => setItems([]),
  }), [items]);

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useTrash() {
  const store = useContext(Context);
  if (!store) throw new Error('useTrash must be used inside TrashProvider');
  return store;
}

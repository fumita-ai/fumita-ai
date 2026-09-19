import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Settings, Transaction } from './types';
import { emptyAppData, loadAppData, saveAppData } from './lib/storage';

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

type Store = {
  data: AppData;
  addTransaction: (input: NewTransaction) => void;
  updateTransaction: (id: string, input: NewTransaction) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
};

const StoreContext = createContext<Store | null>(null);

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    // SSR や localStorage が使えない環境でも落ちないようにする。
    return typeof window === 'undefined' ? emptyAppData() : loadAppData();
  });

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const addTransaction = useCallback((input: NewTransaction) => {
    const now = new Date().toISOString();
    const transaction: Transaction = { ...input, id: newId(), createdAt: now, updatedAt: now };
    setData((prev) => ({ ...prev, transactions: [...prev.transactions, transaction] }));
  }, []);

  const updateTransaction = useCallback((id: string, input: NewTransaction) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, ...input, id: t.id, createdAt: t.createdAt, updatedAt: now } : t,
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  const value = useMemo<Store>(
    () => ({ data, addTransaction, updateTransaction, deleteTransaction, updateSettings, replaceAll }),
    [data, addTransaction, updateTransaction, deleteTransaction, updateSettings, replaceAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (store === null) throw new Error('useStore must be used within StoreProvider');
  return store;
}

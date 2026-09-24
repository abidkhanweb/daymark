import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useDemoMode } from '@/features/demo/demo-mode';
import { useExpenses } from '@/features/expenses/expense-store';
import type { ExpenseData } from '@/features/expenses/model';
import type { AppData } from '@/features/tasks/model';
import { useTasks } from '@/features/tasks/task-store';
import { exportNoteImages, restoreNoteImages } from '@/services/note-images';

import { createBackup, parseBackup } from './backup-format';
import { exportBackup as writeExport, hasSharedBackup, pickBackup, saveBackup } from './backup-service';

type BackupContextValue = {
  autoBackupEnabled: boolean;
  exportNow: () => Promise<boolean>;
  importFromFile: () => Promise<boolean>;
};

const Context = createContext<BackupContextValue | null>(null);

export function BackupProvider({ children }: PropsWithChildren) {
  const taskStore = useTasks();
  const expenseStore = useExpenses();
  const { isDemo } = useDemoMode();
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);

  const taskData = useMemo<AppData>(() => ({
    profileName: taskStore.profileName,
    profileNickname: taskStore.profileNickname,
    profileOnboardingComplete: taskStore.profileOnboardingComplete,
    tasks: taskStore.tasks,
    folders: taskStore.folders,
    categories: taskStore.categories,
    notes: taskStore.notes,
    customTemplates: taskStore.customTemplates,
    hiddenTemplateTitles: taskStore.hiddenTemplateTitles,
  }), [taskStore.profileName, taskStore.profileNickname, taskStore.profileOnboardingComplete, taskStore.tasks, taskStore.folders, taskStore.categories, taskStore.notes, taskStore.customTemplates, taskStore.hiddenTemplateTitles]);
  const expenseData = useMemo<ExpenseData>(() => ({ accounts: expenseStore.accounts, entries: expenseStore.entries }), [expenseStore.accounts, expenseStore.entries]);

  const serialize = useCallback(async () => JSON.stringify(createBackup(await exportNoteImages(taskData), expenseData)), [taskData, expenseData]);

  useEffect(() => { hasSharedBackup().then(setAutoBackupEnabled); }, []);
  useEffect(() => {
    if (isDemo || !taskStore.hydrated || !expenseStore.hydrated) return;
    const timer = setTimeout(() => {
      serialize().then(saveBackup).then(setAutoBackupEnabled).catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
  }, [expenseStore.hydrated, isDemo, serialize, taskStore.hydrated]);

  const value = useMemo<BackupContextValue>(() => ({
    autoBackupEnabled,
    exportNow: async () => {
      if (isDemo) throw new Error('Exit Demo Mode before exporting personal data.');
      const file = await writeExport(await serialize());
      if (file) setAutoBackupEnabled(true);
      return Boolean(file);
    },
    importFromFile: async () => {
      if (isDemo) throw new Error('Exit Demo Mode before importing personal data.');
      const contents = await pickBackup();
      if (!contents) return false;
      const backup = parseBackup(contents);
      const tasks = await restoreNoteImages(backup.tasks);
      await taskStore.importData(tasks);
      expenseStore.importData(backup.expenses);
      return true;
    },
  }), [autoBackupEnabled, expenseStore, isDemo, serialize, taskStore]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBackup() {
  const value = useContext(Context);
  if (!value) throw new Error('useBackup must be used inside BackupProvider');
  return value;
}

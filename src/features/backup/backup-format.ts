import type { ExpenseData } from '@/features/expenses/model';
import type { AppData } from '@/features/tasks/model';

export const BACKUP_FILE_NAME = 'DayMark-backup.daymark';
export const BACKUP_VERSION = 1;

export type DayMarkBackup = {
  format: 'daymark-backup';
  version: typeof BACKUP_VERSION;
  createdAt: string;
  tasks: AppData;
  expenses: ExpenseData;
};

export function createBackup(tasks: AppData, expenses: ExpenseData): DayMarkBackup {
  return { format: 'daymark-backup', version: BACKUP_VERSION, createdAt: new Date().toISOString(), tasks, expenses };
}

export function parseBackup(value: string): DayMarkBackup {
  const backup = JSON.parse(value) as Partial<DayMarkBackup>;
  if (
    backup.format !== 'daymark-backup'
    || backup.version !== BACKUP_VERSION
    || !backup.tasks
    || !Array.isArray(backup.tasks.tasks)
    || !Array.isArray(backup.tasks.notes)
    || !backup.expenses
    || !Array.isArray(backup.expenses.accounts)
    || !Array.isArray(backup.expenses.entries)
  ) throw new Error('This is not a supported DayMark backup.');
  return backup as DayMarkBackup;
}

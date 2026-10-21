import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { addTaskToCalendar, cancelTaskReminder, configureReminders, scheduleTaskReminder } from '@/services/reminders';
import { removeNoteImage } from '@/services/note-images';
import { createDemoTaskData } from '@/features/demo/demo-data';
import { useDemoMode } from '@/features/demo/demo-mode';
import { useTrash } from '@/features/trash/trash-store';

import { AppData, CustomTaskTemplate, initialData, Note, Task, TaskDraft, TaskTemplate, taskTemplates } from './model';
import { completeRecurringTask, setTaskCompleted } from './task-completion';
import { migrateData } from './task-utils';

const STORAGE_KEY = 'daymark.data.v1';

type TaskStore = AppData & {
  hydrated: boolean;
  templates: TaskTemplate[];
  addTask: (draft: TaskDraft) => Promise<void>;
  updateTask: (id: string, draft: TaskDraft) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addFolder: (name: string, categoryId: string) => boolean;
  addCategory: (name: string) => boolean;
  deleteCategory: (id: string) => void;
  deleteFolder: (id: string, deleteTasks: boolean) => Promise<void>;
  addTemplate: (template: TaskTemplate) => boolean;
  deleteTemplate: (title: string) => void;
  addNote: (note: Pick<Note, 'title' | 'body' | 'folderId' | 'imageUris'>) => void;
  updateNote: (id: string, note: Pick<Note, 'title' | 'body' | 'folderId' | 'imageUris'>) => void;
  deleteNote: (id: string) => void;
  toggleNoteFavorite: (id: string) => void;
  restoreTask: (task: Task) => Promise<void>;
  restoreNote: (note: Note) => void;
  restoreFolder: (folder: AppData['folders'][number]) => void;
  restoreCategory: (category: AppData['categories'][number]) => void;
  setProfile: (name: string, nickname: string) => void;
  importData: (data: Partial<AppData>) => Promise<void>;
};

const Context = createContext<TaskStore | null>(null);

export function TaskProvider({ children }: PropsWithChildren) {
  const { isDemo } = useDemoMode();
  const { moveToTrash } = useTrash();
  const [personalData, setPersonalData] = useState(initialData);
  const [demoData, setDemoData] = useState(createDemoTaskData);
  const [hydrated, setHydrated] = useState(false);
  const togglingTaskIds = useRef(new Set<string>());
  const data = isDemo ? demoData : personalData;
  const setData = isDemo ? setDemoData : setPersonalData;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => value && setPersonalData(migrateData(JSON.parse(value) as Partial<AppData>)))
      .finally(() => setHydrated(true));
    configureReminders().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(personalData));
  }, [personalData, hydrated]);

  const store = useMemo<TaskStore>(() => ({
    ...data,
    hydrated,
    templates: [
      ...taskTemplates.filter((template) => !data.hiddenTemplateTitles.includes(template.title.toLocaleLowerCase())),
      ...data.customTemplates,
    ],
    addTask: async (draft) => {
      const { addToCalendar, ...details } = draft;
      const task: Task = {
        ...details,
        id: `${Date.now()}`,
        completed: false,
        subtasks: details.subtasks.map((subtask, index) => ({ ...subtask, id: `${Date.now()}-${index}` })),
        notificationIds: [],
      };
      const notificationIds = isDemo ? [] : await scheduleTaskReminder(task).catch(() => []);
      const savedTask = { ...task, notificationIds };
      setData((current) => ({ ...current, tasks: [savedTask, ...current.tasks] }));
      if (!isDemo && addToCalendar) await addTaskToCalendar(savedTask).catch(() => false);
    },
    updateTask: async (id, draft) => {
      const currentTask = data.tasks.find((item) => item.id === id);
      if (!currentTask) return;
      if (!isDemo) await cancelTaskReminder(currentTask.notificationIds).catch(() => undefined);
      const { addToCalendar, ...details } = draft;
      const task: Task = {
        ...currentTask,
        ...details,
        subtasks: details.subtasks.map((subtask, index) => ({ ...subtask, id: subtask.id || `${Date.now()}-${index}` })),
        notificationIds: [],
      };
      const notificationIds = isDemo ? [] : await scheduleTaskReminder(task).catch(() => []);
      const savedTask = { ...task, notificationIds };
      setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === id ? savedTask : item) }));
      if (!isDemo && addToCalendar) await addTaskToCalendar(savedTask).catch(() => false);
    },
    deleteTask: async (id) => {
      const task = data.tasks.find((item) => item.id === id);
      if (!task) return;
      if (!isDemo) await cancelTaskReminder(task.notificationIds).catch(() => undefined);
      if (!isDemo) moveToTrash({ kind: 'task', label: task.title, context: data.folders.find((folder) => folder.id === task.folderId)?.name ?? 'Uncategorized', data: task });
      setData((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== id) }));
    },
    toggleTask: async (id) => {
      if (togglingTaskIds.current.has(id)) return;
      const task = data.tasks.find((item) => item.id === id);
      if (!task) return;
      togglingTaskIds.current.add(id);
      const completed = !task.completed;
      const repeating = completed && task.repeat.type !== 'none';
      const recurrence = repeating ? completeRecurringTask(task) : null;
      const updatedTask = recurrence?.completedTask ?? setTaskCompleted(task, completed);

      setData((current) => ({
        ...current,
        tasks: current.tasks.flatMap((item) => item.id === id && recurrence ? [recurrence.nextTask, recurrence.completedTask] : [item.id === id ? updatedTask : item]),
      }));

      if (isDemo) {
        togglingTaskIds.current.delete(id);
        return;
      }

      try {
        if (completed) {
          await cancelTaskReminder(task.notificationIds).catch(() => undefined);
          if (recurrence) {
            const notificationIds = await scheduleTaskReminder(recurrence.nextTask).catch(() => []);
            setData((current) => ({
              ...current,
              tasks: current.tasks.map((item) => item.id === recurrence.nextTask.id ? { ...item, notificationIds } : item),
            }));
          }
        } else {
          const notificationIds = await scheduleTaskReminder(updatedTask).catch(() => []);
          setData((current) => ({
            ...current,
            tasks: current.tasks.map((item) => item.id === id && !item.completed ? { ...item, notificationIds } : item),
          }));
        }
      } finally {
        togglingTaskIds.current.delete(id);
      }
    },
    toggleSubtask: (taskId, subtaskId) => setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? {
        ...task,
        subtasks: task.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask),
      } : task),
    })),
    addFolder: (name, categoryId) => {
      const normalized = name.trim().toLocaleLowerCase();
      if (!normalized || data.folders.some((folder) => folder.name.toLocaleLowerCase() === normalized)) return false;
      setData((current) => ({
        ...current,
        folders: [...current.folders, {
          id: `${Date.now()}`,
          name: name.trim(),
          color: ['#426A8C', '#006A6A', '#9C4146', '#536D22'][current.folders.length % 4],
          icon: 'folder',
          categoryId: current.categories.some((category) => category.id === categoryId) ? categoryId : current.categories[0].id,
        }],
      }));
      return true;
    },
    addCategory: (name) => {
      const normalized = name.trim().toLocaleLowerCase();
      if (!normalized || data.categories.some((category) => category.name.toLocaleLowerCase() === normalized)) return false;
      setData((current) => ({
        ...current,
        categories: [...current.categories, { id: `${Date.now()}`, name: name.trim(), color: ['#426A8C', '#006A6A', '#9C4146', '#536D22'][current.categories.length % 4] }],
      }));
      return true;
    },
    deleteCategory: (id) => {
      const category = data.categories.find((item) => item.id === id);
      if (!category || category.name.trim().toLocaleLowerCase() === 'general') return;
      if (!isDemo) moveToTrash({ kind: 'category', label: category.name, context: 'Task category', data: category });
      setData((current) => {
        const remaining = current.categories.filter((item) => item.id !== id);
        const fallback = remaining[0] ?? { id: `category-${Date.now()}`, name: 'General', color: '#426A8C' };
        return { ...current, categories: remaining.length ? remaining : [fallback], folders: current.folders.map((folder) => folder.categoryId === id ? { ...folder, categoryId: fallback.id } : folder) };
      });
    },
    deleteFolder: async (id, deleteTasks) => {
      const folder = data.folders.find((item) => item.id === id);
      if (!folder || folder.id === 'uncategorized' || folder.name.trim().toLocaleLowerCase() === 'general') return;
      const affected = data.tasks.filter((task) => task.folderId === id);
      if (!isDemo && deleteTasks) await Promise.all(affected.map((task) => cancelTaskReminder(task.notificationIds).catch(() => undefined)));
      if (!isDemo) moveToTrash({ kind: 'folder', label: folder.name, context: data.categories.find((category) => category.id === folder.categoryId)?.name ?? 'Category', data: folder });
      if (!isDemo && deleteTasks) affected.forEach((task) => moveToTrash({ kind: 'task', label: task.title, context: folder.name, data: task }));
      setData((current) => ({
        ...current,
        folders: current.folders.filter((folder) => folder.id !== id),
        tasks: deleteTasks
          ? current.tasks.filter((task) => task.folderId !== id)
          : current.tasks.map((task) => task.folderId === id ? { ...task, folderId: 'uncategorized' } : task),
        notes: current.notes.map((note) => note.folderId === id ? { ...note, folderId: 'uncategorized' } : note),
      }));
    },
    addTemplate: (template) => {
      const normalized = template.title.trim().toLocaleLowerCase();
      const visibleTemplates = [...taskTemplates.filter((item) => !data.hiddenTemplateTitles.includes(item.title.toLocaleLowerCase())), ...data.customTemplates];
      if (!normalized || visibleTemplates.some((item) => item.title.toLocaleLowerCase() === normalized)) return false;
      const custom: CustomTaskTemplate = { ...template, id: `${Date.now()}` };
      setData((current) => ({ ...current, customTemplates: [...current.customTemplates, custom], hiddenTemplateTitles: current.hiddenTemplateTitles.filter((title) => title !== normalized) }));
      return true;
    },
    deleteTemplate: (title) => {
      const normalized = title.toLocaleLowerCase();
      setData((current) => ({
        ...current,
        customTemplates: current.customTemplates.filter((template) => template.title.toLocaleLowerCase() !== normalized),
        hiddenTemplateTitles: current.hiddenTemplateTitles.includes(normalized) ? current.hiddenTemplateTitles : [...current.hiddenTemplateTitles, normalized],
      }));
    },
    addNote: (note) => setData((current) => ({
      ...current,
      notes: [{ ...note, id: `${Date.now()}`, updatedAt: new Date().toISOString() }, ...current.notes],
    })),
    updateNote: (id, note) => {
      const previousImages = data.notes.find((item) => item.id === id)?.imageUris ?? [];
      const currentImages = new Set(note.imageUris);
      previousImages.filter((uri) => !currentImages.has(uri)).forEach(removeNoteImage);
      setData((current) => ({
        ...current,
        notes: current.notes.map((item) => item.id === id ? { ...item, ...note, updatedAt: new Date().toISOString() } : item),
      }));
    },
    deleteNote: (id) => {
      const note = data.notes.find((item) => item.id === id);
      if (!note) return;
      if (!isDemo) moveToTrash({ kind: 'note', label: note.title, context: data.folders.find((folder) => folder.id === note.folderId)?.name ?? 'Uncategorized', data: note });
      setData((current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== id),
      }));
    },
    toggleNoteFavorite: (id) => setData((current) => ({ ...current, notes: current.notes.map((note) => note.id === id ? { ...note, favorite: !note.favorite } : note) })),
    restoreTask: async (task) => {
      const restored = { ...task, folderId: data.folders.some((folder) => folder.id === task.folderId) ? task.folderId : 'uncategorized', notificationIds: [] };
      const notificationIds = !isDemo && !restored.completed ? await scheduleTaskReminder(restored).catch(() => []) : [];
      setData((current) => ({ ...current, tasks: [{ ...restored, notificationIds }, ...current.tasks.filter((item) => item.id !== task.id)] }));
    },
    restoreNote: (note) => setData((current) => ({ ...current, notes: [{ ...note, folderId: current.folders.some((folder) => folder.id === note.folderId) ? note.folderId : 'uncategorized' }, ...current.notes.filter((item) => item.id !== note.id)] })),
    restoreFolder: (folder) => setData((current) => ({ ...current, folders: [...current.folders.filter((item) => item.id !== folder.id), { ...folder, categoryId: current.categories.some((category) => category.id === folder.categoryId) ? folder.categoryId : current.categories[0].id }] })),
    restoreCategory: (category) => setData((current) => ({ ...current, categories: [...current.categories.filter((item) => item.id !== category.id), category] })),
    setProfile: (name, nickname) => setData((current) => ({
      ...current,
      profileName: name.trim(),
      profileNickname: nickname.trim(),
      profileOnboardingComplete: true,
    })),
    importData: async (input) => {
      const imported = migrateData(input);
      await Promise.all(personalData.tasks.map((task) => cancelTaskReminder(task.notificationIds).catch(() => undefined)));
      const tasks = await Promise.all(imported.tasks.map(async (task) => {
        const cleanTask = { ...task, notificationId: undefined, notificationIds: [] };
        if (cleanTask.completed) return cleanTask;
        return { ...cleanTask, notificationIds: await scheduleTaskReminder(cleanTask).catch(() => []) };
      }));
      setPersonalData({ ...imported, tasks });
    },
  }), [data, hydrated, isDemo, moveToTrash, personalData.tasks, setData]);

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useTasks() {
  const store = useContext(Context);
  if (!store) throw new Error('useTasks must be used inside TaskProvider');
  return store;
}

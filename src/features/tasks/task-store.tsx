import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { addTaskToCalendar, cancelTaskReminder, configureReminders, scheduleTaskReminder } from '@/services/reminders';
import { removeNoteImage } from '@/services/note-images';
import { createDemoTaskData } from '@/features/demo/demo-data';
import { useDemoMode } from '@/features/demo/demo-mode';

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
  addNote: (note: Pick<Note, 'title' | 'body' | 'folderId' | 'imageUri'>) => void;
  updateNote: (id: string, note: Pick<Note, 'title' | 'body' | 'folderId' | 'imageUri'>) => void;
  deleteNote: (id: string) => void;
  setProfile: (name: string, nickname: string) => void;
};

const Context = createContext<TaskStore | null>(null);

export function TaskProvider({ children }: PropsWithChildren) {
  const { isDemo } = useDemoMode();
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
          color: ['#6750A4', '#006A6A', '#9C4146', '#536D22'][current.folders.length % 4],
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
        categories: [...current.categories, { id: `${Date.now()}`, name: name.trim(), color: ['#6750A4', '#006A6A', '#9C4146', '#536D22'][current.categories.length % 4] }],
      }));
      return true;
    },
    deleteCategory: (id) => setData((current) => {
      const category = current.categories.find((item) => item.id === id);
      if (!category || category.name.trim().toLocaleLowerCase() === 'general') return current;
      const remaining = current.categories.filter((category) => category.id !== id);
      const fallback = remaining[0] ?? { id: `category-${Date.now()}`, name: 'General', color: '#6750A4' };
      const categories = remaining.length ? remaining : [fallback];
      return {
        ...current,
        categories,
        folders: current.folders.map((folder) => folder.categoryId === id ? { ...folder, categoryId: fallback.id } : folder),
      };
    }),
    deleteFolder: async (id, deleteTasks) => {
      const folder = data.folders.find((item) => item.id === id);
      if (!folder || folder.id === 'uncategorized' || folder.name.trim().toLocaleLowerCase() === 'general') return;
      const affected = data.tasks.filter((task) => task.folderId === id);
      if (!isDemo && deleteTasks) await Promise.all(affected.map((task) => cancelTaskReminder(task.notificationIds).catch(() => undefined)));
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
      const previousImage = data.notes.find((item) => item.id === id)?.imageUri;
      if (previousImage && previousImage !== note.imageUri) removeNoteImage(previousImage);
      setData((current) => ({
        ...current,
        notes: current.notes.map((item) => item.id === id ? { ...item, ...note, updatedAt: new Date().toISOString() } : item),
      }));
    },
    deleteNote: (id) => {
      removeNoteImage(data.notes.find((note) => note.id === id)?.imageUri);
      setData((current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== id),
      }));
    },
    setProfile: (name, nickname) => setData((current) => ({
      ...current,
      profileName: name.trim(),
      profileNickname: nickname.trim(),
      profileOnboardingComplete: true,
    })),
  }), [data, hydrated, isDemo, setData]);

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useTasks() {
  const store = useContext(Context);
  if (!store) throw new Error('useTasks must be used inside TaskProvider');
  return store;
}

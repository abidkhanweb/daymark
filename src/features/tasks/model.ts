export type Priority = 'high' | 'normal';
export type RepeatType = 'none' | 'daily' | 'weekly';
export type RepeatRule = { type: RepeatType; weekdays: number[] };

export type Category = { id: string; name: string; color: string };

export type Subtask = { id: string; title: string; completed: boolean };

export type Folder = {
  id: string;
  name: string;
  color: string;
  icon: 'work' | 'home' | 'person' | 'folder';
  categoryId: string;
};

export type Task = {
  id: string;
  title: string;
  notes?: string;
  dueAt: string;
  folderId: string;
  priority: Priority;
  repeat: RepeatRule;
  completed: boolean;
  subtasks: Subtask[];
  recurrenceId?: string;
  notificationId?: string;
  notificationIds: string[];
};

export type Note = {
  id: string;
  title: string;
  body: string;
  folderId: string;
  imageUri?: string;
  updatedAt: string;
};

export type TaskDraft = Omit<Task, 'id' | 'completed' | 'notificationId' | 'notificationIds'> & {
  addToCalendar: boolean;
};

export type AppData = {
  profileName: string;
  profileOnboardingComplete: boolean;
  tasks: Task[];
  folders: Folder[];
  categories: Category[];
  notes: Note[];
  customTemplates: CustomTaskTemplate[];
  hiddenTemplateTitles: string[];
};

export type TaskTemplate = Pick<TaskDraft, 'title' | 'notes' | 'folderId' | 'priority' | 'subtasks'> & { repeat?: RepeatRule };
export type CustomTaskTemplate = TaskTemplate & { id: string };

export const taskTemplates: TaskTemplate[] = [
  { title: 'Review monthly goals', notes: 'Review progress and choose the next three outcomes.', folderId: 'work', priority: 'high', subtasks: [] },
  { title: 'Pay monthly bills', notes: 'Review utilities, subscriptions, and upcoming payments.', folderId: 'home', priority: 'normal', subtasks: [] },
  { title: 'Plan weekly groceries', notes: 'Build the list before visiting the store.', folderId: 'personal', priority: 'normal', subtasks: [{ id: 'template-pantry', title: 'Check pantry', completed: false }, { id: 'template-list', title: 'Write shopping list', completed: false }] },
  { title: 'Weekly work review', notes: 'Close loose ends and prepare next week.', folderId: 'work', priority: 'normal', subtasks: [{ id: 'template-inbox', title: 'Clear inbox', completed: false }, { id: 'template-plan', title: 'Choose next priorities', completed: false }] },
  { title: 'Schedule health check', notes: 'Book the appointment and add it to the calendar.', folderId: 'personal', priority: 'high', subtasks: [] },
];

const due = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const initialData: AppData = {
  profileName: '',
  profileOnboardingComplete: false,
  customTemplates: [],
  hiddenTemplateTitles: [],
  categories: [
    { id: 'work', name: 'Work', color: '#6750A4' },
    { id: 'life', name: 'Life', color: '#006A6A' },
  ],
  folders: [
    { id: 'uncategorized', name: 'Uncategorized', color: '#79747E', icon: 'folder', categoryId: 'life' },
    { id: 'work', name: 'Projects', color: '#6750A4', icon: 'work', categoryId: 'work' },
    { id: 'personal', name: 'Personal', color: '#006A6A', icon: 'person', categoryId: 'life' },
    { id: 'home', name: 'Home', color: '#9C4146', icon: 'home', categoryId: 'life' },
  ],
  tasks: [
    {
      id: 'welcome-1',
      title: 'Review monthly goals',
      notes: 'Choose the three outcomes that matter most this month.',
      dueAt: due(0, 10, 30),
      folderId: 'work',
      priority: 'high',
      repeat: { type: 'none', weekdays: [] },
      completed: false,
      subtasks: [],
      notificationIds: [],
    },
    {
      id: 'welcome-2',
      title: 'Pay electricity bill',
      dueAt: due(0, 18),
      folderId: 'home',
      priority: 'normal',
      repeat: { type: 'none', weekdays: [] },
      completed: false,
      subtasks: [],
      notificationIds: [],
    },
    {
      id: 'welcome-3',
      title: 'Plan weekend groceries',
      dueAt: due(1, 9),
      folderId: 'personal',
      priority: 'normal',
      repeat: { type: 'none', weekdays: [] },
      completed: false,
      subtasks: [],
      notificationIds: [],
    },
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Monthly focus',
      body: 'Protect mornings for deep work. Keep Friday afternoon for review and planning.',
      folderId: 'work',
      updatedAt: new Date().toISOString(),
    },
  ],
};

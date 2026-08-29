import type { ExpenseData } from '@/features/expenses/model';
import { initialData, type AppData, type Task } from '@/features/tasks/model';

const at = (dayOffset: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const task = (id: string, title: string, dayOffset: number, hour: number, folderId: string, priority: Task['priority'], completed = false): Task => ({
  id, title, dueAt: at(dayOffset, hour), folderId, priority, completed,
  repeat: { type: 'none', weekdays: [] }, subtasks: [], notificationIds: [],
});

export function createDemoTaskData(): AppData {
  return {
    ...initialData,
    profileName: 'Alex',
    profileOnboardingComplete: true,
    categories: initialData.categories.map((item) => ({ ...item })),
    folders: initialData.folders.map((item) => ({ ...item })),
    tasks: [
      { ...task('demo-task-1', 'Prepare client presentation', 0, 11, 'work', 'high'), notes: 'Review the final slides before the meeting.', subtasks: [{ id: 'demo-sub-1', title: 'Check numbers', completed: true }, { id: 'demo-sub-2', title: 'Practice opening', completed: false }] },
      task('demo-task-2', 'Buy weekly groceries', 0, 18, 'home', 'normal'),
      task('demo-task-3', 'Book health appointment', 1, 10, 'personal', 'high'),
      task('demo-task-4', 'Review monthly goals', -2, 9, 'work', 'normal', true),
    ],
    notes: [
      { id: 'demo-note-1', title: 'Presentation ideas', body: 'Lead with the customer outcome, then show the timeline and next steps.', folderId: 'work', updatedAt: at(0, 9) },
      { id: 'demo-note-2', title: 'Weekend plan', body: 'Groceries, a morning walk, and time to read.', folderId: 'personal', updatedAt: at(-1, 18) },
    ],
    customTemplates: [],
    hiddenTemplateTitles: [],
  };
}

export function createDemoExpenseData(): ExpenseData {
  return {
    people: [
      { id: 'demo-person-1', name: 'Rahul', createdAt: at(-20, 10) },
      { id: 'demo-person-2', name: 'Priya', createdAt: at(-10, 12) },
    ],
    entries: [
      { id: 'demo-entry-1', personId: 'demo-person-1', flow: 'given', paymentMethods: ['online'], amountPaise: 100000, occurredAt: at(-8, 14), note: 'Short-term help' },
      { id: 'demo-entry-2', personId: 'demo-person-1', flow: 'received', paymentMethods: ['cash', 'online'], amountPaise: 50000, occurredAt: at(-2, 17), note: '₹200 cash + ₹300 online' },
      { id: 'demo-entry-3', personId: 'demo-person-2', flow: 'given', paymentMethods: ['cash'], amountPaise: 75000, occurredAt: at(-3, 12), note: 'Shared booking' },
    ],
  };
}

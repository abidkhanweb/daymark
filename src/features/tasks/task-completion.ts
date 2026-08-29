import type { Task } from './model';

export function setTaskCompleted(task: Task, completed: boolean): Task {
  return {
    ...task,
    completed,
    notificationIds: [],
    subtasks: task.subtasks.map((subtask) => ({ ...subtask, completed })),
  };
}

export function nextRepeatDate(task: Task, now = new Date()): string {
  const next = new Date(task.dueAt);
  if (task.repeat.type === 'daily') {
    do next.setDate(next.getDate() + 1); while (next <= now);
    return next.toISOString();
  }
  if (task.repeat.type === 'weekly' && task.repeat.weekdays.length) {
    do next.setDate(next.getDate() + 1); while (next <= now || !task.repeat.weekdays.includes(next.getDay() + 1));
    return next.toISOString();
  }
  return task.dueAt;
}

export function rollTaskForward(task: Task, now = new Date()): Task {
  return { ...setTaskCompleted(task, false), dueAt: nextRepeatDate(task, now) };
}

export function completeRecurringTask(task: Task, now = new Date()) {
  const recurrenceId = task.recurrenceId ?? task.id;
  const nextTask = rollTaskForward(task, now);
  return {
    completedTask: { ...setTaskCompleted(task, true), recurrenceId, repeat: { type: 'none' as const, weekdays: [] } },
    nextTask: { ...nextTask, id: `${recurrenceId}:${nextTask.dueAt}`, recurrenceId },
  };
}

const repeatKey = (task: Task) => [task.title.trim().toLocaleLowerCase(), task.folderId, task.priority, task.notes ?? '', ...task.subtasks.map((item) => item.title.trim().toLocaleLowerCase())].join('\u0000');

export function removeRecurringDuplicates(tasks: Task[]): Task[] {
  const activeRepeats = new Set(tasks.filter((task) => !task.completed && task.repeat.type !== 'none').map(repeatKey));
  return tasks.filter((task) => !(task.completed && !task.recurrenceId && activeRepeats.has(repeatKey(task))));
}

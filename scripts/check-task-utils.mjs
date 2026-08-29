import assert from 'node:assert/strict';

const { completeRecurringTask, removeRecurringDuplicates, rollTaskForward, setTaskCompleted } = await import('../src/features/tasks/task-completion.ts');

const task = {
  id: 'task',
  title: 'Test',
  dueAt: '2026-08-22T10:00:00.000Z',
  folderId: 'work',
  priority: 'normal',
  repeat: { type: 'none', weekdays: [] },
  completed: false,
  subtasks: [
    { id: 'done', title: 'Already done', completed: true },
    { id: 'open', title: 'Still open', completed: false },
  ],
  notificationIds: ['notification'],
};

const completed = setTaskCompleted(task, true);
assert.equal(completed.completed, true);
assert.equal(completed.subtasks.every((subtask) => subtask.completed), true);
assert.deepEqual(completed.notificationIds, []);

const reopened = setTaskCompleted(completed, false);
assert.equal(reopened.completed, false);
assert.equal(reopened.subtasks.every((subtask) => !subtask.completed), true);

const repeating = { ...task, repeat: { type: 'daily', weekdays: [] } };
const rolled = rollTaskForward(repeating, new Date('2026-08-22T12:00:00.000Z'));
assert.equal(rolled.id, repeating.id);
assert.equal(rolled.dueAt, '2026-08-23T10:00:00.000Z');
assert.equal(rolled.completed, false);

const recurrence = completeRecurringTask(repeating, new Date('2026-08-22T12:00:00.000Z'));
assert.equal(recurrence.completedTask.completed, true);
assert.equal(recurrence.completedTask.subtasks.every((subtask) => subtask.completed), true);
assert.equal(recurrence.completedTask.repeat.type, 'none');
assert.equal(recurrence.nextTask.completed, false);
assert.equal(recurrence.nextTask.dueAt, '2026-08-23T10:00:00.000Z');
assert.notEqual(recurrence.nextTask.id, repeating.id);

assert.deepEqual(removeRecurringDuplicates([repeating, completed]), [repeating]);
assert.deepEqual(removeRecurringDuplicates([recurrence.nextTask, recurrence.completedTask]), [recurrence.nextTask, recurrence.completedTask]);

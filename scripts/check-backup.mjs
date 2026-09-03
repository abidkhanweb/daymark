import assert from 'node:assert/strict';

import { createBackup, parseBackup } from '../src/features/backup/backup-format.ts';

const tasks = {
  profileName: 'Alex', profileNickname: '', profileOnboardingComplete: true,
  tasks: [], folders: [], categories: [], notes: [], customTemplates: [], hiddenTemplateTitles: [],
};
const expenses = { accounts: [], entries: [] };
const backup = createBackup(tasks, expenses);

assert.equal(parseBackup(JSON.stringify(backup)).tasks.profileName, 'Alex');
assert.throws(() => parseBackup('{"format":"something-else"}'));
console.log('Backup format checks passed.');

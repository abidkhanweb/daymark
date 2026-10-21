import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { swipeDestination } from '../src/components/swipe-navigation.ts';

const [root, nativeTabs, webTabs, today] = await Promise.all([
  readFile('src/app/_layout.tsx', 'utf8'),
  readFile('src/components/app-tabs.tsx', 'utf8'),
  readFile('src/components/app-tabs.web.tsx', 'utf8'),
  readFile('src/app/(tabs)/index.tsx', 'utf8'),
]);

assert.match(root, /Stack\.Screen name="settings"/);
assert.match(nativeTabs, /NativeTabs\.Trigger name="index"/);
assert.doesNotMatch(nativeTabs, /Trigger name="settings"/);
assert.match(webTabs, /TabTrigger name="index" href=\{'\/' as Href\}/);
assert.match(today, /router\.navigate\('\/settings'\)/);
assert.equal(swipeDestination('/', 12, 90), '/settings');
assert.equal(swipeDestination('/tasks', 100, -90), '/notes');
assert.equal(swipeDestination('/notes', 100, 90), '/tasks');
assert.equal(swipeDestination('/tasks', 12, -90), null);

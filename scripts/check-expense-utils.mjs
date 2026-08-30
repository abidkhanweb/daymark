import assert from 'node:assert/strict';

const { entriesForPeriod, parseAmountToPaise, summarizeDailyBalances, summarizeDailyEntries, summarizeEntries } = await import('../src/features/expenses/expense-utils.ts');

assert.equal(parseAmountToPaise('1,000'), 100000);
assert.equal(parseAmountToPaise('500.25'), 50025);
assert.equal(parseAmountToPaise('10.999'), null);

const entries = [
  { id: '1', accountId: 'p', flow: 'given', paymentMethods: ['online'], amountPaise: 100000, occurredAt: '2026-08-20T10:00:00.000Z', note: '' },
  { id: '2', accountId: 'p', flow: 'received', paymentMethods: ['cash', 'online'], amountPaise: 50000, occurredAt: '2026-08-21T10:00:00.000Z', note: '' },
];
assert.deepEqual(summarizeEntries(entries), { given: 100000, received: 50000, pending: 50000 });
assert.equal(entriesForPeriod(entries, 'week', new Date('2026-08-22T12:00:00.000Z')).length, 2);

assert.deepEqual(summarizeDailyEntries([
  { ...entries[0], flow: 'purchase', amountPaise: 100000 },
  { ...entries[1], flow: 'payment', amountPaise: 60000 },
]), { purchased: 100000, paid: 60000, due: 40000, advance: 0 });

assert.deepEqual(summarizeDailyEntries([
  { ...entries[0], flow: 'purchase', amountPaise: 10000 },
  { ...entries[1], flow: 'payment', amountPaise: 10000 },
]), { purchased: 10000, paid: 10000, due: 0, advance: 0 });

assert.deepEqual(summarizeDailyEntries([
  { ...entries[0], flow: 'payment', amountPaise: 60000 },
]), { purchased: 0, paid: 60000, due: 0, advance: 60000 });

assert.deepEqual(summarizeDailyBalances([
  { ...entries[0], accountId: 'shop-1', flow: 'purchase', amountPaise: 50000 },
  { ...entries[1], accountId: 'shop-2', flow: 'payment', amountPaise: 60000 },
]), { due: 50000, advance: 60000 });

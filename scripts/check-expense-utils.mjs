import assert from 'node:assert/strict';

const { entriesForPeriod, parseAmountToPaise, summarizeEntries } = await import('../src/features/expenses/expense-utils.ts');

assert.equal(parseAmountToPaise('1,000'), 100000);
assert.equal(parseAmountToPaise('500.25'), 50025);
assert.equal(parseAmountToPaise('10.999'), null);

const entries = [
  { id: '1', personId: 'p', flow: 'given', paymentMethods: ['online'], amountPaise: 100000, occurredAt: '2026-08-20T10:00:00.000Z', note: '' },
  { id: '2', personId: 'p', flow: 'received', paymentMethods: ['cash', 'online'], amountPaise: 50000, occurredAt: '2026-08-21T10:00:00.000Z', note: '' },
];
assert.deepEqual(summarizeEntries(entries), { given: 100000, received: 50000, pending: 50000 });
assert.equal(entriesForPeriod(entries, 'week', new Date('2026-08-22T12:00:00.000Z')).length, 2);

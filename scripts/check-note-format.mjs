import assert from 'node:assert/strict';

const { applyNoteFormat, parseNoteLine } = await import('../src/features/notes/note-format.ts');
const { normalizeNoteImageUris } = await import('../src/features/notes/note-image-utils.ts');

assert.equal(applyNoteFormat('hello', { start: 0, end: 5 }, 'bold').text, '**hello**');
assert.equal(applyNoteFormat('one\ntwo', { start: 0, end: 7 }, 'bullet').text, '- one\n- two');
assert.deepEqual(parseNoteLine('1. **Important** item'), { prefix: '1. ', tokens: [{ text: 'Important', bold: true, italic: false }, { text: ' item' }] });
assert.deepEqual(normalizeNoteImageUris({ imageUri: 'file://legacy.jpg' }), ['file://legacy.jpg']);
assert.deepEqual(normalizeNoteImageUris({ imageUris: ['one', 'two'], imageUri: 'legacy' }), ['one', 'two']);

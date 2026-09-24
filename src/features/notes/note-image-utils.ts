export function normalizeNoteImageUris(note: { imageUris?: string[]; imageUri?: string }) {
  return note.imageUris ?? (note.imageUri ? [note.imageUri] : []);
}

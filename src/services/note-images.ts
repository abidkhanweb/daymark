import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { normalizeNoteImageUris } from '@/features/notes/note-image-utils';

const directoryName = 'note-images';

async function persistImage(sourceUri: string, extension = 'jpg', base64?: string) {
  if (Platform.OS === 'web') return base64 ? `data:image/${extension};base64,${base64}` : sourceUri;
  const FileSystem = await import('expo-file-system/legacy');
  if (!FileSystem.documentDirectory) throw new Error('Image storage is unavailable.');
  const directory = `${FileSystem.documentDirectory}${directoryName}`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const uri = `${directory}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension.replace('jpeg', 'jpg')}`;
  if (base64) await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  else await FileSystem.copyAsync({ from: sourceUri, to: uri });
  return uri;
}

export async function pickNoteImages() {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.65, base64: Platform.OS === 'web' });
  if (result.canceled) return [];
  return Promise.all(result.assets.map((image) => {
    const extension = Platform.OS === 'web' ? 'jpeg' : image.mimeType?.split('/')[1] ?? 'jpeg';
    return persistImage(image.uri, extension, image.base64 ?? undefined);
  }));
}

export async function pasteNoteImage() {
  const image = await Clipboard.getImageAsync({ format: 'jpeg', jpegQuality: 0.65 });
  if (!image) return null;
  const base64 = image.data.slice(image.data.indexOf(',') + 1);
  return persistImage(image.data, 'jpeg', base64);
}

export async function copyNoteImage(uri: string) {
  const base64 = uri.startsWith('data:')
    ? uri.slice(uri.indexOf(',') + 1)
    : await import('expo-file-system/legacy').then((FileSystem) =>
        FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
      );
  await Clipboard.setImageAsync(base64);
}

export function removeNoteImage(uri?: string) {
  if (!uri || Platform.OS === 'web' || !uri.includes(`/${directoryName}/`)) return;
  import('expo-file-system/legacy').then((FileSystem) => FileSystem.deleteAsync(uri, { idempotent: true })).catch(() => undefined);
}

async function exportImage(uri: string) {
  if (uri.startsWith('data:')) return uri;
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
  const base64 = await import('expo-file-system/legacy').then((FileSystem) =>
    FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
  ).catch(() => null);
  return base64 ? `data:${mime};base64,${base64}` : null;
}

export async function exportNoteImages<T extends { notes: { imageUris: string[] }[] }>(data: T): Promise<T> {
  const notes = await Promise.all(data.notes.map(async (note) => {
    const images = await Promise.all(note.imageUris.map(exportImage));
    return { ...note, imageUris: images.filter((uri): uri is string => Boolean(uri)) };
  }));
  return { ...data, notes };
}

async function restoreImage(uri: string) {
  if (!uri.startsWith('data:image/')) return uri;
  const match = /^data:image\/([^;]+);base64,(.+)$/.exec(uri);
  return match ? persistImage(uri, match[1], match[2]) : null;
}

export async function restoreNoteImages<T extends { notes: { imageUris?: string[]; imageUri?: string }[] }>(data: T): Promise<T> {
  const notes = await Promise.all(data.notes.map(async (note) => {
    const images = await Promise.all(normalizeNoteImageUris(note).map(restoreImage));
    return { ...note, imageUri: undefined, imageUris: images.filter((uri): uri is string => Boolean(uri)) };
  }));
  return { ...data, notes };
}

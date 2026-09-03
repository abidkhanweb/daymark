import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { BACKUP_FILE_NAME } from './backup-format';

const SHARED_FILE_KEY = 'daymark.backup.shared-file.v1';
const PRIVATE_FILE = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${BACKUP_FILE_NAME}` : null;

export async function hasSharedBackup() {
  return Boolean(await AsyncStorage.getItem(SHARED_FILE_KEY));
}

export async function saveBackup(contents: string) {
  if (PRIVATE_FILE) await FileSystem.writeAsStringAsync(PRIVATE_FILE, contents);
  const sharedFile = await AsyncStorage.getItem(SHARED_FILE_KEY);
  if (!sharedFile) return false;
  try {
    await FileSystem.writeAsStringAsync(sharedFile, contents);
    return true;
  } catch {
    await AsyncStorage.removeItem(SHARED_FILE_KEY);
    return false;
  }
}

export async function exportBackup(contents: string) {
  await saveBackup(contents);
  if (Platform.OS !== 'android') throw new Error('File Manager backup is currently available on Android.');
  const currentFile = await AsyncStorage.getItem(SHARED_FILE_KEY);
  if (currentFile) {
    await FileSystem.writeAsStringAsync(currentFile, contents);
    return currentFile;
  }
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return null;
  const file = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, BACKUP_FILE_NAME, 'application/json');
  await FileSystem.writeAsStringAsync(file, contents);
  await AsyncStorage.setItem(SHARED_FILE_KEY, file);
  return file;
}

export async function pickBackup() {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
  if (result.canceled) return null;
  return FileSystem.readAsStringAsync(result.assets[0].uri);
}

import { AppData, initialData } from './model';
import { removeRecurringDuplicates } from './task-completion';
import { normalizeNoteImageUris } from '../notes/note-image-utils';

export function migrateData(input: Partial<AppData>): AppData {
  const migrateColor = (color: string) => color.toLocaleUpperCase() === '#6750A4' ? '#426A8C' : color;
  const categories = (input.categories?.length ? input.categories : initialData.categories).map((category) => ({ ...category, color: migrateColor(category.color) }));
  const migratedFolders = (input.folders?.length ? input.folders : initialData.folders).map((folder) => ({
    ...folder,
    color: migrateColor(folder.color),
    categoryId: folder.categoryId ?? (folder.id === 'work' ? 'work' : 'life'),
  }));
  const folders = migratedFolders.some((folder) => folder.id === 'uncategorized') ? migratedFolders : [initialData.folders[0], ...migratedFolders];
  const folderIds = new Set(folders.map((folder) => folder.id));
  return {
    profileName: input.profileName?.trim() ?? '',
    profileNickname: input.profileNickname?.trim() ?? '',
    profileOnboardingComplete: input.profileOnboardingComplete ?? false,
    categories,
    folders,
    customTemplates: input.customTemplates ?? [],
    hiddenTemplateTitles: input.hiddenTemplateTitles ?? [],
    tasks: removeRecurringDuplicates((input.tasks ?? initialData.tasks).map((task) => ({ ...task, folderId: folderIds.has(task.folderId) ? task.folderId : 'uncategorized', subtasks: task.subtasks ?? [], repeat: task.repeat ?? { type: 'none', weekdays: [] }, notificationIds: task.notificationIds ?? (task.notificationId ? [task.notificationId] : []) }))),
    notes: (input.notes ?? initialData.notes).map(({ imageUri, ...note }) => ({ ...note, imageUris: normalizeNoteImageUris({ ...note, imageUri }), folderId: folderIds.has(note.folderId) ? note.folderId : 'uncategorized' })),
  };
}

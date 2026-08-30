import { styles } from '@/styles/screens/notes.styles';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Image, ImageStyle, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import type { Note } from '@/features/tasks/model';
import { useTasks } from '@/features/tasks/task-store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { copyNoteImage, pasteNoteImage, pickNoteImage, removeNoteImage } from '@/services/note-images';
import { confirmAction } from '@/utils/confirm-action';
import { formatDate } from '@/utils/date';

type NotesView = 'list' | 'tiles';

export default function NotesScreen() {
  const colors = useAppTheme();
  const { notes, folders, deleteNote } = useTasks();
  const [editing, setEditing] = useState<Note | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<NotesView>('list');
  const [showViewMenu, setShowViewMenu] = useState(false);
  const edit = (note: Note | null) => { setEditing(note); setShowForm(true); };
  const chooseView = (next: NotesView) => { setView(next); setShowViewMenu(false); };

  const remove = (note: Note) => {
    confirmAction('Delete note?', `“${note.title}” will be permanently deleted.`, () => deleteNote(note.id));
  };
  const copy = async (note: Note) => {
    const copied = await Clipboard.setStringAsync([note.title, note.body].filter(Boolean).join('\n\n')).catch(() => false);
    Alert.alert(copied ? 'Copied' : 'Copy failed', copied ? 'Note copied to clipboard.' : 'The clipboard is unavailable. Please try again.');
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={[styles.kicker, { color: colors.primary }]}>CAPTURE</Text><View style={styles.headingRow}><Text style={[styles.title, { color: colors.text }]}>Notes</Text><View style={styles.viewSelector}><Pressable accessibilityLabel={`Notes view: ${view}`} accessibilityRole="button" onPress={() => setShowViewMenu((open) => !open)} style={[styles.viewButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name={view === 'list' ? 'view-list' : 'grid-view'} size={18} tintColor={colors.primary} /><Text style={[styles.viewButtonText, { color: colors.text }]}>{view === 'list' ? 'List' : 'Tiles'}</Text><AppIcon name="arrow-drop-down" size={20} tintColor={colors.textSecondary} /></Pressable>{showViewMenu && <View style={[styles.viewMenu, { backgroundColor: colors.surface, borderColor: colors.outline }]}>{(['list', 'tiles'] as const).map((option) => <Pressable key={option} accessibilityRole="menuitem" onPress={() => chooseView(option)} style={[styles.viewOption, option === view && { backgroundColor: colors.primaryContainer }]}><AppIcon name={option === 'list' ? 'view-list' : 'grid-view'} size={18} tintColor={colors.primary} /><Text style={[styles.viewOptionText, { color: colors.text }]}>{option === 'list' ? 'List' : 'Tiles'}</Text>{option === view && <AppIcon name="check" size={17} tintColor={colors.primary} />}</Pressable>)}</View>}</View></View><Text style={[styles.subtitle, { color: colors.textSecondary }]}>{notes.length} note{notes.length === 1 ? '' : 's'} connected to your folders.</Text></View>
        {notes.length ? <View style={[styles.notes, view === 'list' ? styles.list : styles.tiles]}>{notes.map((note, index) => {
          const folder = folders.find((item) => item.id === note.folderId);
          return <View key={note.id} style={[styles.note, view === 'list' ? styles.noteList : styles.noteTile, { backgroundColor: index % 3 === 0 ? colors.primaryContainer : colors.surface, borderColor: colors.outline }]}>
            <View style={styles.noteTop}>
              <View style={styles.folderInfo}><View style={[styles.folderIcon, { backgroundColor: folder?.color ?? colors.primary }]}><AppIcon name="notes" size={17} tintColor="#FFFFFF" /></View><Text style={[styles.folderName, { color: colors.textSecondary }]}>{folder?.name ?? 'Unsorted'}</Text></View>
            </View>
            <Pressable onPress={() => edit(note)} style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
              {note.imageUri && <NoteImage uri={note.imageUri} label={`${note.title} attachment`} style={view === 'list' && styles.noteImageList} />}
              <Text numberOfLines={view === 'list' ? 3 : note.imageUri ? 3 : 5} style={[styles.noteBody, { color: colors.textSecondary }]}>{note.body || 'Tap to add details'}</Text>
            </Pressable>
            <View style={styles.noteFooter}><Text style={[styles.updated, { color: colors.textSecondary }]}>Updated {formatDate(note.updatedAt)}</Text><View style={styles.noteActions}><Pressable accessibilityLabel={`Copy ${note.title}`} onPress={() => copy(note)} style={styles.iconButton}><AppIcon name="content-copy" size={18} tintColor={colors.textSecondary} /></Pressable><Pressable accessibilityLabel={`Edit ${note.title}`} onPress={() => edit(note)} style={styles.iconButton}><AppIcon name="edit" size={19} tintColor={colors.primary} /></Pressable><Pressable accessibilityLabel={`Delete ${note.title}`} onPress={() => remove(note)} style={styles.iconButton}><AppIcon name="delete-outline" size={19} tintColor={colors.error} /></Pressable></View></View>
          </View>;
        })}</View> : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name="note-add" size={26} tintColor={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>No notes yet</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Capture an idea, checklist, or context for a task.</Text><Pressable onPress={() => edit(null)} style={[styles.emptyButton, { backgroundColor: colors.primary }]}><Text style={styles.emptyButtonText}>Create note</Text></Pressable></View>}
      </ScrollView>
    </SafeAreaView>
    <FloatingActionButton icon="edit-note" label="Create note" onPress={() => edit(null)} />
    {showForm && <NoteForm note={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
  </View>;
}

function NoteForm({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const colors = useAppTheme();
  const { folders, addNote, updateNote, deleteNote } = useTasks();
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [folderId, setFolderId] = useState(note?.folderId ?? folders[0]?.id ?? 'uncategorized');
  const [imageUri, setImageUri] = useState(note?.imageUri);
  const replaceImage = (image?: string) => {
    if (imageUri && imageUri !== note?.imageUri) removeNoteImage(imageUri);
    setImageUri(image);
  };
  const close = () => { if (imageUri && imageUri !== note?.imageUri) removeNoteImage(imageUri); onClose(); };

  const chooseImage = async () => {
    try {
      const image = await pickNoteImage();
      if (image) replaceImage(image);
    } catch {
      Alert.alert('Image unavailable', 'The selected image could not be attached.');
    }
  };
  const pasteImage = async () => {
    try {
      const image = await pasteNoteImage();
      if (image) replaceImage(image);
      else Alert.alert('No image found', 'Copy an image first, then try again.');
    } catch {
      Alert.alert('Paste failed', 'The clipboard image could not be attached.');
    }
  };
  const save = () => {
    if (!title.trim()) { Alert.alert('Note title required', 'Enter a title before saving.'); return; }
    const input = { title: title.trim(), body: body.trim(), folderId, imageUri };
    if (note) updateNote(note.id, input); else addNote(input);
    onClose();
  };
  const remove = () => {
    if (!note) return;
    confirmAction('Delete note?', `“${note.title}” will be permanently deleted.`, () => { deleteNote(note.id); onClose(); });
  };

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoiding}>
      <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}><Pressable hitSlop={12} onPress={close}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text></Pressable><Text style={[styles.modalTitle, { color: colors.text }]}>{note ? 'Edit note' : 'New note'}</Text><Pressable hitSlop={12} onPress={save}><Text style={{ color: colors.primary, fontWeight: '800' }}>Save</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextInput autoFocus value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.textSecondary} style={[styles.titleInput, { color: colors.text }]} />
          <ScrollView style={styles.folderScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderRow}>{folders.map((folder) => <Pressable key={folder.id} onPress={() => setFolderId(folder.id)} style={[styles.folderChip, { backgroundColor: folder.id === folderId ? colors.primaryContainer : colors.surface, borderColor: folder.id === folderId ? colors.primary : colors.outline }]}><View style={[styles.dot, { backgroundColor: folder.color }]} /><Text style={{ color: colors.text, fontWeight: '600' }}>{folder.name}</Text></Pressable>)}</ScrollView>
          <View style={styles.imageActions}><ImageButton icon="add-photo-alternate" label="Gallery" onPress={chooseImage} /><ImageButton icon="content-paste" label="Paste image" onPress={pasteImage} />{imageUri && <ImageButton icon="delete-outline" label="Remove" onPress={() => replaceImage()} destructive />}</View>
          {imageUri && <NoteImage uri={imageUri} label="Note attachment preview" style={styles.imagePreview} />}
          <TextInput multiline value={body} onChangeText={setBody} placeholder="Start writing…" placeholderTextColor={colors.textSecondary} textAlignVertical="top" style={[styles.bodyInput, imageUri && styles.bodyInputWithImage, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.outline }]} />
          {note && <Pressable onPress={remove} style={styles.deleteNote}><AppIcon name="delete-outline" size={20} tintColor={colors.error} /><Text style={{ color: colors.error, fontWeight: '800' }}>Delete note</Text></Pressable>}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

function ImageButton({ icon, label, onPress, destructive }: { icon: 'add-photo-alternate' | 'content-paste' | 'delete-outline'; label: string; onPress: () => void; destructive?: boolean }) {
  const colors = useAppTheme();
  const color = destructive ? colors.error : colors.primary;
  return <Pressable accessibilityLabel={label} onPress={onPress} style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name={icon} size={18} tintColor={color} /><Text style={[styles.imageButtonText, { color }]}>{label}</Text></Pressable>;
}

function NoteImage({ uri, label, style }: { uri: string; label: string; style?: StyleProp<ImageStyle> | false }) {
  const colors = useAppTheme();
  const copy = async () => {
    try {
      await copyNoteImage(uri);
      Alert.alert('Image copied', 'The image is ready to paste.');
    } catch {
      Alert.alert('Copy failed', 'The image could not be copied.');
    }
  };
  return <View style={[styles.imageCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline }]}><Image accessibilityLabel={label} source={{ uri }} resizeMode="cover" style={[styles.noteImage, style]} /><Pressable accessibilityLabel="Copy image" android_ripple={{ color: colors.primaryContainer }} onPress={(event) => { event.stopPropagation(); copy(); }} style={[styles.copyImageButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name="content-copy" size={18} tintColor={colors.primary} /></Pressable></View>;
}
